# Docker delivery checkpoint

This checkpoint finishes the Docker path with failure recovery, BuildKit,
runtime hardening, registry/CI concepts, a pull-only release and a capstone.
Select **Prisma or Drizzle**, never combine their migration histories.
No cluster tools are required. No cloud resources are created.

## Files and support boundary

- `compose.secure.yaml`: overlay either ORM's base Compose file.
- `compose.release.yaml`: removes builds with Compose `!reset`, sets required
  app/tools image references. Use a modern Compose that supports `!reset`.
- `Dockerfile.buildkit`: fake-secret/cache-mount exercise, not a task tracker.
- `docker-ci.yaml`: optional workflow template, **not automatically installed**.
- `../../tools/check-delivery-labs.cjs`: local runtime assertions, results per ORM.

The application is a demo without authentication/authorization. Keep it on
loopback, use synthetic data and do not publish it as a secure public service.
Limits are illustrative. TLS, production secret delivery, image scanning,
SBOM/signature verification and independent-host recovery need an environment-
specific review. Rootless daemon installation and ARM64 app execution are not
certified by the local AMD64 checks.

## 1. Run the controlled verification

From the guide root, on the confirmed local `desktop-linux` context:

```bash
node tools/check-delivery-labs.cjs prisma
node tools/check-delivery-labs.cjs drizzle
```

**State-changing:** pulls/builds images and creates a uniquely named project,
database volume and temporary tools container. Cleanup removes only that run's
containers/network/volume and **all its disposable database contents**. Cached
images remain. No existing working database is used. Run sequentially on 8 GB
machines. The CLI runner works on Windows; lesson shell examples use WSL Bash.
macOS/native Linux users should review the local context restriction rather than
rename or switch a context blindly. `--ci` is restricted to isolated GitHub
Actions runners using the default local context.

The runner builds app and tools separately, applies the initial history, seeds
demo data and records all original Task fields. It creates a deliberate empty
description column, then asserts that the reviewed second migration fails:

- Prisma: failed unfinished history entry exists; further deploys require review.
- Drizzle: failed transaction adds no second history entry.
- Both: all original business rows remain unchanged.

Only in this fresh test database, it verifies that the conflicting description
column contains no values and drops that test-created column. **Dropping any real
column is destructive. This is not a general incident fix.** Prisma's explicit
`migrate resolve --rolled-back` marks the failed attempt retryable; it does not
undo SQL. Drizzle needs no history edit for this transactional failure. The
runner retries, repeats deploy and checks original rows again. Never edit
applied migration files or mark unknown partial SQL applied to silence an error.

The same test starts the hardened app and verifies UID, read-only rootfs,
capabilities, no-new-privileges, memory/PID/log limits, writable tmpfs paths and
real API reads/writes. It tests SIGTERM stop/restart (normal 0/143, not forced
kill/OOM), then recreates the exact local image through the release overlay and
verifies database data survives. A local image ID is not a registry digest;
public distribution/identity checks require the optional registry workflow.

Inspect `tests/results/delivery-prisma.json` and `delivery-drizzle.json`:
both `passed` and `cleaned` must be true. Cached app/tools image IDs are recorded
for inspection or CI publishing; the runner does not publish them.

## 2. Use the secure overlay with your existing local lab

Prerequisite: chosen Compose track already configured, migrated and seeded per
`../compose/README.md`. From that chosen track directory:

```bash
docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml config --quiet
docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml up -d --build
docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml ps
docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml logs --tail 50 app
```

`-f` selects ordered Compose files. The first file establishes relative paths.
`config --quiet` checks resolved configuration without printing passwords.
`up -d --build` builds/updates services in the background; it does not migrate.
`ps` shows state; `logs --tail 50` limits displayed captured lines to the latest
50, not retained disk size. Logs must not contain secrets. Use identical `-p`
project flags if you used a custom project name in earlier lessons.

Read the full YAML: read_only denies rootfs writes; tmpfs gives ephemeral bounded
space to /tmp and the node-owned Next cache. cap_drop removes capabilities;
security_opt blocks privilege escalation. mem_limit, cpus and pids_limit bound
memory, CPU time and processes/threads; these are not traffic capacity promises.
json-file max-size/max-file rotate per-container logs, not host-wide retention.
unless-stopped restarts exited services but **not merely unhealthy** containers.
Database persistence still lives in its named volume, not tmpfs.

```bash
docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml down
```

This interrupts the chosen stack and retains its database. Never append volume
deletion to routine shutdown or release commands.

## 3. BuildKit exercise

Read the online BuildKit lesson and the complete Dockerfile first. From guide
root in WSL/macOS/Linux Bash, choose a new fake-secret filename if needed:

```bash
printf 'fake-demo-only' > "$HOME/guide-demo-secret.txt"
docker buildx build --load --secret "id=demo,src=$HOME/guide-demo-secret.txt" -f examples/delivery/Dockerfile.buildkit -t guide-buildkit:local examples/delivery
docker run --rm guide-buildkit:local
docker run --rm guide-buildkit:local sh -ec 'test ! -e /run/secrets/demo; test ! -e /var/cache/guide/status; cat /proof.txt'
```

