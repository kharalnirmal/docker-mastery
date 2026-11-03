# Content and validation review

Review date: 2026-11-03 (environment date). Reviewer: OpenCode assistant.
This log retains chronological checkpoint evidence. The final Docker-only section
supersedes earlier backlog/dependency statements; this is not production certification.

## Decisions

- Initial authorization: separate `docker-kubernetes-guide/`, shell plus three lessons.
  Follow-up authorization: continue Docker after engine startup and match the
  supplied Git tutorial's fonts and navigation properly. This batch adds lifecycle,
  networking, volume persistence/restore and a command reference (seven entries).
- Hardware planning target: 8 GB; Windows/WSL2 first; kind deferred until Docker.
- Design steering: user supplied Git tutorial source after first design; revised
  to its visual language. Original reference has not been modified.
- Static site, plain JavaScript, dependency-free Node preview/tests; no Next.js
  runtime is needed for the documentation shell.
- NGINX `stable-alpine`, Alpine `3`, and hello-world's implicit `latest` remain
  explicitly mutable teaching tags. The exact tested registry digests are recorded
   in `tests/results/docker-labs.json`. See the later Compose section for selected app/ORM versions.
- Inter 400/500/600/700/800 and JetBrains Mono 400/500 were fetched from Google
  Fonts and self-hosted with their upstream SIL Open Font Licenses. Typography,
  sidebar geometry, header search, icon rows and code frames follow the reference.

## Sources

| Lesson/file | Official source | Method / observed result |
| --- | --- | --- |
| First container | https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/ | Fetched 2026-11-03; verified explicit loopback syntax and EXPOSE distinction |
| Dockerfile | https://docs.docker.com/reference/dockerfile/ | Fetched 2026-11-03; reviewed FROM, WORKDIR, COPY, RUN, EXPOSE, CMD behavior |
| Troubleshooting | https://nginx.org/en/docs/switches.html | Fetched 2026-11-03; verified -t, -c and -g meanings |
| Platform setup | https://docs.docker.com/desktop/setup/install/windows-install/ | Linked; support/licensing version verification pending before publication |
| NGINX base | https://hub.docker.com/_/nginx | Linux AMD64 image and inherited startup exercised; exact digest in execution artifact |
| Networking | https://docs.docker.com/engine/network/drivers/bridge/ | Fetched 2026-11-03; verified user-defined network DNS, names and port boundaries |
| Persistence | https://docs.docker.com/engine/storage/volumes/ | Fetched 2026-11-03; verified mount fields, readonly and independent volume lifetime |
| Lifecycle | https://docs.docker.com/reference/cli/docker/container/exec/ | Fetched 2026-11-03; verified exec needs a running container and starts a separate executable |

All linked installation, platform, CLI and licensing references need a final
publication review. Do not interpret an existing link as a completed verification.

## Execution record

| Check | Environment | Observed result |
| --- | --- | --- |
| Node | Windows AMD64, Node 24.14.0 | Available |
| Docker connection | Windows client 29.1.3, Desktop 4.57.0, Linux AMD64 engine 29.1.3, WSL2 kernel 6.6.87.2 | PASS after user started engine; earlier unavailability resolved |
| Docker labs | See tests/results/docker-labs.json for exact images | PASS: greeting, Dockerfile build/HTTP, stop/start and exec, deliberate missing-config failure, default-command recovery, bridge DNS/HTTP, named-volume persistence after writer removal, static-file backup/restore into separate volume; owned-resource cleanup succeeded |
| Compose availability | CLI reports v5.0.1 | Available via modern docker compose syntax; no Compose lab claimed yet |
| Structural tests | Node built-in test runner | PASS: six checks, including seven-entry metadata, lesson/file parity, font faces/licenses and local links |
| Browser checks | Chromium via agent-browser on Windows | PASS: all seven requested viewport sizes and all seven lesson pages at 320px; bundled font loading; onboarding fits; no outer horizontal overflow; drawer focus/trap, Escape and link dismissal; header search with Ctrl+K/arrows/Enter/Escape, resize dismissal, theme persistence, history, copy-to-clipboard buttons, code frames, section links, images, invalid-route recovery; no reported page errors |
| Touch input | Chromium CDP touch emulation, 390×844 | PASS: trusted touch events on hamburger, drawer lesson link, backdrop and search open/close; not physical hardware testing |
| WSL/macOS/Linux labs | Learner environments | NOT RUN |

