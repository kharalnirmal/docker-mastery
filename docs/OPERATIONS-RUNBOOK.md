# Local Docker operations and incident runbook

Use this with the [capstone](../index.html#docker-capstone), not as a public
deployment approval. The tracker has no authentication; keep it loopback-only
with demo data. Start with the [Compose checkpoint](../examples/compose/README.md).

## 1. Record ownership before operating

Copy this record into your private team runbook; replace the prose fields there,
not by pasting them as commands. Never put credentials or real data in a public PR.

| Field | Record |
| --- | --- |
| Owner and backup contact | Person responsible for the lab and data |
| Environment | Local OS/shell, architecture, Docker/Compose versions |
| Docker context | Confirmed local engine; never a workplace/production context |
| Project | Exact Compose project name and selected Prisma **or** Drizzle track |
| Configuration | Ordered Compose files and env-file location, not its contents |
| Artifacts | App/tools image identities and matching migration commit |
| Network | Loopback app address; PostgreSQL unpublished |
| Persistence | Exact project-owned database volume name |
| Recovery | Archive identity/checksum, protected location, last successful restore |
| Targets | Data-loss target (RPO), recovery-duration target (RTO), measurement method |

RPO measures acceptable data loss, not backup frequency alone. RTO includes
detection, restore and verification, not just container startup. For example,
an hourly backup cannot meet a five-minute data-loss target by itself. Set
targets from needs, then measure them; this lab promises no production SLO.

## 2. Select the stack consistently

Open Bash in your existing chosen `examples/compose/prisma` or `drizzle` directory.
Do not create a new env file or seed over an incident. These examples assume the
checkpoint's default project name and existing `.env`. If you originally used
`-p` or `--env-file`, keep those exact choices in **every** command.

For a baseline stack, define this Bash function:

```bash
dc() { docker compose "$@"; }
```

For a stack already started with the hardened overlay, use this definition
**instead**, not an additional unrelated stack:

```bash
dc() { docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml "$@"; }
```

`dc` is a shell helper; `"$@"` forwards each argument without joining it.
Ordered `-f` files merge configuration. Release stacks must use the exact helper
from the [delivery runbook](../examples/delivery/README.md), including their env
and pull-only image configuration. Do not use the baseline helper for a release.

## 3. Capture a read-only baseline

Inspect locally first. Logs and inspection output may contain private values;
redact before sharing. `config --quiet` validates without printing resolved secrets.

```bash
docker context show
docker version
docker compose version
dc config --quiet
dc ps -a
dc port app 3000
dc logs --tail 100 --since 15m --timestamps app db
dc stats --no-stream
docker system df
docker volume ls
```

- `ps -a` includes stopped services; `port app 3000` reports the actual host mapping,
  not a hardcoded port. Open that loopback host/port in your browser.
- `--tail 100` bounds log lines **per container**; `--since 15m` restricts time;
  `--timestamps` includes timestamps. Clock/time-zone differences matter.
- `stats --no-stream` returns a snapshot, not a trend. Record repeated observations
  with times before concluding memory growth. `system df` estimates Docker storage,
  not total host free space or automatic permission to delete resources.
- `volume ls` inventories names, not data contents or backup validity. Identify
  ownership before inspecting a volume. Do not publish raw inspection environments.

Expected for a configured running lab: app/db running and healthy, only app port
published on loopback, no dependency errors. Missing services are diagnostic
evidence, not permission to run `up` with guessed project settings.

When `dc ps -a -q app` prints exactly one owned container ID, inspect only a narrow
state summary (the API checks in this guide use one app replica):

```bash
docker inspect --format 'status={{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}} restarts={{.RestartCount}}' "$(dc ps -a -q app)"
```

`-q` prints IDs only; `$(...)` substitutes that output in Bash. `--format` selects
Go-template fields rather than dumping environment variables. If there is no ID
or more than one, stop and inspect the actual service list first. Exit 137 alone
does not establish OOM; correlate `OOMKilled`, resource history and host evidence.

## 4. Separate symptoms from hypotheses

| Symptom | Read-only evidence | Safe next decision |
| --- | --- | --- |
| Browser cannot connect | Mapping, service state, selected host, published address | Correct the verified URL; do not expose the DB or widen a firewall |
| Health 200, readiness 503 | DB state/health, migration outcome, app logs | Repair the verified dependency; do not reset data or restart endlessly |
| Container exited | Exit status, OOM flag, recent logs, expected command | Fix the specific command/configuration or investigate measured pressure |
| Permission denied | Exact path, runtime UID, read-only and mount configuration | Add only the required owned writable path after review; never default to root |
| Disk growth | Host free space, Docker usage, log policy, owned volumes | Review retention and backups; no global prune or unowned-volume deletion |
| Migration failed | Exact failed SQL and selected ORM's history | Follow the controlled-recovery lesson; never invent applied history |

Check `/api/healthz` and `/api/readyz` on the discovered app URL. The first proves
the process responds; the second checks the database/schema dependency. Neither
proves every feature works. A smoke test creates a uniquely titled **demo** task,
assigns it, completes it and checks it after Refresh. Do not write synthetic tasks
into someone else's real dataset or infer success from HTTP 200 alone.

## 5. Rehearse one safe dependency incident

**State-changing interruption:** only in your own disposable running lab with the
correct helper, after recording the baseline. Never practice on shared production.

```bash
dc stop db
```

Expected: health stays 200, readiness becomes 503 and the UI reports failed DB work.
Record the observation and time; do not keep submitting writes or seed a reset.
Recover that same service:

```bash
dc start db
dc ps
```

Wait for DB/app health, then verify readiness and the retained demo task. `stop`
interrupts an existing service, `start` starts its existing container; neither
recreates configuration or deletes its volume. If recovery fails, capture evidence
and investigate rather than expanding the experiment. Never fill the host disk
or force host-wide OOM to simulate an incident.

## 6. Recovery and release decisions

- Archive existence is not restore evidence. Follow the [recovery procedure](../examples/recovery/README.md)
  to restore into a **separate empty database**, compare business rows and preserve
  ORM history. Treat dumps as sensitive data and untrusted SQL when sourced externally.
- A same-host restore does not prove host-loss recovery. Record independently
  stored/encrypted copies, key access, retention and a separately authorized restore.
- Back up and review compatibility before schema changes. Serialize migrations;
  do not run them in every app replica. Do not use seeds as data recovery.
- App rollback selects a previous compatible artifact, not old SQL migrations.
  Stop and obtain a recovery decision if current schema or new writes would be lost.
- Keep the previous app/tools pair and backup record. Registry retention must not
  delete artifacts still required for rollback. Do not enable public publishing or
  rent a host just to complete this local course.

## 7. Incident report template

```text
Incident / owner / environment:
Start time and time zone:
User-visible impact and affected scope:
Observed facts (sanitized evidence and timestamps):
Hypotheses (explicitly not facts):
Confirmed Docker context, Compose project, track and artifact identities:
Backup/restore evidence and schema compatibility:
Smallest proposed change, risks, approver and rollback conditions:
Action taken and time:
Verification (health, readiness, existing data and authorized smoke test):
Recovery time / observed data loss / limits of the drill:
Follow-up owner and due date:
Prevention and what went well (blameless):
```

Do not fabricate measurements. Preserve sanitized evidence, not tokens, env-file
contents, raw customer records or dump attachments. Optional AI may suggest
read-only hypotheses from sanitized evidence, but must not receive unattended
deployment access or permission to delete data.

## 8. Handoff and cleanup

Have a teammate reproduce the baseline using the written project/file choices.
Use the [completion checklist](COMPLETION-CHECKLIST.md) for sign-off. Remove the
helper from the current Bash session with `unset -f dc` when finished (`-f` selects
a function); this does not stop services. `dc down`, while the helper exists,
stops the selected stack and keeps named volumes but is still an outage. Never
add volume deletion to routine shutdown. Archive retention and final volume
deletion require a separate owner-approved data-loss decision.

References: [Compose CLI](https://docs.docker.com/reference/cli/docker/compose/),
[container inspect](https://docs.docker.com/reference/cli/docker/container/inspect/),
[logs](https://docs.docker.com/reference/cli/docker/compose/logs/),
[resource constraints](https://docs.docker.com/engine/containers/resource_constraints/).
