# Docker Mastery — lab validation and operating boundaries

Twenty lessons: Docker foundations, Next.js + PostgreSQL, Compose, recovery,
BuildKit, runtime hardening, delivery and an operational capstone.
Built separately from the supplied Git tutorial, which remains untouched.
Kubernetes is removed from the active guide; the existing folder name is retained
to avoid breaking local paths. The combined handoff is historical planning only.

## Preview

Requires Node.js (tested with 24.14.0). No installation or npm dependencies needed.

```bash
node tools/serve.cjs
```

Open **http://127.0.0.1:4173**. Stop with Ctrl+C. The server binds only to loopback.
Alternatively serve this directory with any static server. Hash routes support
direct links and browser back/forward without server rewrites.

```bash
npm test
```

The dependency-free tests check lesson structure, file parity, local links,
safety patterns and whitespace. They do not execute Docker or substitute for
browser tests. See `CONTENT-REVIEW.md` and `tests/BROWSER-CHECKLIST.md`.

Use the [operations runbook](docs/OPERATIONS-RUNBOOK.md) for read-only triage and
incident handoffs, and the [completion checklist](docs/COMPLETION-CHECKLIST.md) to
separate learner evidence, maintainer checks and optional public-production gates.

With agent-browser installed and the preview running, execute
`node tests/browser-check.cjs` for the seven-viewport navigation smoke suite.
`node tests/browser-touch.cjs` checks trusted Chromium-emulated touch input.

## Included

- First container, lifecycle, Dockerfile, private networking, named volumes with
  tested static-file backup/restore, troubleshooting, and a command cheatsheet.
- Reference-matched grouped icon navigation and header search (Ctrl/Cmd+K),
  per-lesson and per-section links, active contents, previous/next cards,
  persistent theme and keyboard-accessible mobile drawer.
- Self-hosted Inter (400–800) and JetBrains Mono (400–500), the same font families
  as the Git tutorial, with bundled SIL licenses. Code frames include copy buttons.
- Original accessible technical SVGs and complete static packaging checkpoint.
- Light Naruto framing, optional AI exercises, manual paths, local-only ports.
- Four Next.js/PostgreSQL/Compose lessons with equal isolated Prisma and Drizzle
  task-tracker implementations, migration histories, seeds, standalone Dockerfiles
  and development/host Compose overrides. Start at [the checkpoint README](examples/compose/README.md).
- Logical PostgreSQL backup/restore and compatible existing-data schema expansion,
  with isolated Prisma/Drizzle overlays and disposable runtime verification.
  See [the recovery checkpoint](examples/recovery/README.md).
- Controlled migration failure/reconciliation for both ORMs; fake-secret/cache
  BuildKit checkpoint; non-root/read-only runtime with bounded resources/logs;
  pull-only app/tools release overlays; optional approval-gated GitHub Actions/GHCR
  template and single-host release/rollback runbook. See
  [the delivery checkpoint](examples/delivery/README.md).
- Preview-server tests block environment files, dependencies and backup artifacts.

The design uses split onboarding, optimized owner-supplied Naruto/Sakura/Sasuke
portraits, orange accents, feature cards and blue documentation navigation. No
runtime external font/icon CDN or framework is needed. Character-art redistribution
rights remain unverified; see [NOTICE.md](NOTICE.md). Technical diagrams and the
retained abstract team illustrations are original SVGs. Font licenses are bundled.

## Lab boundary

Open the first lesson before running commands. Windows uses WSL Bash, Linux
containers and local Desktop integration; macOS and Linux differences are noted.
The initial Dockerfile packages a static page **before** introducing the full
Next.js application. It is intentionally not a production image.

Docker Desktop 4.57.0 / Engine 29.1.3 now passes the disposable lab checks on
Linux AMD64 through the Windows client. Results, exact image digests and cleanup
status are recorded in `tests/results/docker-labs.json`. These checks do not
certify installation on every OS or a production architecture.

To repeat the review (requires the confirmed local `desktop-linux` context):

```bash
node tools/check-docker-labs.cjs
```

**State-changing test:** downloads small public images, builds a uniquely tagged
image, allocates ephemeral loopback ports, and creates uniquely named disposable
containers, a network and three volumes. Its final cleanup removes only test-owned
resources and their test data. It never prunes or touches existing user services.
Pulled public base images remain cached. Inspect the script before running it.
The existing `dockerlab-db` container was not modified.

## Docker scope and release boundary

The Docker learning path now runs from the first container through the capstone.
Run one ORM at a time on an 8 GB planning target; the lighter foundations labs
do not need Next.js or a database. No cluster installation is required.

**Local teaching checkpoint, not public-production certification.** GHCR workflow
execution, paid VPS provisioning, public TLS/authentication, image scanning,
signed attestations and independent-host recovery require a separately reviewed
environment. Templates/runbooks are included; no remote deployment or package push
is claimed. This demo has no authentication/authorization: do not expose private
data. Platform-specific installation, ARM64 app execution and full manual
accessibility review remain outside the local Windows-client/Linux-AMD64 evidence.

Repeat the state-changing Compose checks with `node tools/check-compose-labs.cjs prisma`
or `node tools/check-compose-labs.cjs drizzle`. These build/download images and use
unique project names, ephemeral loopback ports and disposable data. Cleanup removes
only that run's containers, network and volume; built/base images remain cached.
Use the confirmed local context only. See `tests/results/compose-*.json` and the
review log for actual execution status, dependency findings and platform limits.

Repeat the recovery checks with `node tools/check-recovery-labs.cjs prisma` or
`drizzle`. **State-changing:** requires the confirmed local `desktop-linux` context;
creates unique disposable databases/projects, restores and compares rows, applies
the second ORM migration and tests old-app writes. Cleanup removes only that run's
containers/network/volume. Cached images and demo-only archives remain; result
JSON files record archive hashes and cleanup status. Never use real data in these
tests or publish their archives. Learner backup commands store archives outside
the guide's web root.

Repeat the delivery checks with `node tools/check-delivery-labs.cjs prisma` or
`drizzle`. They deliberately fail a migration in a fresh disposable database,
recover it, check hardened runtime controls and recreate the exact app artifact
while retaining tasks. They never use an existing working database. Their final
cleanup deletes only that run's test data; cached app/tools images remain.
See `tests/results/delivery-*.json` for `passed` and `cleaned` status.

Run `node tools/check-buildkit-labs.cjs` to test missing/fake secret mounts,
cached rebuild and final-image boundaries. It removes its own unique image tag
and fake secret file, retaining shared base images/build cache.

Both lockfiles use explicit esbuild 0.28.1 overrides to remediate the previously
recorded tooling advisories. Re-audit with `npm audit --audit-level=low` from each
track directory; a clean npm advisory check is not a complete image security scan.

The preview remains loopback-only. Restart an already-running preview after
changing `tools/serve.cjs` to load its new environment/backup access restrictions.
