# Debugging a Shuffle instance

Instructions for an AI agent diagnosing a broken self-hosted Shuffle deployment.
Follow the phases in order. Do not skip ahead to a fix.

---

## 0. Rules of engagement

Read these before touching anything.

1. **Verify, never assume.** Every claim you make about the system must come from a
   command you ran or a file you read. If you did not check it, say so.
2. **Read-only first.** Phases 1-7 are diagnostic and safe. Do not restart, redeploy,
   rebuild, or edit configuration until you reach Phase 9 and the user has approved it.
3. **One hypothesis at a time.** Shuffle has several failure modes that produce
   identical-looking symptoms. Confirm which one you are in before acting.
4. **Benign noise is everywhere.** Section 8 lists log lines that look alarming and
   mean nothing. Check it before you report a finding based on a log line.
5. **Never widen the blast radius.** Do not restart production services to "see if it
   helps". A restart destroys the in-process state that is often the evidence you need.
6. **Secrets appear in logs and env output.** Redact before writing any report. See
   Section 11.
7. **If you cannot find it, say so and escalate.** An honest "I ruled out A, B, C and
   could not reproduce D" is worth more than a confident wrong answer. Go to Section 10.

---

## 1. Scope the problem — ask the user first

Do not run anything until you have answers to these. The answers determine which
phases matter and can save an hour of irrelevant checking.

**About the failure**
- What exactly is broken? Give me the literal error text or a screenshot description.
- When did it last work? What changed between then and now — upgrade, config edit,
  app reload, certificate rotation, host reboot, network change?
