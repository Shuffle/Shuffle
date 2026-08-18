#!/usr/bin/env bash

set -u

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

set -a
source "$script_dir/../../.env"
set +a

export SHUFFLE_OPENSEARCH_URL=https://100.104.105.63:9200
export SHUFFLE_OPENSEARCH_SKIPSSL_VERIFY=true
export DEBUG=true
export SHUFFLE_MEMCACHED=100.104.105.63:11211

timeout_seconds="${SHUFFLE_TEST_TIMEOUT_SECONDS:-120}"
test_binary="${TMPDIR:-/tmp}/shuffle-integration-test-$$"
export GOCACHE="${GOCACHE:-${TMPDIR:-/tmp}/shuffle-go-build-cache}"
build_pid=""
test_pid=""
watchdog_pid=""

cleanup() {
	if [[ -n "$watchdog_pid" ]]; then
		kill "$watchdog_pid" 2>/dev/null || true
	fi
	if [[ -n "$test_pid" ]]; then
		kill -TERM "$test_pid" 2>/dev/null || true
	fi
	if [[ -n "$build_pid" ]]; then
		kill -TERM "$build_pid" 2>/dev/null || true
	fi
	rm -f "$test_binary"
}
trap cleanup EXIT INT TERM

go build -tags=integration -o "$test_binary" ./test-suite &
build_pid=$!
(
	sleep "$timeout_seconds"
	echo "Integration test build exceeded ${timeout_seconds}s; stopping it." >&2
	kill -TERM "$build_pid" 2>/dev/null || true
) &
watchdog_pid=$!

set +e
wait "$build_pid"
status=$?
set -e
kill "$watchdog_pid" 2>/dev/null || true
wait "$watchdog_pid" 2>/dev/null || true
watchdog_pid=""
build_pid=""
if [[ "$status" -ne 0 ]]; then
	exit "$status"
fi

"$test_binary" -test.v "$@" &
test_pid=$!
(
	sleep "$timeout_seconds"
	echo "Integration test exceeded ${timeout_seconds}s; requesting a Go stack dump." >&2
	kill -QUIT "$test_pid" 2>/dev/null || true
	sleep 5
	kill -KILL "$test_pid" 2>/dev/null || true
) &
watchdog_pid=$!

set +e
wait "$test_pid"
status=$?
set -e

kill "$watchdog_pid" 2>/dev/null || true
wait "$watchdog_pid" 2>/dev/null || true
watchdog_pid=""
test_pid=""
exit "$status"
