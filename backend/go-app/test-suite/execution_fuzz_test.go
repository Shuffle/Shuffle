//go:build e2e

package testsuite

import (
	"encoding/json"
	"testing"
	"unicode/utf8"
)

func TestExecutionMutationBoundaryRecipes(t *testing.T) {
	cases := mutationCases(1337, 9)
	if len(cases) != 9 {
		t.Fatalf("got %d fixed mutation cases, want 9", len(cases))
	}
	wantLengths := map[string]int{
		"large-32499":   32499,
		"large-32500":   32500,
		"large-32501":   32501,
		"large-1048575": 1048575,
		"large-1048576": 1048576,
		"large-1048577": 1048577,
	}
	for _, testCase := range cases {
		if want, found := wantLengths[testCase.Recipe]; found && len(testCase.Argument) != want {
			t.Errorf("%s has %d bytes, want %d", testCase.Recipe, len(testCase.Argument), want)
		}
		if want, found := wantLengths[testCase.Recipe]; found {
			argument := buildMutationArgument("boundary-marker", testCase)
			if len(argument) != want {
				t.Errorf("built %s execution argument has %d bytes, want %d", testCase.Recipe, len(argument), want)
			}
			if !resultContainsArgument(argument, argument) {
				t.Errorf("built %s argument cannot be recognized as a complete round-trip", testCase.Recipe)
			}
		}
	}
}

func TestResultContainsArgumentSemantics(t *testing.T) {
	if !resultContainsArgument("{\n  \"value\": 1,\n  \"items\": [true, null]\n}", `{"items":[true,null],"value":1}`) {
		t.Fatal("semantically identical JSON should be accepted despite formatting and key order")
	}
	if resultContainsArgument(`{"value":2}`, `{"value":1}`) {
		t.Fatal("different JSON values must not be accepted")
	}
	if !resultContainsArgument("raw-value", "raw-value") {
		t.Fatal("identical raw values should be accepted")
	}
}

// FuzzDecodeSubflowResults is deliberately pure: it exercises the E2E
// subflow-result parser without creating workflows or external side effects.
// The real subflow lifecycle remains in TestSubflowExecutionLifecycle.
func FuzzDecodeSubflowResults(f *testing.F) {
	seeds := []string{
		`{"success":true,"execution_id":"11111111-1111-4111-8111-111111111111","authorization":"token","result":"ok","result_set":true}`,
		`[{"success":true,"execution_id":"11111111-1111-4111-8111-111111111111"},{"success":false,"execution_id":"22222222-2222-4222-8222-222222222222"}]`,
		`"{\"success\":true,\"execution_id\":\"11111111-1111-4111-8111-111111111111\"}"`,
		`null`,
		`{broken`,
		``,
	}
	for _, seed := range seeds {
		f.Add(seed)
	}

	f.Fuzz(func(t *testing.T, input string) {
		results := decodeSubflowResults(input)
		for _, result := range results {
			if result.ExecutionID == "" {
				t.Fatal("decoder returned a subflow without an execution ID")
			}
		}
	})
}

// FuzzExecutionArgumentJSONEnvelope verifies that arbitrary execution
// arguments survive the JSON request envelope exactly. Network fuzzing uses
// the bounded, reproducible TestExecutionMutationCampaign instead.
func FuzzExecutionArgumentJSONEnvelope(f *testing.F) {
	f.Add("")
	f.Add(`{"hello":"world"}`)
	f.Add("こんにちは 🌍\x00\n")
	f.Add(string(make([]byte, 32501)))

	f.Fuzz(func(t *testing.T, argument string) {
		validationErr := validateExecutionArgument(argument)
		if !utf8.ValidString(argument) {
			if validationErr == nil {
				t.Fatal("invalid UTF-8 execution argument was not rejected")
			}
			return
		}
		if validationErr != nil {
			t.Fatalf("valid UTF-8 execution argument was rejected: %v", validationErr)
		}
		payload := map[string]string{"execution_argument": argument}
		encoded, err := json.Marshal(payload)
		if err != nil {
			t.Fatalf("marshal argument: %v", err)
		}
		var decoded map[string]string
		if err := json.Unmarshal(encoded, &decoded); err != nil {
			t.Fatalf("unmarshal argument: %v", err)
		}
		if decoded["execution_argument"] != argument {
			t.Fatalf("argument changed across JSON envelope: got %d bytes, want %d", len(decoded["execution_argument"]), len(argument))
		}
	})
}