- Is it **total** (nothing works, UI won't load) or **partial** (UI works, executions
  hang / one app fails / auth won't save)?
- Is it **consistent** or **intermittent**? Intermittent almost always means a
  multi-node or multi-replica inconsistency — jump to Phase 3.4 and Phase 7.
- Does it affect **all workflows** or **one specific workflow/app**?

**About the deployment**
- Docker Compose (single host), Docker **Swarm** (multi-node), or **Kubernetes**?
- How many nodes, and are backend/orborus/opensearch co-located or spread?
- Are you running the **default** `docker-compose.yml` and `.env`, or a modified one?
  If modified, what did you change?
- Which Shuffle version/image tags? (`ghcr.io/shuffle/shuffle-backend:latest` or pinned?)
- Is this behind a reverse proxy, load balancer, or corporate HTTP proxy?
- Custom OpenSearch, or the bundled `shuffle-opensearch` container?

**About access**
- Can I run read-only Docker and `curl` commands against the host(s)?
- Do you have an admin API key I can use for `/api/v1/health`?

> If the user says "just fix it" without answering, ask again for the minimum set:
> deployment type, node count, and the literal error. Everything else can be discovered.

---

## 2. Architecture you are debugging

Know this before reading logs. Shuffle is not one process.

| Component | Container / service | Port | Deployed as | Role |
|---|---|---|---|---|
| Frontend | `shuffle-frontend` | 80 / 443 | compose container | React UI, proxies to backend |
| Backend | `shuffle-backend` | 5001 | compose container | API, DB access, app builds, queue source |
| Orborus | `shuffle-orborus` | — | compose container | Polls backend for queued executions, spawns workers |
| Database | `shuffle-opensearch` | 9200 | compose container | OpenSearch |
| Cache | `shuffle-cache` (memcached, optional) | 11211 | compose container | Shared cache across replicas |
| **Worker** | `shuffle-workers` | 33333 | **swarm service** | Runs one execution, spawns app containers |
| **App** | per-action container | dynamic | **swarm service** | The actual Python app code |

### 2.1 "Swarm mode" means workers and apps only

This is the single most misread part of Shuffle's deployment model.

**Swarm execution is the DEFAULT.** The shipped `docker-compose.yml` sets
`SHUFFLE_SWARM_CONFIG=run` on Orborus out of the box, so assume you are in swarm mode
unless you have confirmed otherwise. Treat non-swarm as the exception to rule out, not
the baseline.

**But only the worker and app containers are Docker Swarm services.** The frontend,
backend, Orborus, OpenSearch and memcached stay ordinary `docker-compose` containers —
even on a multi-node swarm cluster. You still bring the stack up with
`docker-compose up -d`; swarm only ever governs the execution layer.

The switch is a single env var on **Orborus**:

```
SHUFFLE_SWARM_CONFIG=run       # or "swarm" — both accepted everywhere; "run" is the default
```

Verify which mode you are actually in before anything else:
```bash
docker inspect shuffle-orborus --format '{{range .Config.Env}}{{println .}}{{end}}' | grep SWARM
```

Confirmed in code: `SHUFFLE_SWARM_CONFIG` is read ~20× in
`functions/onprem/worker/worker.go` and in `shuffle-shared`, and **not once anywhere
under `backend/`**. The backend has no concept of swarm; Orborus alone creates the
`shuffle-workers` service and the app services.

Practical consequences when debugging:

- `docker service ls` on a standard deployment shows **only** `shuffle-workers` and
  app services. The absence of `shuffle_backend` there is **normal**, not a fault.
- Use `docker logs shuffle-backend` / `shuffle-orborus` / `shuffle-frontend`, and
  `docker service logs shuffle-workers` for workers. Mixing these up wastes time.
- Restarting the stack is a compose operation; scaling execution capacity is a swarm one.

> **Exception worth checking for.** Some operators deploy the *entire* stack as a swarm
> stack (`docker stack deploy`), so backend/frontend also become replicated services.
> You can tell from container names: `shuffle_backend.3.tdugfc...@node02` is a swarm
> task, `shuffle-backend` is a compose container. If you see the former, the backend is
> replicated and Phase 7 (cache consistency) becomes relevant. Ask the user which they
> run rather than assuming.

### 2.2 Networks

(`worker.go:4316-4364`, name overridable via `SHUFFLE_SWARM_NETWORK_NAME`)

- `shuffle` — bridge network for the core compose services
- `shuffle_swarm_executions` — swarm **overlay**; workers and apps attach here
- `shuffle-executions` — non-swarm equivalent

Swarm cluster ports must be open **between nodes**: `2377` (management),
`7946` (node communication), `4789` (overlay traffic). Blocked `4789` is a classic
cause of workers that start but never exchange data.

**Execution flow.** Break it into hops; a hang is always one specific hop:

```
UI/API → backend: execution queued
       → orborus polls GET /api/v1/workflows/queue   (headers: Org-Id, Org)
       → orborus spawns worker (shuffle-workers, :33333)
       → worker pulls app image from backend (/api/v1/get_docker_image)
       → worker spawns app container on shuffle_swarm_executions
       → app POSTs result back to worker (BASE_URL=http://shuffle-workers:33333)
       → worker → backend: results streamed
```

Identify **which hop stalls**. Everything in Phase 6 is about locating that hop.

---

## 3. Deployment inventory and reachability

### 3.1 What is actually running

Core services — always compose containers (see 2.1):
```bash
docker compose ps
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Execution layer — swarm services, only when `SHUFFLE_SWARM_CONFIG=run`:
```bash
docker node ls                                  # cluster health; all nodes Ready/Active?
docker service ls                               # expect shuffle-workers + app services
docker service ps shuffle-workers --no-trunc
```

**Check for:** missing containers, `0/1` replicas, restart loops
(`Restarting (1) 5 seconds ago`), and swarm tasks stuck in `Rejected`, `Pending` or
`Allocated` that never reach `Running`.

A container that is `Restarting` is the root cause. Stop and read its logs before
checking anything else.

> Two normal-looking things that are **not** findings:
> - `docker service ls` not listing `shuffle_backend` — the backend is a compose
>   container in a standard deployment.
> - `shuffle-workers` absent while idle — it is created on demand. Only a finding if
>   executions are queued and it still never appears.
>
> Tasks stuck `Pending` usually mean replica settings exceed available nodes/resources —
> check `SHUFFLE_SCALE_REPLICAS`, `SHUFFLE_APP_REPLICAS`, `SHUFFLE_MAX_SWARM_NODES`.

If swarm was never initialised, Orborus cannot create services at all:
```bash
docker info --format '{{.Swarm.LocalNodeState}}'    # want: active
# if inactive:
docker swarm init --listen-addr 0.0.0.0:2377 --advertise-addr <HOST_IP>:2377
```

### 3.2 Config sanity

```bash
# What the containers actually got, not what the file says
docker inspect shuffle-backend --format '{{range .Config.Env}}{{println .}}{{end}}'
docker inspect shuffle-orborus --format '{{range .Config.Env}}{{println .}}{{end}}'
```

Compare against `.env`. The common failures:

| Variable | Failure if wrong |
|---|---|
| `SHUFFLE_ENCRYPTION_MODIFIER` | **Changed or empty → every existing app auth is undecryptable.** Never "fix" this by changing it; that breaks everything permanently. |
| `BASE_URL` / `OUTER_HOSTNAME` | Orborus and workers cannot reach the backend. Executions queue forever. |
| `ENVIRONMENT_NAME` (orborus) | Must match a Shuffle environment name. See 6.1 — this is the #1 cause of stuck queues. |
| `ORG_ID` (orborus) | Sent as the `Org` header; wrong value returns an empty queue silently. |
| `SHUFFLE_OPENSEARCH_URL` / `_USERNAME` / `_PASSWORD` | Backend cannot reach DB; nothing works. |
| `SHUFFLE_SWARM_CONFIG` | `run`/`swarm` = workers and apps run as swarm services. Unset = plain containers. Changes worker lifecycle entirely. |
| `SHUFFLE_SWARM_NETWORK_NAME` | Overlay network name; defaults to `shuffle_swarm_executions`. |
| `SHUFFLE_SCALE_REPLICAS` / `SHUFFLE_APP_REPLICAS` / `SHUFFLE_MAX_SWARM_NODES` | Too high for the cluster → swarm tasks sit `Pending` forever. |
| `SHUFFLE_ORBORUS_EXECUTION_CONCURRENCY` | At the limit, Orborus silently stops picking up work. Docs default 10; shipped `.env` says 5. |
| `SHUFFLE_ORBORUS_EXECUTION_TIMEOUT` | Container cleanup window (default 600s). |
| `SHUFFLE_MEMCACHED` | Empty on multi-replica = per-process cache. See Phase 7. |
| `SHUFFLE_AUTO_IMAGE_DOWNLOAD` | `false` = workers never fetch images from backend. |
| `IS_KUBERNETES` | Wrong value routes image handling down the wrong code path. |

### 3.3 Service-to-service reachability

Test **from inside the containers** — host reachability proves nothing about
container networking.

```bash
# Backend → OpenSearch
docker exec shuffle-backend curl -sk -u "$USER:$PASS" https://shuffle-opensearch:9200/_cluster/health | head -c 400

# Orborus → Backend
docker exec shuffle-orborus curl -s -o /dev/null -w '%{http_code}\n' http://shuffle-backend:5001/api/v1/health

# Frontend → Backend
docker exec shuffle-frontend curl -s -o /dev/null -w '%{http_code}\n' http://shuffle-backend:5001/api/v1/health
```

Non-200 or connection refused → a network or hostname problem, not an application
problem. Verify the containers share a network:

```bash
docker network inspect shuffle --format '{{range .Containers}}{{println .Name}}{{end}}'
docker network inspect shuffle_swarm_executions --format '{{.Scope}} {{range .Containers}}{{println .Name}}{{end}}'
```

`shuffle_swarm_executions` **must be swarm-scoped** in Swarm mode. `worker.go:4003`
logs `Network %s exists but is not swarm scoped` — if you see that, the network was
created as a local bridge and workers cannot reach apps across nodes. Recreating it
correctly is the fix.

### 3.4 Multi-node consistency (Swarm only)

If the problem is **intermittent**, suspect node divergence before anything else.
Run the same check on every node and diff the results:

```bash
for n in node1 node2 node3; do
  echo "=== $n ==="
  ssh $n "docker images --format '{{.Repository}}:{{.Tag}}\t{{.CreatedSince}}' | grep -c shuffle"
  ssh $n "docker ps --filter name=shuffle --format '{{.Names}}\t{{.Status}}'"
done
```

Divergent image ages across nodes explain "works sometimes" perfectly.

---

## 3.5 Host-level causes (hit these before blaming Shuffle)

Documented failure modes from https://github.com/Shuffle/shuffle-docs. Several are
swarm-specific and produce misleading application-level symptoms.

**MTU mismatch — the classic swarm killer.** Presents as TLS timeouts, EOF errors, or
apps that hang mid-request. The overlay network's MTU exceeds the host's, so large
packets vanish silently.
```bash
ip addr | grep mtu                     # find the host MTU
```
Fix for the execution overlay:
```bash
docker network rm shuffle_swarm_executions
docker network create --driver=overlay --ingress=false --attachable=true \
  -o "com.docker.network.driver.mtu"="1460" shuffle_swarm_executions
```
And for the compose bridge, in `docker-compose.yml`:
```yaml
networks:
  shuffle:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1460
```

**IP forwarding disabled** — Orborus cannot reach the backend:
```bash
sysctl net.ipv4.ip_forward        # want 1
# fix: set net.ipv4.ip_forward=1 in /etc/sysctl.conf, then: sysctl -p
```

**DNS resolution failures** — intermittent "can't connect to backend". Configure
`/etc/docker/daemon.json` with `{"dns": ["10.0.0.2", "8.8.8.8"]}`, or use the backend's
IP instead of its hostname in `BASE_URL`.

**OpenSearch will not start / restart loops:**
```bash
sysctl vm.max_map_count            # want 262144
df -h                              # disk
free -m                            # RAM vs OPENSEARCH_JAVA_OPTS heap
sudo chown 1000:1000 -R shuffle-database    # permission errors
```

**Docker API version mismatch** ("client version too new") → set
`DOCKER_API_VERSION=1.40`. **Docker permission denied** → the docker-socket-proxy
service, commented out in the shipped compose file.

**File upload permission errors on SELinux hosts** → the `:z` volume suffix, e.g.
`${SHUFFLE_FILE_LOCATION}:/shuffle-files:z`.

---

## 4. Backend health

```bash
curl -s "http://localhost:5001/api/v1/health" -H "Authorization: Bearer $APIKEY" | jq
```

Also available: `/api/v1/health/stats` and the `/health` dashboard in the UI.
The scheduled healthcheck runs hourly unless `SHUFFLE_HEALTHCHECK_DISABLED=true`
(`main.go:5658`).

This endpoint exercises a real workflow execution end to end, so a failure here
localises the break for you. Read its output before manual tracing.

---

## 5. Database (OpenSearch)

```bash
curl -sk -u "$USER:$PASS" "$OPENSEARCH_URL/_cluster/health?pretty"
curl -sk -u "$USER:$PASS" "$OPENSEARCH_URL/_cat/indices?v"
curl -sk -u "$USER:$PASS" "$OPENSEARCH_URL/_cat/aliases?v"
```

**`status: red`** → indices unassigned; usually disk or a failed restart. Nothing
above this will work. Fix the cluster first.

**Disk watermark** is the most common silent killer — OpenSearch flips indices to
read-only and Shuffle then fails every write with confusing errors:
```bash
curl -sk -u "$USER:$PASS" "$OPENSEARCH_URL/_cat/allocation?v"
```

### 5.1 Alias vs index errors — read these precisely

Two errors look similar and mean completely different things:

- **`{"found":false}` with `status: 404`** — the document does not exist. Often
  entirely normal (see Section 8).
- **`has more than one index associated with it`** — an alias spans multiple indices
  after a rollover, and `Document.Get` refuses it.

Only indices in `GetOpensearchBaseIndexes()` (`shuffle-shared/db-connector.go:93`)
are aliased and can ever throw the second error:

```
workflowexecution, datastore_ngram, org_cache, org_cache_revisions,
notifications, shuffle_logs, environments, org_statistics,
workflowapp, workflow, workflow_revisions, datastore_category
```

**`workflowappauth` is not in this list.** If you see a 404 on `workflowappauth`,
it is a genuine missing document, never an alias problem. Do not propose alias
fallbacks for unaliased indices.

If a prefix is set via `SHUFFLE_OPENSEARCH_INDEX_PREFIX`, all index names are
prefixed; a mismatch between backend config and existing indices makes Shuffle
look like it lost all data. `/api/v1/health/opensearch-prefix` exists to repair this.

---

## 6. Execution pipeline

Work the hops in order. Stop at the first one that fails.

### 6.1 Is Orborus receiving the queue?

```bash
docker logs shuffle-orborus --since 30m 2>&1 | grep -iE 'queue|execution|error|environment' | tail -40
```

Healthy Orborus polls continuously and logs when it picks work up. Silence means it
is either not polling or getting an empty queue.

**The environment-name mismatch is the most common cause of "executions stay queued".**
The backend matches Orborus's `Org-Id` header (which carries `ENVIRONMENT_NAME`,
*not* an org ID) against configured environments, normalised by lowercasing and
converting spaces and underscores to dashes (`walkoff.go:421-428`).

So `My_Env`, `my env`, and `MY-ENV` all match — but `Shuffle2` never matches `Shuffle`.

Check both sides:
```bash
docker inspect shuffle-orborus --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E 'ENVIRONMENT_NAME|ORG'
curl -s "http://localhost:5001/api/v1/environments" -H "Authorization: Bearer $APIKEY" | jq '.[].Name'
```

Also confirm the environment is not paused/stopped in the UI, and check
`SHUFFLE_ORBORUS_EXECUTION_CONCURRENCY` (default 5) — at the limit, Orborus stops
picking up new work and the queue grows with no errors logged.

### 6.2 Is a worker being spawned?

```bash
docker service ps shuffle-workers --no-trunc 2>/dev/null | head -20
docker ps -a --filter name=shuffle-worker --format '{{.Names}}\t{{.Status}}'
docker service logs shuffle-workers --since 30m 2>&1 | tail -60
```

Orborus spawned it but it exits immediately → read the worker's own logs, it is
usually image or network related. Never spawned → the failure is upstream in 6.1.

### 6.3 Is the worker reaching the backend and getting images?

```bash
docker service logs shuffle-workers --since 30m 2>&1 | grep -iE 'download|image|backend|timeout' | tail -30
```

Workers fetch app images from the backend (`/api/v1/get_docker_image`) rather than a
registry. Notes that matter:

- The backend serves the image **from its own local Docker daemon**. If the backend
  node holds a stale image, that stale image propagates faithfully everywhere.
- `SHUFFLE_AUTO_IMAGE_DOWNLOAD=false` disables this entirely; images must then already
  exist on every node.
- There is **no local-image check** before downloading — only an in-process cache with
  a 5-minute expiry. In swarm mode workers are per-execution, so this can mean an image
  transfer on every execution. That is a performance problem, not a correctness one, but
  it looks like "executions are slow".

### 6.4 Is the app container running and reachable?

```bash
docker ps -a --filter name=shuffle --format '{{.Names}}\t{{.Status}}' | grep -v 'backend\|frontend\|orborus\|opensearch'
docker logs <app_container> 2>&1 | tail -50
```

Apps call back to the worker at `http://shuffle-workers:33333` (`worker.go:591`).
If the app container runs but the result never arrives, it is a **network** problem
between app and worker — verify both are on `shuffle_swarm_executions` and that it is
swarm-scoped (3.3).

Also check `SHUFFLE_APP_SDK_TIMEOUT` (default 300s) for apps that hang rather than fail.

---

## 7. Cache and multi-replica consistency

Relevant whenever the backend runs more than one replica.

```bash
docker inspect shuffle-backend --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -i memcach
docker ps --filter name=shuffle-cache --format '{{.Names}}\t{{.Status}}'
docker network inspect shuffle_swarm_executions --format '{{range .Containers}}{{println .Name}}{{end}}' | grep -i cache
```

`SHUFFLE_MEMCACHED` empty → `DeleteCache`/`GetCache` fall back to `requestCache`,
an **in-process** cache (`shuffle-shared/db-connector.go:54`). With multiple backend
replicas each has its own copy: one replica writes and clears its cache, another keeps
serving stale data. Symptom: *"I saved it, it shows the old value, sometimes it's
correct"* — behaviour changes depending on which replica the load balancer picked.

If memcached is configured, verify it is reachable from the backend **and** on the
right networks — it must be on both `shuffle` and the execution network if workers
use it:
```bash
docker exec shuffle-backend sh -c 'echo stats | nc shuffle-cache 11211 | head -5'
```

Confirm the replica count actually is >1 before pursuing this:
```bash
docker service ls --filter name=shuffle_backend
```

---

## 8. Known-benign log lines

Do not report these as findings. Check here before escalating anything log-based.

| Log line | Meaning |
|---|---|
| `[WARNING] Error for workflowappauth_<uuid>: status: 404 ... "found":false` | **Normal on auth creation.** The frontend generates the auth UUID client-side (`AuthenticationNormal.jsx:86`); the backend checks whether it exists, gets 404, and creates it. Followed by `Set new app auth ...` = success. |
| `[ERROR] Unknown category other for app X` | Cosmetic. The app-framework mapping has no branch for category `other`. Harmless. |
| `[WARNING] Error getting app <32-char-md5> (app config): App doesn't exist` | A stale app reference. App IDs are `md5(name + appVersion)`, so a version bump mints a new ID and old references dangle. |
| `[DEBUG] Image X already downloaded - not re-downloading` | Expected caching behaviour. |
| `[INFO] Org X already has app Y active` | Informational. |

**Corollary worth knowing:** because app ID is `md5(name + appVersion)`, bumping an
app's version **orphans all existing authentications for it** — several auth-matching
code paths compare `auth.App.ID` strictly. If a user reports "my auth disappeared after
updating an app", this is why, and the fix is not to touch the database.

---

## 9. Fix, or escalate

**You may fix directly** (after telling the user what and why):
- Wrong env var values that do not destroy data — `ENVIRONMENT_NAME` mismatch,
  `BASE_URL`, missing `SHUFFLE_MEMCACHED`
- A missing or wrongly-scoped `shuffle_swarm_executions` network
- Restarting a service that is in a confirmed crash loop
- Disk space / OpenSearch read-only watermark

**Ask before doing** — destructive or hard to reverse:
- Anything touching `SHUFFLE_ENCRYPTION_MODIFIER` (**breaks every auth permanently**)
- Deleting or reindexing OpenSearch indices
- Rolling back or changing image versions
- Bumping an app version (orphans auths — see Section 8)

**Never do without explicit instruction:** wipe volumes, delete indices, rotate the
encryption modifier, or `docker system prune`.

After any fix, **verify it**: re-run the failing operation and show the user the
output. Do not report success from the absence of an error.

---

## 10. If you could not fix it — write the report

When you have worked the phases and the problem is still live, write
`shuffle-debug-report-<YYYYMMDD-HHMM>.md` and tell the user to email it to
**support@shuffler.io**.

Be selective with logs. A 50MB dump is useless to whoever reads it. Include the
*relevant* window and the *relevant* lines.

### Report template

```markdown
# Shuffle debug report — <date/time + timezone>

## Summary
One paragraph: what is broken, what the user observes, when it started.

## Environment
- Deployment: Compose / Swarm / Kubernetes; N nodes
- Shuffle versions (image tags per service)
- Database: bundled OpenSearch / external (version)
- Memcached: configured? backend replica count?
- Reverse proxy / corporate HTTP proxy in front?
- Default config, or modifications (list them)

## Symptom
Exact error text, the failing operation, and whether it is consistent or intermittent.
Reproduction steps if known.

## What was checked and ruled out
A table: check → command → result → conclusion.
Include the negatives. Ruling things out is most of the value here.

## Current hypothesis
What you believe is happening and what evidence supports it.
Explicitly state what remains unverified.

## Logs
(see collection commands below — trimmed and redacted)

## What was attempted
Every change made, and its effect. If you changed something and it did not help,
say whether you reverted it.
```

### Log collection — targeted, not exhaustive

```bash
OUT=shuffle-debug-$(date +%Y%m%d-%H%M)
mkdir -p $OUT

# Errors and warnings from the last 30 minutes, capped per service
docker logs shuffle-backend  --since 30m 2>&1 | grep -iE 'error|warning|panic|fatal' | tail -300 > $OUT/backend-errors.log
docker logs shuffle-orborus  --since 30m 2>&1 | tail -300                                    > $OUT/orborus.log
docker service logs shuffle-workers --since 30m 2>&1 | tail -300                             > $OUT/workers.log

# Full context around the specific failure, if you know the execution ID
docker logs shuffle-backend --since 30m 2>&1 | grep -- "$EXECUTION_ID" > $OUT/execution-trace.log

# App container logs — only the ones that actually failed
docker logs <failed_app_container> 2>&1 | tail -200 > $OUT/app-<name>.log

# State snapshots (small, high value)
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' > $OUT/containers.txt
docker service ls > $OUT/services.txt 2>/dev/null
curl -sk -u "$USER:$PASS" "$OPENSEARCH_URL/_cluster/health?pretty" > $OUT/opensearch-health.json
curl -sk -u "$USER:$PASS" "$OPENSEARCH_URL/_cat/indices?v"        > $OUT/opensearch-indices.txt
```

Prefer, in this order: the execution-ID trace → orborus/worker logs for the failing
window → backend errors → app logs. Skip anything that is just startup noise.

### Redact before sending

Logs and env dumps contain credentials. Strip them:

```bash
sed -i.bak -E \
  -e 's/(SHUFFLE_ENCRYPTION_MODIFIER=)[^ ]*/\1<REDACTED>/g' \
  -e 's/(PASSWORD=)[^ ]*/\1<REDACTED>/g' \
  -e 's/(Bearer )[A-Za-z0-9._-]+/\1<REDACTED>/g' \
  -e 's/(apikey"?[:=] ?"?)[A-Za-z0-9._-]+/\1<REDACTED>/gI' \
  $OUT/*.log $OUT/*.txt
rm -f $OUT/*.bak
```

Then review by eye — app logs can contain customer data and API tokens in action
parameters. When in doubt, ask the user before including an app log.

Finally, tell the user plainly: what you ruled out, what you suspect, what you could
not determine, and that the report is ready to email to support@shuffler.io.

---

## 12. Upstream references

Official documentation lives at https://github.com/Shuffle/shuffle-docs (rendered at
https://shuffler.io/docs). Fetch the raw files rather than the GitHub HTML pages —
the repo landing page does not expose file contents:

```
https://raw.githubusercontent.com/Shuffle/shuffle-docs/master/docs/configuration.md
https://raw.githubusercontent.com/Shuffle/shuffle-docs/master/docs/troubleshooting.md
```

`configuration.md` covers swarm setup, scaling variables and required ports;
`troubleshooting.md` covers the host-level failures in 3.5, MFA recovery, and index
cleanup. Consult them before escalating — they may already document the symptom.

Where this file and the upstream docs disagree, prefer what you can verify in the
source tree, and note the discrepancy in your report. One known example: the docs give
`SHUFFLE_ORBORUS_EXECUTION_CONCURRENCY` a default of 10 while the shipped `.env` sets 5.
