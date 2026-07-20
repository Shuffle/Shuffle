# Integration test findings

These are production behavior gaps intentionally exposed by the integration
tests. The assertion paths must not delete or repair state before checking it.
Manual deletion inside `t.Cleanup` is retained only to prevent test artifacts
from remaining after a pass or failure.

## User and authentication lifecycle

1. `DeleteUsersAccount` does not delete the general user caches
   `user_<id>` and `user_<lowercase username>`. A deleted user can therefore be
   returned by `GetUser` until those entries expire. Delete both cache formats
   as part of account deletion and treat a Memcached cache miss as success.

2. Rotating a session with `SetSession` does not invalidate
   `session_<old token>`. If the old session was previously resolved, its cached
   user continues to authenticate. Pass the previous token into the rotation
   operation (or add a dedicated rotation function), then delete the old cache
   and old `sessions` document before accepting the new token.

3. `DeleteUsersAccount` deletes the user document but leaves corresponding
   documents in the `apikey` and `sessions` indexes. They are not currently used
   by `GetApikey`/`GetSessionNew`, but they retain stale credential data and
   should be removed during account deletion and rotation.

4. `SetApikey` writes a document to the `apikey` index, while `GetApikey`
   searches the `Users` index and its Memcached lookup path is commented out.
   Choose one source of truth and make set/get/delete/cache behavior symmetric.

5. `SetUser` logs a Memcached cache miss while invalidating `Users_<apikey>` as
   an error. Cache invalidation is idempotent; `memcache.ErrCacheMiss` should be
   ignored or logged at debug level.

6. Rotating a user API key does not invalidate `Users_<old API key>`. If the
   old key was authenticated before rotation, the cached user can continue to
   authenticate with it. The integration test intentionally leaves this cache
   populated before calling `SetUser`/`SetApikey` and requires the old key to
   stop working without test-side eviction.

## Datastore lifecycle

1. Deleting an `org_cache` document through `DeleteKey` removes the individual
   item cache but does not invalidate category query caches such as
   `org_cache__<org>_<category>_50`. Centralize datastore deletion and query
   cache invalidation in one function instead of requiring callers to repair it.

2. `SetDatastoreKeyBulk` can receive an HTTP 200 bulk response containing
   `"errors": true` and still return `nil`. Parse every bulk item and return an
   error containing the failed document IDs and OpenSearch reasons.

3. The current `value` mapping indexes the whole datastore value as one keyword
   term. OpenSearch rejects values above 32,766 bytes. Change the mapping (for
   example, make the stored value non-indexed) if larger datastore values are a
   supported requirement.

## Backend end-to-end health findings

The forced `/api/v1/health?force=true` run against the dedicated on-prem test
backend on 2026-07-14 exposed all of the following. The E2E test reports every
component and does not accept the top-level HTTP 200 as health.

1. The health workflow cannot be created (`workflow init failed: Failed
   creating ops dashboard workflow`), so run, completion, validation, and
   deletion are all false and no workflow/execution IDs are produced.

2. Datastore health fails its first `set_cache` operation with HTTP 401
   `Failed authentication`. File health similarly fails file creation with
   HTTP 401, and app health fails `validate_openapi` with HTTP 401. The on-prem
   health handler selects its configured/fallback ops credentials rather than
   proving that the supplied test account is used consistently. Verify
   `SHUFFLE_OPS_DASHBOARD_APIKEY` and `SHUFFLE_OPS_DASHBOARD_ORG`, and make the
   internal health requests use one explicit, validated identity.

3. OpenSearch reports `yellow` with 87 unassigned shards on the single-node
   cluster. The strict gate requires `green` and zero unassigned shards by
   default. Adjust replica/index-template policy for the intended topology or
   add the missing nodes; do not make the test ignore unavailable replicas.

4. The strict suite's generated parent/child subflow pair did not complete.
   The parent remained `EXECUTING` for ten minutes with exactly one result (the
   start Shuffle Tools action); the downstream `Shuffle Workflow`/subflow node
   never produced a result. The fixture round-trips its action, trigger, branch,
   and start references before execution, so this is not accepted as a malformed
   test workflow. Inspect worker/subflow-app routing, `BASE_URL`, queue delivery,
   and the subflow container for the parent execution reported by the failing
   test. Both ephemeral workflow documents were successfully deleted afterward.

5. Reusing a caller-supplied `execution_id` is not rejected or handled
   idempotently. A second `/execute` request with the same ID and a different
   argument invalidated the first execution's authorization; reading the
   original execution with its original token then returned HTTP 401. Enforce
   create-only semantics for new execution IDs (409 on collision), or implement
   true idempotency that preserves the original authorization and payload.