`>` overwrites: use only a newly chosen demo file. `--load` loads a single-platform
image locally; `--secret` maps the fake host file to the matching RUN mount ID;
`-f` chooses the Dockerfile; `-t` tags the result. The final path is context.
`--rm` deletes the exited container, not the image. `sh -ec` executes the string
and stops on failed commands. `test ! -e` asserts a path does not exist.
Expected: fixed proof text, with neither secret nor cache files in the final
stage. Secret mounts still leak if build commands deliberately copy/log secrets.

Inspect the exact fake file before manual deletion. Keep cached images/build
cache or remove only your explicitly identified artifact, never bulk prune.

## 4. Optional GitHub Actions / GHCR

The template assumes these guide contents are the repository root. In a
repository **you own**, review the file and upstream Action commits, then copy
`docker-ci.yaml` into `.github/workflows/docker-ci.yaml`. Configure branch
protection and a `container-release` environment with required reviewers and
main-only deployment branches. Without these repository settings, merely naming
the environment does not create an approval gate. Package publication may use
storage/bandwidth quota. Review GHCR visibility, organization policy and billing.

PR checks have a read-only token and use disposable hosted runners. No
pull_request_target or persistent self-hosted Docker/socket access. The matrix
audits both lockfiles and exercises both hardened runtimes and migration failure
paths. The separately permissioned main-only publish job requires checks and the
environment gate, retests the exact app/tools images, tags their IDs and pushes
without rebuilding. Shell `${GITHUB_REPOSITORY,,}` lowercases the package name;
`set -euo pipefail` fails on command errors, unset variables and pipe failures.
`docker tag` adds a name to existing content; `push` uploads it. Each `@sha256`
reference is captured after push in the job summary.

This is a **minimal package-publishing workflow**, not a complete production
supply-chain pipeline. Add reviewed image scanning, SBOM creation, provenance,
signature and identity verification, staging smoke tests and production approvals
before public production use. Do not invent a passing remote CI result: it has
not run until executed in your repository. Tags/Action references must be
maintained over time; pinned references are not automatic patching.

## 5. Pull-only release rehearsal / single-host runbook

No VPS is created by this guide. If you choose one separately, get budget and
access approval first. The host needs a supported OS/engine/Compose, SSH access
control, patched packages, reviewed firewall rules, enough disk/RAM, off-host
encrypted backups and monitoring. The demo app stays loopback-only. Public use
requires authentication/authorization and a separately reviewed TLS reverse proxy
(certificate renewal, host trust, request/stream timeouts and limits included).

From the chosen ORM directory, create ignored `.env.release` using an editor.
Supply `POSTGRES_PASSWORD`, `APP_PORT`, and the **actual paired registry digest
references** `APP_IMAGE` / `TOOLS_IMAGE` from an approved release. Never paste
placeholder digests. Use a URL-safe password here or correctly percent-encode it
in the database URL before adapting this demo. Runtime env is inspectable by
daemon admins; this is not a production secret-manager integration.

In Bash, define one helper so file flags cannot drift:

```bash
dc() { docker compose --env-file .env.release -f compose.yaml -f ../../delivery/compose.secure.yaml -f ../../delivery/compose.release.yaml "$@"; }
dc config --quiet
dc pull app tools db
dc up -d db
dc ps
```

`dc()` is a Bash function; `"$@"` forwards separate arguments. `--env-file`
chooses interpolation values; it does not blindly inject every value into app
environment. `pull` downloads the reviewed artifacts. Wait for db healthy; stop
if unhealthy. Confirm a **verified off-host backup** and serialize the migration
so only one release owner applies it. Then:

```bash
dc run --rm --no-deps tools npm run db:migrate
dc up -d --no-build --wait app
dc ps
dc logs --tail 50 app
```

`run` starts one explicit migration container; `--no-deps` does not recreate
dependencies; `--rm` removes that tools container after exit. Stop on failure.
`--no-build` prohibits host builds; `--wait` waits for app health. Never seed a
real deployment. Verify process health, readiness, exact image digest and real
browser/API behavior with retained data. The release manifest's `!reset null`
removes inherited build configuration; a supporting modern Compose is required.

For backward-compatible schema expansion, revert **only APP_IMAGE** to the
reviewed previous compatible app digest, then `dc pull app` and
`dc up -d --no-build --wait app`. Recheck data and behavior. Do not deploy an
older migration history to undo schema changes; app rollback is not a database
restore. Incompatible changes need reviewed recovery/forward fixes and explicit
data-loss decisions. Replacement can interrupt requests; this is not HA or a
zero-downtime claim. A separate public load balancer/TLS configuration is not
provided by these files.

Daily checks: service state, readiness, bounded logs, resource/connection use,
free disk, certificate expiry if configured, backup age and periodic restore
timing. Assign owners and write realistic SLO/RPO/RTO targets. A single host
cannot survive loss of that host by virtue of having several containers.

Cleanup: `dc down` is an outage but retains the named DB volume. Do not use it
for routine image rollout. Keep previous compatible app/tools digests under a
retention policy. Any optional infrastructure teardown needs a separate inventory
and explicit approval for disks/backups/data deletion.
