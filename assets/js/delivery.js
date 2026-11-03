/* Docker-only completion path. Authored local HTML; never interpolate user input. */
window.LESSONS.push({
  id: 'migration-failures', title: 'Recover a failed migration deliberately', group: 'Recovery & migrations', level: 'Advanced', minutes: 35,
  description: 'Reproduce a conflicting column in disposable databases, inspect ORM history and retry without losing tasks.',
  keywords: 'Prisma P3018 P3009 resolve rolled-back Drizzle transaction failed migration history reconciliation',
  html: `
    <h2 id="prepare">1. Keep experiments out of your working database</h2>
    <p><strong>The problem:</strong> a release migration fails, but Sakura must preserve completed tasks. Prerequisites: <a href="#schema-upgrades">compatible upgrades</a> and a verified restore. Estimated effort: 35 minutes. Use WSL Bash on Windows, Bash on macOS/Linux. This lesson deliberately fails SQL in a uniquely owned disposable project, not your existing tracker.</p>
    <p>The <a href="examples/delivery/README.md">delivery runbook</a> explains the complete controlled test. From the guide root, choose one:</p>
    <pre><code>node tools/check-delivery-labs.cjs prisma
node tools/check-delivery-labs.cjs drizzle</code></pre>
    <p><code>node</code> executes the file on the host; the final argument chooses one ORM. Run sequentially on low-memory machines. This state-changing runner downloads/builds images, creates a fresh project, seeds demo data and deletes only its own test volumes in cleanup. It accepts the confirmed local desktop-linux context only, never a remote production target.</p>
    <h2 id="failure">2. Understand the deliberate failure</h2>
    <p>The test adds an empty nullable description column manually to its fresh database, then runs the committed migration that adds that same column. PostgreSQL rejects the duplicate. The baseline business rows must remain identical. A nonzero command exit is expected for this step; it is not permission to ignore other failures.</p>
    <h2 id="inspect">3. Inspect before resolving</h2>
    <p>Prisma records an unfinished migration in <code>_prisma_migrations</code> and blocks further deployment until reconciled. Drizzle Kit's pinned PostgreSQL path rolls back the failed migration transaction without adding the second history entry. The runner asserts these different outcomes; never infer that all versions, engines or SQL statements behave identically.</p>
    <h2 id="repair">4. Repair only the proven lab conflict</h2>
    <p>The runner verifies every description is NULL, removes only its deliberately created empty column, and preserves original tasks. <strong>Destructive SQL warning:</strong> dropping a real column loses its data. Do not copy that repair to an incident database. Back up, inspect partial effects and review the actual SQL first.</p>
    <h2 id="reconcile">5. Reconcile the selected ORM</h2>
    <pre><code>npx --no-install prisma migrate resolve --rolled-back 202611030002_description</code></pre>
    <p>Illustrative Prisma tools-container command used by the runner, not a host command for your baseline. <code>npx --no-install</code> uses the installed tool without downloading another version. <code>resolve</code> edits migration bookkeeping; <code>--rolled-back</code> marks this named failed attempt eligible for retry. It does not undo SQL. Drizzle needs no equivalent mark here because the failed transaction added no history row. Never fabricate an applied migration.</p>
    <h2 id="verify">6. Retry and verify</h2>
    <p>Expected: the reviewed migration succeeds, repeat deploy does nothing, every original task/assignment/completion remains, and the unchanged old app can still write. The runner subsequently exercises the secured app. Results are saved separately for each ORM in tests/results/delivery-TRACK.json; inspect passed and cleaned, not just a PASS line midway.</p>
    <h2 id="practice">7. Practice and incident judgment</h2>
    <p>Guided: compare ORM history handling. <strong>Independent challenge:</strong> explain why a partly applied backfill needs a different plan than this empty-column conflict. Optional AI: give the public migration and synthetic error, ask for read-only diagnostics, then reject any proposed reset or unverified history edit.</p>
    <h2 id="cleanup">8. Cleanup, checkpoint and references</h2>
    <p>The runner removes only its uniquely named containers/network/volume; cached images remain. A failed cleanup is reported, not hidden. Can you distinguish repairing data from repairing bookkeeping? References: <a href="https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting">Prisma troubleshooting</a> and <a href="https://orm.drizzle.team/docs/drizzle-kit-migrate">Drizzle migrate</a>. Next: <a href="#buildkit-workflows">build safely</a>.</p>`
}, {
  id: 'buildkit-workflows', title: 'BuildKit, secrets, caches and platforms', group: 'Secure builds & delivery', level: 'Advanced', minutes: 30,
  description: 'Use a fake secret mount and cache mount, understand build outputs and choose supported target architectures.',
  keywords: 'BuildKit buildx cache secret mount ARG ENV platform amd64 arm64 multi-stage layers standalone CMD ENTRYPOINT PID 1',
  html: `
    <h2 id="prepare">1. Build inputs are a trust boundary</h2>
    <p><strong>The problem:</strong> Sasuke wants faster builds without baking credentials into an image. Prerequisites: <a href="#first-dockerfile">Dockerfile</a> and <a href="#compose-stack">standalone app builds</a>. Estimated effort: 30 minutes; host Bash on WSL/macOS/Linux. Use only the fake secret below.</p>
    <h2 id="stages">2. Separate build and runtime</h2>
    <p>The app Dockerfiles install from a lockfile in dependencies, add source in development, compile in build and copy standalone output into runner. <code>AS</code> names a stage; <code>COPY --from=build</code> reads its filesystem, not the host. <code>--chown=node:node</code> sets copied ownership. Source changes need not invalidate dependency installation. The runtime excludes the migration CLI; tools is a separate artifact.</p>
    <p>Next standalone tracing includes required server dependencies; .next/static is copied separately. These apps have no public directory; if you add one, explicitly copy it into runner. Monorepos may need outputFileTracingRoot and additional traced files. Test real assets, not just a 200 health response.</p>
    <h2 id="mounts">3. Read the small BuildKit checkpoint</h2>
    <p>Open <a href="examples/delivery/Dockerfile.buildkit">the complete Dockerfile</a>. <code>RUN --mount=type=secret</code> exposes a file only during that RUN; required=true fails if absent. <code>type=cache</code> keeps disposable builder cache between runs, not final image data. Cache may disappear and must never be needed for correctness. The final stage copies only a fixed proof file.</p>
    <h2 id="build">4. Supply a fake build secret</h2>
    <p>From the guide root, choose a fresh filename if it already exists. State-changing: builds a local image and builder cache.</p>
    <pre><code>printf 'fake-demo-only' > "$HOME/guide-demo-secret.txt"
docker buildx build --load --secret "id=demo,src=$HOME/guide-demo-secret.txt" -f examples/delivery/Dockerfile.buildkit -t guide-buildkit:local examples/delivery
docker run --rm guide-buildkit:local</code></pre>
    <p><code>printf</code> writes fixed text; <code>></code> redirects output and overwrites, so use only a new demo file. <code>buildx build</code> invokes BuildKit; <code>--load</code> loads a single-platform result into the local engine. <code>--secret</code> maps a host file to the secret ID; <code>-f</code> selects this Dockerfile, <code>-t</code> names the output and the last path selects context. <code>--rm</code> removes the exited proof container, not the image.</p>
    <h2 id="verify">5. Verify boundaries, not marketing claims</h2>
    <pre><code>docker run --rm guide-buildkit:local sh -ec 'test ! -e /run/secrets/demo; test ! -e /var/cache/guide/status; cat /proof.txt'
docker history --no-trunc guide-buildkit:local</code></pre>
    <p>Expected: checks succeed and the fixed proof prints, without secret/cache files. <code>sh -ec</code> executes the string and fails on a failed check; test <code>!</code> negates existence <code>-e</code>. <code>history --no-trunc</code> shows unshortened image history, but is not a complete secret scanner. A malicious RUN can still copy a mounted secret into layers or logs. Never echo real secrets. ARG and ENV are not secret stores.</p>
    <h2 id="platforms">6. Platforms and output choices</h2>
    <pre><code>docker buildx ls
docker image inspect guide-buildkit:local</code></pre>
    <p>Both are read-only. Inspect supported builder platforms and image architecture. A reviewed registry build can use <code>--platform linux/amd64,linux/arm64</code> with <code>--push</code>; this creates/publishes a manifest index and per-platform images, unlike loading one local image. Do not add --push until the repository and credentials are yours. Emulation can be slow; native dependencies must be built/tested per architecture. This course's app runtime evidence is Linux AMD64, not ARM certification.</p>
    <h2 id="practice">7. Troubleshoot and practice</h2>
    <p>Missing secret → verify ID/path, not COPY credentials. No local image → check build output/--load. Stale dependency layer → inspect lockfile/context, not blindly disable all cache. Guided: rebuild and observe cache hits. <strong>Independent challenge:</strong> explain how a secret-consuming instruction could leak despite using mounts. Optional AI: review only this fake-secret Dockerfile and verify each proposed change.</p>
    <h2 id="cleanup">8. Cleanup, recap and references</h2>
    <p>Inspect the exact demo filename before deleting it manually; keep or explicitly remove only guide-buildkit:local after inspecting its users. Do not prune shared builder caches. Checkpoint: why is a cache not persistent app storage? References: <a href="https://docs.docker.com/build/building/secrets/">build secrets</a>, <a href="https://docs.docker.com/build/building/multi-platform/">multi-platform builds</a> and <a href="https://nextjs.org/docs/app/guides/self-hosting">Next self-hosting</a>.</p>`
}, {
  id: 'secure-runtime', title: 'Harden the runtime and bound resources', group: 'Secure builds & delivery', level: 'Advanced', minutes: 35,
  description: 'Run non-root with read-only files, tmpfs, dropped capabilities, memory/CPU/PID limits and bounded logs.',
  keywords: 'security non-root rootless capabilities read_only tmpfs no-new-privileges mem_limit cpus pids_limit OOM logs socket PID signals',
  html: `
    <h2 id="prepare">1. Reduce blast radius</h2>
    <p><strong>The problem:</strong> a compromised app should not freely modify its image filesystem or exhaust host resources. Prerequisites: working Compose and <a href="#buildkit-workflows">build/runtime separation</a>. Estimated effort: 35 minutes. Keep demo ports loopback-only; these controls are defense in depth, not authentication or complete isolation.</p>
    <h2 id="overlay">2. Apply the reviewed overlay</h2>
    <p>From your selected examples/compose/prisma or drizzle directory, with .env already configured:</p>
    <pre><code>docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml config --quiet
docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml up -d --build</code></pre>
    <p>Read <a href="examples/delivery/compose.secure.yaml">the full overlay</a> first. Repeated <code>-f</code> selects ordered files, later fields merge/override; paths resolve from the first file. <code>config --quiet</code> validates without printing secrets. <code>up -d --build</code> builds and replaces services; it does not apply migrations or seed a new database. Use the earlier explicit tools steps first for a fresh stack. Repeat these same file flags for inspection and shutdown.</p>
    <h2 id="permissions">3. Filesystem and privileges</h2>
    <p>USER node is UID 1000, not root. read_only prevents image-root writes. tmpfs provides bounded ephemeral /tmp and a node-owned Next cache; both disappear on replacement. cap_drop removes Linux capabilities; no-new-privileges blocks gaining privileges through executables. The container still shares the engine kernel. Never mount the Docker socket, host root or use privileged mode as a permission fix.</p>
    <h2 id="resources">4. Bound resource consumption</h2>
    <p>mem_limit=512m is a hard container memory ceiling; cpus=1.0 bounds CPU time, not an exclusive core; pids_limit bounds processes/threads, not HTTP requests. These are illustrative lab limits, not capacity sizing. PostgreSQL also needs shared memory/disk/connection planning. An OOM kill is not proof of a memory leak and exit 137 alone is not proof of OOM.</p>
    <pre><code>docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml stats --no-stream
docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml ps -q app</code></pre>
    <p><code>stats --no-stream</code> takes one resource snapshot. <code>ps -q</code> prints service container IDs; inspect the actual ID with docker inspect and check State.OOMKilled and HostConfig limits. Do not paste an invented placeholder ID. json-file rotation caps each container's retained log files at three of about 10 MB; this is not centralized retention or a total host-disk limit.</p>
    <h2 id="signals">5. Signals and health</h2>
    <p>Exec-form CMD runs node server.js without a shell swallowing signals. init forwards signals and reaps orphaned children. stop_grace_period allows 30 seconds before forced termination. CMD provides defaults; ENTRYPOINT specifies the executable wrapper and combines with CMD arguments. Overriding CMD does not automatically replace ENTRYPOINT. Health failures show unhealthy; plain Compose does not restart a process just because a check fails. Database outages should fail readiness, not imply process death.</p>
    <h2 id="rootless">6. Rootless is a different control</h2>
    <p>Non-root inside a container is not a rootless daemon. Linux rootless Docker maps daemon/container identities through user namespaces; prerequisite subordinate UIDs/GIDs, cgroup delegation and networking/storage behavior must be reviewed for the distribution. Do not disable an existing daemon or switch contexts during these labs. Desktop's VM boundary is not evidence that a native rootless setup was tested.</p>
    <h2 id="practice">7. Verify and practice</h2>
    <p>Expected: real API create/list works; /app/server.js is unwritable; /tmp and Next cache are writable; runtime UID is 1000; SIGTERM stop exits 0 or 143, not a forced SIGKILL. The delivery runner asserts those controls for both ORMs. This is not a long-request draining test. Permission denied → inspect the exact required writable path → add only a bounded, owned path, not root access. <strong>Independent challenge:</strong> propose alert thresholds from a measured workload. Optional AI: review the public overlay for unnecessary privileges and verify against actual inspect output.</p>
    <h2 id="cleanup">8. Cleanup, checkpoint and references</h2>
    <pre><code>docker compose -f compose.yaml -f ../../delivery/compose.secure.yaml down</code></pre>
    <p>This interrupts the selected app but retains its database volume. Checkpoint: distinguish process restart, health status and readiness. References: <a href="https://docs.docker.com/engine/security/rootless/">rootless mode</a>, <a href="https://docs.docker.com/reference/compose-file/services/">Compose services</a> and <a href="https://docs.docker.com/engine/logging/drivers/json-file/">log rotation</a>.</p>`
}, {
  id: 'registry-artifacts', title: 'Registries, digests and supply-chain evidence', group: 'Secure builds & delivery', level: 'Advanced', minutes: 30,
  description: 'Separate tags, image IDs and registry digests, publish safely and review scans, SBOMs and provenance.',
  keywords: 'GHCR registry login password-stdin tag push pull digest sha256 SBOM provenance signing scanning vulnerability retention promotion',
  html: `
    <h2 id="prepare">1. Identify what you deploy</h2>
    <p><strong>The problem:</strong> staging passed, but a mutable tag moved before release. Prerequisites: <a href="#secure-runtime">secure runtime</a> and a repository you control for optional publishing. Estimated effort: 30 minutes. No public push is needed for local completion; no credentials are bundled.</p>
    <h2 id="identity">2. Three identities, three meanings</h2>
    <p>A tag is a movable label. A local image ID hashes image configuration. A registry manifest digest identifies distributed content; a multi-platform index has a different digest from its child manifests. Do not put a local image ID after a registry @sha256 prefix and call it a verified deployment. Record the actual pushed digest and target platform.</p>
    <figure><a href="assets/images/delivery.svg"><img src="assets/images/delivery.svg" alt="Reviewed commit builds app and tools images, local checks test exact image IDs, approved registry push records digests and evidence, and staging then single-host release consume the same digest. Database backup and migration are separate steps." loading="lazy"></a><figcaption>Promote artifacts, not a fresh build of the same source.</figcaption></figure>
    <h2 id="auth">3. Authenticate without command-line tokens</h2>
    <p>Optional authorized GHCR session, Bash only. First set GHCR_USER to your account and GHCR_TOKEN through an approved secret manager/environment; use least-privilege package access. Do not put a token literal in history or paste it into the website.</p>
    <pre><code>printf '%s' "$GHCR_TOKEN" | docker login ghcr.io --username "$GHCR_USER" --password-stdin</code></pre>
    <p>The pipe sends stdout to stdin. <code>--username</code> selects the account; <code>--password-stdin</code> avoids a token argument in process listings. Docker's credential helper/config stores login material; review the workstation helper, and never commit ~/.docker/config.json. GitHub Actions uses its short-lived GITHUB_TOKEN only in the publishing job.</p>
    <h2 id="publish">4. Publish only with permission</h2>
    <p>The <a href="examples/delivery/docker-ci.yaml">workflow template</a> names lowercase ghcr.io/owner/repository-ORM and publishes app and tools separately. Local images tested by the delivery runner are tagged and pushed without rebuilding; post-push digest references are recorded in the job summary. Pin these references in a reviewed release environment file. Private packages need pull credentials on the host; package visibility and repository access are separate settings.</p>
    <h2 id="evidence">5. Scan, inventory and attest</h2>
    <p>An <strong>SBOM</strong> inventories components; a vulnerability scan matches known issues and database timestamps. Neither proves exploitability or absence of unknown flaws. Provenance records a build claim; a signature binds a verified identity to content, not to quality. This minimal workflow runs npm audit and runtime integration checks, but does not claim image scanning, signed provenance or SBOM generation. Before public production promotion, add reviewed tools, retain their reports and verify issuer, identity, digest and policy at deployment.</p>
    <h2 id="response">6. Respond to findings</h2>
    <p>Classify affected runtime versus tools dependencies, review reachability and patch/base-image availability, rebuild and retest both tracks, then promote a new digest. Pinning does not remove the need to upgrade. Keep app/tools version pairs and previous compatible releases; registry retention can destroy rollback options. The esbuild overrides in this checkpoint are explicit, version-pinned and exercised through real builds/migrations, not silent audit suppression.</p>
    <h2 id="practice">7. Verify and practice</h2>
    <p>Expected locally: the release overlay recreates exactly the tested image and retains task data. GHCR checks remain optional/unexecuted until run in your own repository. Unauthorized → inspect package permissions/account, never make a private package public as a quick fix. <strong>Independent challenge:</strong> list evidence required to trust an external image. Optional AI: review synthetic scan findings and distinguish known facts from speculation.</p>
    <h2 id="cleanup">8. Cleanup, checkpoint and references</h2>
    <pre><code>docker logout ghcr.io</code></pre>
    <p>This removes the configured registry login, not published packages or all helper sessions. Revoke temporary tokens via their issuer. Do not delete packages still needed for rollback. Checkpoint: can a tag move without changing its name? References: <a href="https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry">GHCR</a> and <a href="https://docs.docker.com/build/metadata/attestations/">attestations</a>.</p>`
}, {
  id: 'docker-ci', title: 'Team CI and controlled artifact promotion', group: 'Secure builds & delivery', level: 'Advanced', minutes: 35,
  description: 'Review a two-track GitHub Actions template with isolated checks and an approval-gated publishing job.',
  keywords: 'GitHub Actions CI CD PR matrix workflows permissions GITHUB_TOKEN approval main environment integration tests artifact promotion',
  html: `
    <h2 id="prepare">1. Turn team policy into gates</h2>
    <p><strong>The problem:</strong> teammates need the same reproducible release checks, without giving pull requests registry credentials. Prerequisites: both <a href="#registry-artifacts">artifact identity</a> and local delivery verification for your chosen track. Estimated effort: 35 minutes. This workspace is not a Git repository; no remote workflow is activated automatically.</p>
    <h2 id="files">2. Inspect the complete template</h2>
    <p>Open <a href="examples/delivery/docker-ci.yaml">docker-ci.yaml</a> and the <a href="examples/delivery/README.md">installation instructions</a>. Copy it into .github/workflows/docker-ci.yaml only in a repository you control, with the guide contents at its root. For a nested guide, adjust paths and working-directory explicitly. Review every pinned Action SHA against its upstream commit before enabling it.</p>
    <h2 id="checks">3. Read-only-token PR checks</h2>
    <p>The checks job uses a Prisma/Drizzle matrix with fail-fast disabled, runs structural tests, audits each lockfile and executes disposable hardened-runtime/migration-failure/release checks on GitHub-hosted Ubuntu. Its token has contents:read only, checkout does not persist credentials, and there is no pull_request_target trigger. Untrusted code must not run on a privileged persistent self-hosted machine.</p>
    <h2 id="publish">4. Publish behind a separate boundary</h2>
    <p>The publish job requires all checks, runs only on a push to main, and names the container-release environment. Configure required reviewers and allowed branch rules in repository settings before enabling it: a YAML environment name alone does not enforce approval. The job tests freshly built local app/tools artifacts, then tags and pushes those exact image IDs. It does not rebuild between its test and push. PR images are never promoted from an untrusted cache.</p>
    <h2 id="explain">5. Understand the YAML fields</h2>
    <p>on selects events; permissions scopes the token; needs gates publication; if restricts the event/ref; strategy.matrix chooses tracks; timeout-minutes bounds job lifetime. env passes values to a process, not secret protection by itself. uses pins third-party code; run executes Bash with strict error handling on the hosted runner. The checks script's --ci switch is accepted only with GITHUB_ACTIONS=true and the local default context; it is not a remote-host switch.</p>
    <h2 id="gaps">6. Define promotion beyond package publishing</h2>
    <p>The workflow publishes packages, not a production deployment. A real rollout requires image scanning/SBOM/signature verification, protected staging and production gates, restore evidence, serialized migrations, smoke tests, observability and rollback ownership. NEXT_PUBLIC values are built into browser bundles: use environment-independent values or document separate builds rather than pretending one digest has different inlined values.</p>
    <h2 id="practice">7. Team exercise and failure handling</h2>
    <p>Expected after authorized setup: both matrix jobs pass; PRs cannot publish; main publication awaits the configured environment reviewer; the summary lists both registry digest references. No such remote execution is claimed here. Guided: review a Dockerfile/migration pull request. <strong>Independent challenge:</strong> assign release, migration, secret-rotation and incident owners. Optional AI: review the public workflow for credential exposure, then verify manually.</p>
    <h2 id="cleanup">8. Cleanup, checkpoint and references</h2>
    <p>Hosted runners are disposable; test-owned volumes are explicitly removed. Configure artifact/package retention without deleting rollback releases. Checkpoint: why is package write permission absent from the PR job? References: <a href="https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images">publishing Docker images</a> and <a href="https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments">deployment environments</a>.</p>`
}, {
  id: 'single-host-release', title: 'Release and roll back on a single host', group: 'Secure builds & delivery', level: 'Advanced', minutes: 40,
  description: 'Use pull-only app/tools artifacts, explicit migrations, readiness checks and safe rollback boundaries.',
  keywords: 'VPS deployment single host TLS reverse proxy rollback digest Compose release backups SLO RPO RTO availability cache pooling',
  html: `
    <h2 id="prepare">1. State the deployment boundary</h2>
    <p><strong>The problem:</strong> the team needs one modest server, not an orchestration platform. Prerequisites: <a href="#docker-ci">release artifacts</a>, a restore drill and approved server access. Estimated effort: 40 minutes. Local rehearsal is sufficient; this guide provisions no billable infrastructure. The demo has <strong>no authentication/authorization</strong>; never expose it publicly with private data.</p>
    <h2 id="host">2. Prepare the host, not just the image</h2>
    <p>Patch the OS/engine, restrict SSH, review firewall/Docker port behavior, allocate disk and memory, encrypt independent backups, configure monitoring and name an owner. Keep the app published only on 127.0.0.1 and PostgreSQL unpublished. A separately reviewed host reverse proxy would terminate TLS and forward to loopback; configure trusted hosts, request limits, streaming/timeouts, certificates and renewal. No production TLS configuration is implied by this local demo.</p>
    <h2 id="config">3. Pair the release artifacts</h2>
    <p>Read <a href="examples/delivery/compose.release.yaml">the pull-only overlay</a>. Set APP_IMAGE and TOOLS_IMAGE in a protected .env.release to reviewed app/tools registry references including their real @sha256 digests; also provide POSTGRES_PASSWORD and APP_PORT. Never paste fake digest placeholders into a runnable command. Tools must include the complete reviewed migration history matching the release. URLs must encode reserved password characters; the course demo uses a URL-safe local value.</p>
    <h2 id="commands">4. Run the explicit release sequence</h2>
    <p>From your selected ORM track, after creating .env.release, define a Bash helper. Stop if any command fails; do not continue a broken migration.</p>
    <pre><code>dc() { docker compose --env-file .env.release -f compose.yaml -f ../../delivery/compose.secure.yaml -f ../../delivery/compose.release.yaml "$@"; }
dc config --quiet
dc pull app tools db
dc up -d db
dc run --rm --no-deps tools npm run db:migrate
dc up -d --no-build --wait app
dc ps</code></pre>
    <p><code>dc()</code> defines a shell function, not a Docker feature; <code>"$@"</code> forwards separate arguments. --env-file selects Compose interpolation values, not an automatic app-wide environment injection. !reset null removes inherited builds (requires a supporting modern Compose). pull downloads images; --no-deps prevents tools from altering other services. Confirm db healthy with dc ps before migration. --wait waits for app health; --no-build prevents host builds. Do not seed a real deployment. Take and verify an off-host backup before the schema-changing step.</p>
    <h2 id="verify">5. Verify behavior and capacity</h2>
    <p>Expected: readiness and process health return 200, existing assignments survive and a browser create/complete/reload works. Confirm the running image digest, UID, limits and unpublished DB. Inspect logs without logging credentials. Two containers on one host are not high availability. Next in-memory caches/sessions are not shared; multiple replicas require coordinated caching/revalidation, stable Server Actions configuration where needed and a database connection budget. Five pool connections per app plus tools/admin reserve must fit the DB limit.</p>
    <h2 id="rollback">6. Roll back the app, not history</h2>
    <p>Keep the previous app/tools digest pair and backup record. If smoke tests fail after a backward-compatible expansion, switch APP_IMAGE back to the reviewed previous app digest, pull app, recreate app with --no-build --wait and verify tasks. Do not run old migrations to reverse SQL or restore yesterday's DB over today's writes. Incompatible schema/data changes require a separate recovery decision. Single-host replacement may interrupt requests; this sequence is not zero-downtime deployment.</p>
    <h2 id="practice">7. Operate and practice</h2>
    <p>Connection refused → inspect selected host/port/service, not open the DB firewall. Unhealthy → read readiness logs and dependency state, not repeatedly restart. Disk growth → inspect image/cache/log/volume usage and retention ownership before deleting anything. <strong>Independent challenge:</strong> propose an SLO and measured recovery targets, then explain host-loss limitations. Optional AI: review a sanitized release checklist, never grant deployment credentials.</p>
    <h2 id="cleanup">8. Cleanup, checkpoint and references</h2>
    <p><code>dc down</code> stops this stack and retains volumes, but is an outage on a real server. Never add volume deletion to routine deployment. If you rented infrastructure separately, inventory and explicitly decommission its backups, disks, DNS and billing only with owner approval. References: <a href="https://docs.docker.com/compose/how-tos/production/">Compose production</a>, <a href="https://nextjs.org/docs/app/guides/self-hosting">self-hosting</a>. Next: <a href="#docker-capstone">Docker capstone</a>.</p>`
}, {
  id: 'docker-capstone', title: 'Docker capstone and operational checklist', group: 'Finish Docker', level: 'Advanced', minutes: 60,
  description: 'Prove one complete Docker workflow and distinguish tested local behavior from production release requirements.',
  keywords: 'capstone checklist completion daily workflow incident cleanup prune disk OOM AI security review Docker Compose',
  html: `
    <h2 id="prepare">1. Define success with evidence</h2>
    <p><strong>The problem:</strong> Naruto must hand the project to another teammate, not just say “it works.” Prerequisites: the Docker path through <a href="#single-host-release">single-host releases</a>. Estimated effort: 60 minutes plus image downloads. Choose one ORM; completing both is optional. The automated parity checks run both independently.</p>
    <h2 id="start">2. Fresh-clone onboarding</h2>
    <p>Record OS/shell, local Docker context, architecture, versions, chosen ORM, allocated ports and project name. Follow <a href="examples/compose/README.md">the Compose README</a> from a clean lab state. Confirm .env is ignored, lockfiles are committed, DB remains unpublished and no migration is hidden inside app startup. Explain each flag before executing it.</p>
    <h2 id="feature">3. Complete the developer loop</h2>
    <p>Build the app, migrate explicitly, seed demo members, create/assign/complete a task, reload and replace containers while preserving the volume. In dev mode edit a harmless heading and verify hot reload without rebuilding dependencies; restore your edit deliberately. Production must run the standalone server, not next dev. Browser requests use a host URL; server database connections use db on the Compose network.</p>
    <h2 id="recover">4. Prove recovery, then compatibility</h2>
    <p>Use <a href="#database-backups">logical backup/restore</a> to compare exact rows and ORM history. Apply the nullable-column expansion and prove old writes still work. Run the controlled migration failure only in the uniquely owned disposable project. Record RPO/RTO observations and what the drill did not cover, especially host loss and writes after the snapshot.</p>
    <h2 id="secure">5. Release the same tested artifact</h2>
    <p>Apply the security overlay, prove non-root/read-only constraints and graceful shutdown, inspect resources/log limits and run the delivery runner. Review the optional CI template with a teammate. Local passing image-ID checks are not evidence of an executed GHCR push, signed supply chain or a secure public app. Authentication, TLS, image scanning and independent recovery are explicit public-release gates.</p>
    <h2 id="incident">6. Lead a small incident</h2>
    <p>Practice one controlled DB stop in a disposable lab: health stays 200 while readiness becomes 503; restore service and verify recovery. For an actual OOM inspect OOMKilled and resource history; for disk pressure inspect docker system df and exact volume/log ownership. Do not manufacture host-wide OOM or disk-full events. Record symptoms, hypotheses, one safe change, verification and a blameless prevention item. Use <a href="#command-reference">the command reference</a> for everyday inspection.</p>
    <h2 id="practice">7. Final independent challenge</h2>
    <p><strong>Independent:</strong> ask a teammate to start the chosen track using only your runbook, then diagnose a wrong port, missing runtime variable or failed tools command. Expected: the teammate can identify the correct service, preserve data and recover without reinstalling Docker or bulk pruning. Optional AI: submit only sanitized evidence, ask for read-only checks first, verify official sources and review every diff. Never share tokens, dumps, customer data or unattended production access.</p>
    <h2 id="cleanup">8. Cleanup, sign-off and references</h2>
    <p>List owned resources with Compose ps and docker volume ls. Stop only the chosen project with its original file/project flags; down preserves named volumes. <strong>Deleting a named volume permanently deletes its database.</strong> Inspect and back up before any separately approved removal; never use global prune as routine cleanup. Cached images intentionally remain after automated tests.</p>
    <p>Sign off only what you observed: build, API behavior, persistence, restore, schema compatibility, failure recovery and hardened runtime. See <a href="CONTENT-REVIEW.md">the dated validation record</a> for actual results and limitations. References: <a href="https://docs.docker.com/reference/cli/docker/">Docker CLI</a> and <a href="https://docs.docker.com/compose/">Compose</a>. Docker is a complete standalone learning path; no cluster tooling is required.</p>`
});