Expected outputs in lessons are illustrative, not recorded observations.
For that foundations batch, no database backup, ORM parity, Next.js build,
deployment, or Kubernetes test was claimed. See the new checkpoint below for
its independent results. The volume archive is not a database backup.
The runner uses unique prefixes and engine-assigned loopback ports rather than
potentially colliding learner names/port 8080. It invokes the Docker CLI from
Windows; copy/paste behavior of every Bash command on each OS remains unverified.
An existing user container, dockerlab-db, was left untouched and its state checked.

## Browser review scope

Reproduce automated checks with the preview running:
`node tests/browser-check.cjs` (requires separately installed agent-browser).
Desktop documentation screenshots compared with the source at 1440×900. Use
`node tests/browser-touch.cjs` for trusted Chromium touch-emulation checks.
Full zoom/text-enlargement, physical hardware, both-theme full contrast review and
reduced-motion review remain outstanding. These suites do not certify complete
accessibility.
An axe 4.12.1 landing scan initially reported no violations but flagged manual
review items: generic labelled group, hidden skip target, and gradient contrast.
The group and skip behavior were corrected and CTA colors darkened afterward.
Decorative symbols and gradients still require manual contrast judgment.
The updated documentation page was scanned with axe 4.12.1: zero violations,
47 passes, one manual review item for aria-controls on the closed search dialog.
The referenced dialog exists and native modal keyboard behavior is tested.

## Next.js + PostgreSQL and Compose checkpoint

Follow-up authorization: implement the next phase after fixing the Dockerfile
Instruction/Purpose table. No Kubernetes or public deployment added. The static
documentation site stays framework-free; only the teaching apps use Next.js.

### Selected versions and official source review

Checked 2026-11-03 using registry metadata and fetched official documentation:

| Area | Version / source | Observation |
| --- | --- | --- |
| Next.js / React | 16.4.4 / 19.3.1; https://nextjs.org/docs/app/guides/self-hosting | Reviewed server-only runtime env, public build-time env, standalone boundaries and graceful shutdown |
| Dev origins | https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins | Fetched after runtime exposed blocked loopback assets; allow only explicit 127.0.0.1 alongside built-in localhost, not wildcard hosts |
| Prisma | 7.10.1; https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators | Supported stable 7.x selected rather than 8 RC; explicit generated TS output and pg adapter; separate config/generation/deploy migration |
| Drizzle ORM / Kit | 0.45.4 / 0.31.11; https://orm.drizzle.team/docs/get-started-postgresql | Selected stable packages rather than beta/RC; node-postgres pool and committed Kit SQL/metadata |
| PostgreSQL | postgres:18-bookworm; https://raw.githubusercontent.com/docker-library/docs/master/postgres/README.md | Verified 18+ volume target /var/lib/postgresql and empty-directory-only initialization behavior |
| Driver | pg 8.16.3 | Both app pools capped at five; connection timeout three seconds |
| Node | Host 24.14.0; image node:24-bookworm-slim | Mutable teaching tags, not immutable delivery references; lockfiles included for both tracks |

### Observed checks

Artifacts: `tests/results/compose-prisma.json` and `compose-drizzle.json`.
Runner: `node tools/check-compose-labs.cjs prisma` (or drizzle). Environment:
Windows client / Docker Desktop Linux AMD64, same engine as foundations.

- PASS independently for both tracks: Compose configuration; standalone runner
  and tools builds without a live DB; fresh migration; repeated migration and
  repeatable seed; equivalent welcome/member data; create/list/assign/complete;
  invalid title/assignee/offset and missing-task handling; runtime UID 1000;
  unpublished DB; full down/up preserving task data; stopped-DB health 200 versus
  readiness 503, then recovery after DB start.
- Prisma migration tooling needed OpenSSL/CA packages in the slim tools/build
  stage; added and successfully rebuilt. App runner uses the JS pg adapter.
- PASS eight dependency-free structural tests, now including eleven lessons,
  equal UI/API/config boundaries and unbroken instruction-cell CSS.
