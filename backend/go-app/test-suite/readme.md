# Shuffle test suite

The suite has two layers. Direct integration tests exercise Shuffle's storage
and cache behavior against OpenSearch and Memcached without running the
backend. End-to-end tests send HTTP requests to an already-running backend.

Build tags keep both layers out of the normal unit-test command.

## Direct OpenSearch and Memcached integration tests

These tests initialize `shuffle-shared` with database caching enabled. They
cover Memcached set/update/delete behavior, statistics counter updates, the
workflow and execution storage lifecycle, and the interaction between the
workflow cache and OpenSearch. A backend process is not needed.

Set the same OpenSearch and Memcached connection variables used by the backend
and run:

```sh
SHUFFLE_OPENSEARCH_URL=https://localhost:9200 \
SHUFFLE_OPENSEARCH_USERNAME=admin \
SHUFFLE_OPENSEARCH_PASSWORD=<password> \
SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY=true \
SHUFFLE_MEMCACHED=localhost:11211 \
  go run -tags=integration ./test-suite -test.v
```

API-key authentication is also supported through
`SHUFFLE_OPENSEARCH_APIKEY`. `SHUFFLE_OPENSEARCH_URL` is required so the test
cannot silently connect to the connector's default hostname.

`SHUFFLE_MEMCACHED` must be present when `go test` starts because
`shuffle-shared` reads it during package initialization. The similarly named
`SHUFFLE_MEMCACHED_URL` variable is not used by `shuffle-shared`.

Test documents use the `shuffle_integration_test` index prefix by default. It
can be changed without affecting the backend's normal prefix:

```sh
SHUFFLE_TEST_OPENSEARCH_INDEX_PREFIX=my_shuffle_tests \
  go run -tags=integration ./test-suite -test.v
```

Every workflow, execution, environment, and cache entry uses unique IDs and is
deleted with `t.Cleanup`. OpenSearch may retain the empty test indexes after the
documents are removed.

The direct suite uses a normal runner instead of `go test` because
`shuffle-shared` versions through v1.2.77 reject Go test binaries during package
initialization and deliberately sleep before exiting. The runner still uses
Go's `testing` package for assertions, logs, and `t.Cleanup`.

## Backend HTTP end-to-end tests

Start OpenSearch and the backend, then run:

```sh
go run .
```

In another terminal, run the strict E2E gate:

```sh
./test-suite/run_e2e.sh
```

The runner defaults to strict mode. It enables managed execution, abort, and
parent/child subflow fixtures, nine mutation executions, and the forced embedded
health workflow. It also runs eight simultaneous executions to detect ID,
authorization, payload, result, cache, and history contamination. Missing API/org credentials fail the gate instead of silently
skipping coverage. For a deliberately non-destructive
reachability-only run, explicitly set `SHUFFLE_E2E_STRICT=false` and select the
specific smoke tests with `-run`.

The E2E suite targets `http://localhost:5001` by default. Override it with
`SHUFFLE_TEST_BASE_URL`. The backend health smoke uses `/api/v1/health` and
requires both HTTP 200 and `"success": true`; a disabled healthcheck is a test
failure rather than a reachability pass.
Health, anonymous-authentication, and CORS checks need
no user credentials. Authenticated and execution checks use
`SHUFFLE_TEST_API_KEY`; set `SHUFFLE_TEST_ORG_ID` when the API key can access
more than one organization.

The execution tests are opt-in because they create real executions. Use a
dedicated test account and either provide a known workflow or allow the suite
to create and delete an ephemeral one-action Shuffle Tools workflow:

```sh
SHUFFLE_TEST_BASE_URL=http://localhost:5001 \
SHUFFLE_TEST_API_KEY=<test-api-key> \
SHUFFLE_TEST_ORG_ID=<test-org-uuid> \
SHUFFLE_E2E_MANAGED_WORKFLOW=true \
  ./test-suite/run_e2e.sh -run '^TestExecutionLifecycle$'
```

