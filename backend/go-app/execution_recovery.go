package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/shuffle/opensearch-go/v4/opensearchapi"
	shuffle "github.com/shuffle/shuffle-shared"
)

// Recover from persisted state, including runs whose Orborus timer was lost on restart.
func recoverOnpremExecutions(ctx context.Context, backendURL string) error {
	if strings.EqualFold(os.Getenv("SHUFFLE_DISABLE_RERUN_AND_ABORT"), "true") {
		return nil
	}
	db := shuffle.GetProject()
	if db.DbType != "opensearch" {
		return nil
	}
	if os.Getenv("SHUFFLE_MEMCACHED") != "" {
		claimed, err := shuffle.ClaimCacheKey("onprem-execution-recovery", 300)
		if err != nil {
			return fmt.Errorf("claim execution recovery: %w", err)
		}
		if !claimed {
			return nil
		}
		defer shuffle.DeleteCache(context.Background(), "onprem-execution-recovery")
	}
	query := fmt.Sprintf(`{"size":250,"sort":["_doc"],"query":{"bool":{"filter":[{"term":{"status":"EXECUTING"}},{"range":{"started_at":{"lt":%d}}}]}}}`, time.Now().Add(-5*time.Minute).Unix())
	page, err := db.Es.Search(ctx, &opensearchapi.SearchReq{
		Indices: []string{shuffle.GetESIndexPrefix("workflowexecution")}, Body: strings.NewReader(query),
		Params: opensearchapi.SearchParams{Scroll: 2 * time.Minute},
	})
	if err != nil {
		if strings.Contains(err.Error(), "index_not_found_exception") {
			return nil
		}
		return fmt.Errorf("scan unfinished executions: %w", err)
	}
	page.Inspect().Response.Body.Close()
	hits, scrollID := page.Hits.Hits, ""
	if page.ScrollID != nil {
		scrollID = *page.ScrollID
	}
	defer func() {
		if scrollID != "" {
			cleanupCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			_, _ = db.Es.Scroll.Delete(cleanupCtx, opensearchapi.ScrollDeleteReq{ScrollIDs: []string{scrollID}})
		}
	}()
	if page.Timeout || page.Shards.Failed > 0 {
		return fmt.Errorf("unfinished execution scan was incomplete")
	}
	client := &http.Client{Timeout: 30 * time.Second}
	recovered, failed := 0, 0
	seen := map[string]bool{}
	for len(hits) > 0 {
		for _, hit := range hits {
			if err := ctx.Err(); err != nil {
				return err
			}
			var stored shuffle.WorkflowExecution
			if err := json.Unmarshal(hit.Source, &stored); err != nil {
				return fmt.Errorf("decode unfinished execution: %w", err)
			}
			if stored.ExecutionId == "" || seen[stored.ExecutionId] {
				continue
			}
			seen[stored.ExecutionId] = true
			current, err := shuffle.GetWorkflowExecution(ctx, stored.ExecutionId)
			if err != nil || current == nil {
				failed++
				continue
			}
			if current.Status != "EXECUTING" {
				// Reconcile a terminal cache result instead of restarting completed work.
				if current.Status == "FINISHED" || current.Status == "FAILURE" || current.Status == "ABORTED" {
					if err := shuffle.SetWorkflowExecution(ctx, *current, true); err != nil {
						failed++
					}
				}
				continue
			}
			if current.Authorization == "" || current.Workflow.ID == "" {
				failed++
				continue
			}
			hasOnprem := false
			for _, action := range current.Workflow.Actions {
				if !strings.EqualFold(action.Environment, "cloud") {
					hasOnprem = true
					break
				}
			}
			if !hasOnprem {
				continue
			}
			// Intentional user-input waits must not be turned into automatic reruns.
			waitingForUser := false
			for _, result := range current.Results {
				if result.Status == "WAITING" && result.Action.AppName == "User Input" {
					waitingForUser = true
					break
				}
			}
			if waitingForUser {
				continue
			}
			// Older workers kept the initial child reference only in this cache.
			results := append([]shuffle.ActionResult(nil), current.Results...)
			for _, action := range current.Workflow.Actions {
				if action.AppName != "shuffle-subflow" {
					continue
				}
				found := false
				for _, result := range results {
					if result.Action.ID == action.ID {
						found = true
						break
					}
				}
				if !found {
					if cached, err := shuffle.GetCache(ctx, fmt.Sprintf("%s_%s_sinkholed_result", current.ExecutionId, action.ID)); err == nil {
						if data, ok := cached.([]byte); ok {
							results = append(results, shuffle.ActionResult{Action: action, Result: string(data)})
						}
					}
				}
			}
			// Replay a completed child's result, not the child workflow's actions.
			for _, result := range results {
				if result.Action.AppName != "shuffle-subflow" || result.Status == "SKIPPED" {
					continue
				}
				var children []shuffle.SubflowData
				if err := json.Unmarshal([]byte(result.Result), &children); err != nil {
					var child shuffle.SubflowData
					if err := json.Unmarshal([]byte(result.Result), &child); err != nil {
						continue
					}
					children = []shuffle.SubflowData{child}
				}
				for _, reference := range children {
					if reference.ExecutionId == "" {
						var startup struct {
							Success *bool `json:"success"`
						}
						if json.Unmarshal([]byte(result.Result), &startup) == nil && startup.Success != nil && !*startup.Success {
							// Recover an explicit startup error discarded by an older worker.
							result.ExecutionId, result.Authorization, result.Status = current.ExecutionId, current.Authorization, "FAILURE"
							data, err := json.Marshal(result)
							if err != nil {
								failed++
								continue
							}
							request, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(backendURL, "/")+"/api/v1/streams", strings.NewReader(string(data)))
							if err != nil {
								failed++
								continue
							}
							request.Header.Set("Content-Type", "application/json")
							response, err := client.Do(request)
							if err != nil {
								failed++
								continue
							}
							var acknowledgement struct {
								Success bool `json:"success"`
							}
							decodeErr := json.NewDecoder(io.LimitReader(response.Body, 4096)).Decode(&acknowledgement)
							response.Body.Close()
							if response.StatusCode != http.StatusOK || decodeErr != nil || !acknowledgement.Success {
								failed++
							}
						}
						continue
					}
					if reference.ResultSet {
						continue
					}
					child, err := shuffle.GetWorkflowExecution(ctx, reference.ExecutionId)
					if err != nil || child == nil {
						failed++
						continue
					}
					if child.Status != "FINISHED" && child.Status != "ABORTED" && child.Status != "FAILURE" {
						continue
					}
					if child.ExecutionParent != current.ExecutionId || child.ExecutionSourceNode != result.Action.ID || child.ExecutionSourceAuth != current.Authorization || (reference.Authorization != "" && child.Authorization != reference.Authorization) {
						failed++
						continue
					}
					if err := shuffle.RunFixParentWorkflowResult(ctx, *child); err != nil {
						log.Printf("[WARNING][%s] Completed subflow callback recovery failed for child %s: %s", current.ExecutionId, child.ExecutionId, err)
						failed++
					}
				}
			}
			// A replayed callback may have finished the parent while we were scanning.
			current, err = shuffle.GetWorkflowExecution(ctx, current.ExecutionId)
			if err != nil || current == nil {
				failed++
				continue
			}
			if current.Status != "EXECUTING" {
				continue
			}
			endpoint := fmt.Sprintf("%s/api/v1/workflows/%s/executions/%s/rerun", strings.TrimRight(backendURL, "/"), current.Workflow.ID, current.ExecutionId)
			request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, nil)
			if err != nil {
				failed++
				continue
			}
			request.Header.Set("Authorization", "Bearer "+current.Authorization)
			response, err := client.Do(request)
			if err != nil {
				failed++
				continue
			}
			var acknowledgement struct {
				Success bool `json:"success"`
			}
			decodeErr := json.NewDecoder(io.LimitReader(response.Body, 4096)).Decode(&acknowledgement)
			response.Body.Close()
			if response.StatusCode != http.StatusOK || decodeErr != nil || !acknowledgement.Success {
				log.Printf("[WARNING][%s] Persisted execution recovery was not accepted (HTTP %d)", current.ExecutionId, response.StatusCode)
				failed++
				continue
			}
			recovered++
		}
		if scrollID == "" {
			break
		}
		next, err := db.Es.Scroll.Get(ctx, opensearchapi.ScrollGetReq{ScrollID: scrollID, Params: opensearchapi.ScrollGetParams{Scroll: 2 * time.Minute}})
		if err != nil {
			return fmt.Errorf("continue unfinished execution scan: %w", err)
		}
		next.Inspect().Response.Body.Close()
		if next.Timeout || next.Shards.Failed > 0 {
			return fmt.Errorf("unfinished execution scroll was incomplete")
		}
		hits = next.Hits.Hits
		if next.ScrollID != nil {
			scrollID = *next.ScrollID
		}
	}
	log.Printf("[INFO] Persisted execution recovery: %d requeued, %d failed", recovered, failed)
	if failed > 0 {
		return fmt.Errorf("%d execution recovery operations failed; retry on next scan", failed)
	}
	return nil
}