- PASS documentation Chromium suite: seven required viewport sizes, all eleven
  lessons at 320px, existing keyboard/search/theme/history/navigation checks;
  instruction names each occupy one text rectangle at 320, 768 and 1440px with
  top-aligned table cells and no outer horizontal overflow.
- PASS independently for both app tracks: live Next 16.4.4 Turbopack MCP route
  discovery, empty compilation/config/session errors; Chromium create/assign/
  complete, reload persistence, 320/1440px no document overflow, React Tracker
  tree inspection, no reported browser errors, and a browser-origin create in
  the rebuilt standalone production runner. Loopback dev assets initially failed;
  explicit allowedDevOrigins fixed them. No wildcard host exemption was used.
- Both uniquely owned verification projects and their disposable volumes were
  removed after checks; images remain cached. These checks did not alter user
  services. Browser automation required retrying a transient daemon-close EOF;
  no app result was inferred from that tool failure.

### Dependency findings and limits

`npm audit` reports one low tooling/transitive esbuild advisory in the Prisma
lockfile (GHSA-g7r4-m6w7-qqqr), and four moderate entries in Drizzle Kit's older
esbuild loader chain (GHSA-67mh-4wv8-2f99). Do not run esbuild's development server
or Drizzle Studio from these tools images. The app runner excludes migration CLI
tooling, but this is not a full image/supply-chain security audit. No forced
breaking dependency downgrade or unverified override was applied to hide findings.
Dependency remediation remains a publication gate; no security certification.

These results establish checkpoint parity, not whole-course parity. Host-app
copy/paste on WSL/macOS/Linux, logical database backup/restore, existing-data
schema **upgrade**, controlled migration failure, full accessibility review,
public authentication/authorization, VPS and Kubernetes remain unverified or
deferred. Reapplying the same initial migration is not an upgrade test.
Hot-reload mode renders and handles real requests, but a live edited-source HMR
exercise was not automated; do not interpret it as a complete HMR/platform test.

To reproduce app-browser verification, run both Compose runners with `--keep`,
then `node tests/browser-compose.cjs` (agent-browser required). That suite reads
the uniquely named projects from the result artifacts, checks development and
standalone modes and removes only those projects/volumes afterward. Its optional
`prisma` or `drizzle` argument reruns just that still-retained track.

## Onboarding social profiles

Copied the creator GitHub, LinkedIn and Instagram profile URLs and SVG icon paths
from the supplied Git tutorial's creator card (reference remains unchanged).
Icons are inline/local, accessible names identify the destination/new tab, and
links use noopener/noreferrer. Each social target is 44×44 CSS pixels; compact
onboarding spacing preserves the small-screen fit without shrinking touch targets.
Structural suite now has nine checks, including social URLs/icons/new-tab safety.

## Logical recovery and compatible schema expansion

Continuation batch: two new lessons (13 total), original backup-flow SVG,
`examples/recovery/README.md`, independent Prisma/Drizzle schema-and-migration
overlays, and `tools/check-recovery-labs.cjs`. Baseline app features and initial
migration histories are unchanged. No new packages or public deployment added.

Official sources fetched 2026-11-03:

| Source | Review |
| --- | --- |
| https://www.postgresql.org/docs/18/app-pgdump.html | Consistent single-database export, custom format, version limits, global-object exclusions and untrusted-dump risks |
| https://www.postgresql.org/docs/18/app-pgrestore.html | Empty template0 destination, single transaction, owner/ACL switches and avoiding archived-name --create |
| https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production | Explicit deploy, no client generation/reset/shadow DB; missing-history/drift limits |
| https://orm.drizzle.team/docs/drizzle-kit-migrate | SQL/history-based migration selection; retained pinned 0.31.11 checkpoint format rather than copying newer docs' directory conventions |

Observed verification on the same Windows Docker Desktop/Linux AMD64 engine:

- PASS independently for both ORMs: fresh history and seed; additional assigned,
  completed task; pg_dump custom archive; table-of-contents includes ORM history;
  binary archive copied off-container and back; restore into empty tracker_restore;
  exact equality of every Project, Member and Task business row; migration deploy
  against the restored history without initial SQL replay or seeding.