To execute an existing workflow instead, set `SHUFFLE_E2E_WORKFLOW_ID`. Its
expected terminal status defaults to `FINISHED,SUCCESS`; intentional failure
workflows can override this with `SHUFFLE_E2E_EXPECT_STATUS=FAILURE`.

The lifecycle gate exercises both asynchronous execution and the synchronous
`?wait=true` response. It then calls the rerun endpoint for the finished
execution and verifies that the operation is idempotent: authorization,
argument, results, terminal status, and persisted history must not change.

### Subflows, aborts, health workflow, and mutation campaigns

In strict mode the subflow test creates its own child and parent workflows. It
can instead use `SHUFFLE_E2E_SUBFLOW_WORKFLOW_ID` for a larger existing parent.
It executes the parent, follows each
child using the subflow result, and verifies child authorization, parent ID,
source node, execution depth, and terminal state:

```sh
SHUFFLE_E2E_SUBFLOW_WORKFLOW_ID=<parent-workflow-uuid> \
  ./test-suite/run_e2e.sh -run '^TestSubflowExecutionLifecycle$'
```

Strict abort testing creates a delayed ephemeral workflow automatically. To
test a specific longer workflow instead:

```sh
SHUFFLE_E2E_ABORT_WORKFLOW_ID=<slow-workflow-uuid> \
  ./test-suite/run_e2e.sh -run '^TestExecutionAbortLifecycle$'
```

Shuffle's embedded health workflow remains opaque to the test code. The suite
invokes it through the production health endpoint, so the large embedded blob
is not copied or parsed by the tests:

```sh
SHUFFLE_E2E_HEALTH_WORKFLOW=true \
  ./test-suite/run_e2e.sh -run '^TestEmbeddedHealthWorkflow$'
```

The bounded mutation campaign replays deterministic payload recipes through
real executions. Its first cases cover empty/nested/Unicode input; lengths
32499, 32500, and 32501 around the large-execution storage boundary; and
1048575, 1048576, and 1048577 around the usual Memcached item boundary. Additional
cases are derived from the recorded seed:

```sh
SHUFFLE_E2E_MANAGED_WORKFLOW=true \
SHUFFLE_E2E_MUTATION_CASES=12 \
SHUFFLE_E2E_MUTATION_SEED=1337 \
  ./test-suite/run_e2e.sh -run '^TestExecutionMutationCampaign$'
```

Pure parser/envelope fuzzing is separate from real execution mutation, so it
can use Go's native fuzz engine without repeatedly creating backend state:

```sh
go test -tags=e2e ./test-suite \
  -run '^$' -fuzz '^FuzzDecodeSubflowResults$' -fuzztime 30s
```

The GitHub workflow runs both `FuzzDecodeSubflowResults` and
`FuzzExecutionArgumentJSONEnvelope` for 30 seconds. They are an independent job
and do not need VM credentials, so they still run when OpenSearch, Memcached, or
the remote backend is unavailable. Both fuzz steps complete before the job
reports failure, allowing one run to expose failures in both protocol surfaces.

The campaign is capped at 100 real executions per invocation. A failing case
writes a redacted JSON artifact. Set `SHUFFLE_E2E_ARTIFACT_DIR` to retain those
artifacts outside Go's temporary directory.

Concurrent isolation defaults to eight executions and is bounded from 2 to 32.
Override it with `SHUFFLE_E2E_CONCURRENCY`. Each execution must have unique IDs
and authorization, must reject every neighboring execution's token, and must
retain its own argument/result in both stream reads and persisted history.

Per-execution polling defaults to five minutes (`SHUFFLE_E2E_TIMEOUT`),
subflows to three minutes (`SHUFFLE_E2E_SUBFLOW_TIMEOUT`), and the embedded health
workflow to twelve minutes (`SHUFFLE_E2E_HEALTH_TIMEOUT`). The complete test
process is independently stopped after fifteen minutes by default; change it
with `SHUFFLE_E2E_TEST_TIMEOUT`.