- PASS independently: second migration adds nullable description to the populated
  original database; repeat deploy; all original task fields preserved and new
  descriptions NULL; unchanged standalone app reads the retained completed task
  and creates a new task after expansion. The new UI/API description feature is
  intentionally not implemented. App-image rollback is not database restoration.
- Results: `tests/results/recovery-prisma.json` and `recovery-drizzle.json`, with
  unique project names, demo archive SHA-256 and cleanup status. All test-owned
  containers/networks/volumes removed; images and demo-only host archives retained.
- Initial Prisma test caught an automation copy-path issue: path normalization
  removed Docker cp's trailing `/.`, nesting rather than merging the overlay.
  Fixed the runner's contents-copy path and reran successfully. No learner or
  existing user database was modified by either attempt.
- PASS ten structural checks, including equivalent nullable-column overlays,
  retained Drizzle initial journal entry and linked snapshot/table parity.
- PASS Chromium suite: seven required viewport sizes, all 13 lesson pages at
  320px with no document overflow, existing theme/search/history/navigation/copy
  checks, and no reported page errors. Existing local preview was reused after
  confirming it serves this project's new recovery script.

Limits: learner WSL/macOS/Linux copy/paste and the Bash bind-mount overlay command
are documented, not independently executed on those platforms; automation uses
Windows CLI and Docker cp into an isolated tools container. This is a same-server
restore drill, not host-loss/PITR recovery, independent-server application cutover,
large-data lock testing or a production backup strategy. Controlled ORM migration
failure/reconciliation, full new-feature rollout, prior dependency findings and
accessibility review remain open. No Kubernetes/CI/GHCR/VPS implementation claimed.

## Docker-only completion batch

User steering: finish the Docker part and remove Kubernetes for now. The active
brand, home title, lesson navigation and search content are Docker-only. Original
combined planning is preserved as history in the root handoff, not an active
backlog. The folder name remains unchanged to preserve existing paths.

Added seven lessons (20 total): controlled migration failure, BuildKit/cache/
secret/platform boundaries, runtime hardening/rootless concepts, registries and
supply-chain evidence, team CI, single-host release/rollback, and capstone.
Added an original accessible delivery diagram, complete delivery runbook,
secure/release Compose overlays, fake-secret Dockerfile, optional SHA-pinned
GitHub Actions/GHCR workflow, and disposable runtime checkers. No real registry
credentials, cloud resources or public deployment were used.

### Official sources checked 2026-11-03

| Source | Review |
| --- | --- |
| https://docs.docker.com/build/building/secrets/ | Fetched; mounts instead of ARG/ENV; commands can still leak copied/logged secrets |
| https://docs.docker.com/build/building/multi-platform/ | Fetched; manifest/index/platform boundaries, emulation and output/load limitations |
| https://docs.docker.com/engine/security/rootless/ | Fetched; daemon versus non-root USER, UID/GID prerequisites; no host daemon changes performed |
| https://docs.docker.com/reference/compose-file/merge/ | Fetched; ordered merge and !reset null removing inherited builds |
| https://docs.docker.com/subscription/desktop-license/ | Fetched; free-use limits and paid organizational/government cases; no universal free-use promise |
| https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images | Fetched; GHCR GITHUB_TOKEN, package permissions, SHA pins and attestation boundaries |
| GitHub API: actions/checkout commits/v6; actions/setup-node commits/v6; docker/login-action commits/v3 | Resolved upstream SHAs used in the optional workflow; no tag-only Action execution |

### Dependency remediation

Both selected major/ORM versions remain unchanged. Explicit esbuild 0.28.1
overrides replace the vulnerable Prisma tool dependency and Drizzle Kit's nested
@esbuild-kit/core-utils dependency. Regenerated lockfiles with npm, not manual
integrity edits. Both `npm audit --audit-level=low` commands report **zero known
advisories** on 2026-11-03. This supersedes the earlier advisory backlog, not a
claim of complete supply-chain security. Cross-version overrides must be retested
when upstream tools change. Container builds/migrations exercise these paths.

### Checks observed in this batch

- PASS 12 Node tests: 20-lesson metadata and safety/local-link parity, Docker-only
  active content, secure/release/workflow boundaries and preview HTTP restrictions.
- PASS Chromium documentation suite: all seven viewport sizes, all 20 lessons at
  320px, no outer horizontal overflow, navigation/search/keyboard/theme/history,
  copy buttons, images and invalid-route handling; no reported browser errors.
- PASS trusted Chromium touch emulation at 390×844: drawer and search interactions.
- PASS rerun foundations Docker labs with owned-resource cleanup; exact digests
  and engine/Compose versions are in tests/results/docker-labs.json.
- PASS BuildKit missing-required-secret rejection, supplied fake-secret/cache
  mount, cached rebuild, final-stage file exclusions, non-root execution and no
  fake-secret literal in final history. Own image tag/fake file removed; shared
  cache/base images remain. Artifact: tests/results/buildkit.json. This is not a
  forensic scan of every layer or evidence for real private-registry builds.
- PASS both remediated ORM tracks: fresh/repeated generation, initial migration,
  repeated seeds, valid/invalid API behavior, non-root runtime/unpublished DB,
  persistence through full container replacement and DB-outage health/readiness
  recovery. Fresh results replace tests/results/compose-prisma.json and
  compose-drizzle.json; both test-owned projects/data were cleaned.
- PASS both delivery runners: controlled duplicate-column failure with asserted
  ORM-specific history, exact preserved business rows, reviewed lab conflict
  repair and Prisma explicit rolled-back resolution, retry/repeat deploy;
  read-only non-root runtime, dropped capabilities/no-new-privileges, memory/PID/
  log settings, writable bounded tmpfs, real writes, normal SIGTERM stop/restart,
  and pull-only same-image replacement retaining tasks. Artifacts:
  tests/results/delivery-prisma.json and delivery-drizzle.json, each passed=true
  and cleaned=true. These use local image IDs, not public registry digest proofs.
- PASS rerun recovery for both remediated tracks: custom archive copied to host,
  separate empty-database restoration with exact business-row equality, restored
  ORM history, populated-schema expansion/repeat deploy, old-app reads and new
  writes after expansion. Both recovery JSON artifacts report passed=true and
  cleaned=true; demo-only archives remain ignored and blocked by the new preview.

The initial delivery test correctly caught an overstrict exit-code expectation:
Next exits 143 on SIGTERM in this setup. The runner now accepts 0/143, rejects
forced-kill/OOM and separately tests restart. A subsequent readiness timeout
exposed ephemeral loopback port reassignment across stop/start: the runner now
re-queries the mapping instead of assuming it is stable. Test-owned resources
were removed after these failed attempts; no working user database was touched.

### Deliberate limits

The GitHub workflow is a reviewed **template**, not an executed remote pipeline.
It publishes exact tested app/tools artifacts only after configured approval;
it does not claim image scanning, SBOM creation, signed provenance, production
deployments or production-ready security. Environment reviewers/branch protection
must be configured in the user's repository. GHCR push/pull by registry digest,
VPS/TLS setup, least-privilege production DB roles and real secret delivery require
separate authorized infrastructure. No paid infrastructure is necessary locally.

Full manual contrast/zoom/accessibility review, physical devices, native
WSL/macOS/Linux learner copy/paste, ARM64 app execution, rootless daemon install,
long-request shutdown draining, large-data migration locks, independent-host/PITR
restoration and public authentication remain unverified environment-specific
checks. Optional Redis/workers are deliberately excluded: this tracker has no
queue feature that justifies introducing them. Docker lessons are standalone;
no cluster curriculum or tool installation is pending in the active scope.

## Public repository preparation

User authorized a public Docker Mastery GitHub repository. Added the public-facing
README, moved detailed local validation instructions to LAB-VALIDATION.md, and
added NOTICE.md. Unverified character JPEGs remain local/ignored; the public UI
uses new original abstract team-avatar SVGs. Font licenses remain bundled; no
blanket content/software license has been assumed. The source guide is still
static and no deployment workflow was activated.

Rechecked 12 Node tests and the seven-viewport/all-20-lesson Chromium suite after
the new branding and illustrations: PASS. Staged paths exclude environment files
(except deliberate .env.example), dependencies, generated output, dump archives,
private-key files and unverified artwork. A common credential-pattern check found
no matches; this is a publication check, not a complete secret-security guarantee.