Strict health assertions validate workflow, app, datastore, file, and
OpenSearch component results independently. OpenSearch defaults to requiring
`green` with zero unassigned shards. A deliberately replicated single-node
test cluster can opt into `SHUFFLE_E2E_OPENSEARCH_HEALTH=yellow`, but unassigned
shards remain a failure because they represent unavailable replicas.

Use only a development or dedicated test OpenSearch instance and test account.

## GitHub Actions integration gate

The `Backend Integration` workflow runs on pull requests, pushes, and manual
dispatches that affect `backend/go-app`. All three event types use the remote
integration VM, so the GitHub runner does not start OpenSearch or Memcached.
Pull requests must originate from a branch in this repository. Forked pull
requests are rejected because GitHub does not provide repository secrets to
them, and exposing the VM to untrusted fork code would be unsafe. Dependabot
pull requests are rejected for the same reason; a maintainer can apply the
update from a trusted repository branch to run this gate.

The remote job references the `shuffle-integration-vm` GitHub Environment.
Configure that environment with one or more required reviewers. Each workflow
run will then pause before receiving credentials or connecting to the VM. From
the pending workflow run, select **Review deployments**, choose
`shuffle-integration-vm`, and select **Approve and deploy**. Move the variables
and secrets below into that environment when possible so they are scoped to
approved integration jobs.

Configure these repository variables for a remote VM:

```text
SHUFFLE_INTEGRATION_REMOTE_TAILSCALE=true
SHUFFLE_INTEGRATION_REMOTE_HOST=100.104.105.63
SHUFFLE_INTEGRATION_BACKEND_URL=http://100.104.105.63:5001
SHUFFLE_INTEGRATION_ORG_ID=<test-org-uuid>
SHUFFLE_INTEGRATION_OPENSEARCH_URL=https://100.104.105.63:9200
SHUFFLE_INTEGRATION_OPENSEARCH_SKIPSSL_VERIFY=true
SHUFFLE_INTEGRATION_MEMCACHED=100.104.105.63:11211
```

Add `TAILSCALE_AUTHKEY` as an environment secret when the VM is reachable
through Tailscale. Generate it with the `tag:ci` identity and enable reusable
and ephemeral behavior. Enable pre-approval as well when the tailnet uses
device approval. The tailnet access policy must allow that tag to reach the
integration VM. If the VM has another private-network path from the runner, set
`SHUFFLE_INTEGRATION_REMOTE_TAILSCALE=false`.

Configure OpenSearch authentication using either:

```text
SHUFFLE_INTEGRATION_OPENSEARCH_APIKEY
```

or both:

```text
SHUFFLE_INTEGRATION_OPENSEARCH_USERNAME
SHUFFLE_INTEGRATION_OPENSEARCH_PASSWORD
```

These are repository secrets, not variables. Never put credentials in the
workflow file. Use a dedicated integration OpenSearch user with permission to
create, read, search, and delete only test indexes where possible.

Add the test account API key as the environment secret
`SHUFFLE_INTEGRATION_API_KEY`. The E2E job maps the backend URL, organization,
and API key to the same `SHUFFLE_TEST_BASE_URL`, `SHUFFLE_TEST_ORG_ID`, and
`SHUFFLE_TEST_API_KEY` variables used by `run_e2e.sh`.

Each workflow run uses a unique `shuffle_ci_<run>_<attempt>` OpenSearch prefix.
The remote job is serialized and deletes only indexes belonging to its own run.
The test functions also use unique object and cache keys. Even so, the remote
OpenSearch and especially Memcached instance should be dedicated to tests:
Memcached does not provide server-side namespaces or access controls, and a
flush/restart or key collision could affect other users of the same instance.

The workflow invokes `test-suite/run_integration.sh`, which gives both the
compile and test phases a five-minute timeout by default. On a test timeout it
requests a Go stack dump before terminating the process. Override the limit
with `SHUFFLE_TEST_TIMEOUT_SECONDS` when running the script locally.
