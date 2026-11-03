# Next.js + PostgreSQL checkpoint

Local-only Team Task Tracker: create/list tasks (20-row pages), assign demo
members, and update completion. No authentication, tenant security or private data.
Never publish it as-is. Choose **prisma/** OR **drizzle/**; both implement the same
schema/API/seeds but own independent packages, lockfiles and migration histories.
Do not point both histories at one database.

## Requirements and versions

- Node 24.11+ on the Node 24 line, npm, modern `docker compose`, Linux engine.
- Next.js 16.4.4 / React 19.3.1; Prisma 7.10.1 (supported stable 7.x, not 8 RC),
  or Drizzle ORM 0.45.4 / Kit 0.31.11; pg 8.16.3.
- Images: `node:24-bookworm-slim` and `postgres:18-bookworm`, mutable teaching tags.
  PostgreSQL 18 mounts `/var/lib/postgresql`, not the older image data target.
- Windows: use WSL Bash and keep source in the WSL Linux filesystem. macOS and
  Linux: Bash. Commands below assume the chosen track is your working directory.
  PowerShell users can use `Copy-Item .env.example .env` instead of `cp`.
- An 8 GB machine should run one track at a time; build downloads can be large.
  No cloud service, account, paid infrastructure or cluster tooling is required.

## Read the files first

Each directory contains a full Next.js application and container checkpoint:

| File | Purpose |
| --- | --- |
| app/page.js | Browser UI; only calls same-origin HTTP API, never SQL |
| app/api/tasks/ | GET/POST tasks and PATCH by ID |
| app/api/healthz/ | Process health, no SQL |
| app/api/readyz/ | Task-table query; 503 on dependency/schema failure |
| lib/api.js | Server-only API boundary, validation, safe generic DB errors |
| lib/store.js | ORM operations and a max-five-connection pool |
| Prisma schema / Drizzle schema | Project, Member, Task definitions and relations |
| prisma/migrations/ or drizzle/ | Reviewed, track-owned migration history |
| scripts/seed.* | Transactional, repeatable seeds without overwriting edits |
| Dockerfile | dependencies → development → build → non-root standalone runner |
| .dockerignore | Excludes host dependencies, generated build output and .env |
| compose.yaml | Private DB, loopback app, durable volume, opt-in tools |
| compose.host.yaml | Host-app-only DB port on loopback 5433 |
| compose.dev.yaml | Development target and selective source bind mounts |

Projects and members have text primary keys and required names. Tasks have a text
key, required title up to 120 characters, boolean done, required project foreign
key and optional assignee foreign key. Deleting a referenced project is restricted;
deleting a member clears assignment. A project index supports related lookups.
Application validation also rejects blank/oversized titles, unknown fields,
unknown demo assignees and non-boolean done. Foreign keys protect SQL relationships
even when an ORM is bypassed. This is not a full business authorization model.

## 1. Run the application on the host first

From the guide root enter `examples/compose/prisma` or `examples/compose/drizzle`.
Do not overwrite an existing `.env`; inspect it first. Sample credentials are
disposable local examples, not production secrets. Keep the sample password
URL-safe; real passwords need proper URL encoding/secret management.

```bash
cp .env.example .env
docker compose -f compose.yaml -f compose.host.yaml up -d db
npm ci
node --env-file=.env --run db:generate
node --env-file=.env --run db:migrate
node --env-file=.env --run db:seed
node --env-file=.env --run dev
```

- `-f` selects/merges Compose files in order; `up -d db` starts the DB detached.
- `npm ci` installs the lockfile; it is not the upgrade command.
- Node `--env-file` loads CLI configuration explicitly, `--run` executes a package
  script. Next also understands local .env, but do not assume every ORM CLI does.
- Prisma `db:generate` generates a client; Drizzle `db:generate` checks definitions
  against snapshots and writes migration SQL only if changed. This checkpoint
  already includes SQL: **no reset, schema push or migration authoring is needed**.
- `db:migrate` applies reviewed history: `prisma migrate deploy` or
  `drizzle-kit migrate`. Neither runs automatically in every app process.
- `db:seed` inserts Leaf launch, Naruto/Sakura and the welcome task in a transaction.
  Repeating the seed leaves existing data/edits intact.
- `dev` runs `next dev --hostname 0.0.0.0`; `--hostname` chooses the listener.
  Host dev may listen beyond loopback: use trusted local networks only.

Open http://localhost:3000, add a task, assign Sakura, then mark it done.
Expected: changes survive Refresh. `/api/tasks?offset=0` returns tasks and members;
offsets are bounded nonnegative integers. GET returns at most 20 tasks in ID order.

The host URL is `127.0.0.1:5433`; the container URL is `db:5432`. `localhost` inside
an app container refers to that app container, not PostgreSQL. Compose service DNS
is not available to the host browser. `DATABASE_URL` stays server-side; never put it
in `NEXT_PUBLIC_*` (those values are exposed/inlined at build time).

Stop host dev with Ctrl+C, then stop the host DB stack before the next workflow:

```bash
docker compose -f compose.yaml -f compose.host.yaml down
```

**Warning:** down interrupts this lab and removes its containers/network; it keeps
the named database volume. Do not add volume deletion options.

## 2. Run the complete stack in Compose

Remain in the same chosen track directory, using the .env prepared above:

```bash
docker context show
docker compose config --quiet
docker compose up -d db
docker compose run --build --rm tools npm run db:migrate
docker compose run --rm tools npm run db:seed
docker compose up --build -d app
docker compose ps
```

- `context show`: verify the local target; do not run against production.
- `config --quiet`: validate without printing resolved credentials.
- `run`: create a one-off tools container; `--build`: build first; `--rm`: remove
  that one-off container at exit, not the database volume. Explicitly selecting
  tools activates its profile; ordinary `up` only starts app and db.
- `up --build -d app`: build and start the production-style app detached.
- `ps`: inspect project service state; expected: app/db become healthy.

The default directory name forms the project namespace. Use `-p unique-name`
consistently on **every** Compose command when running another copy. Each project
gets its own network and pgdata. Choose a distinct APP_PORT in .env too; only
changing project names does not avoid host-port collisions.

### Configuration explained

- `services`: application, database, and opt-in CLI tools.
- `image`: the official PostgreSQL tag. A major-version upgrade needs a separate
  backup/migration plan, not a tag edit against existing files.
- `build.context: .`: the selected track's files; `target`: named Dockerfile stage.
- `environment`: runtime values. Compose interpolates `.env`; it does not inject
  every .env key. Required-password interpolation rejects missing/empty values.
- `ports`: host loopback/app port → container 3000. Base stack publishes no DB.
- `volumes`: pgdata mounted at PostgreSQL 18's `/var/lib/postgresql`; data resides
  below its version-specific PGDATA. Volume lifetime is independent of containers.
- `healthcheck`: database uses `pg_isready -U tracker -d tracker`; -U is the role,
  -d is the database. App uses a Node readiness fetch and exit status (0/1).
  CMD-SHELL uses a shell; CMD runs an executable directly. interval is cadence,
  timeout is the allowed duration, retries the failure threshold, start_period
  an initial failure grace period. Health status alone does not restart a container.
- `depends_on`: wait for healthy DB at startup, not perpetual availability.
- `profiles: [tools]`: only run tools deliberately, never as every replica's startup.
- `init: true`: signal forwarding/zombie reaping; `stop_grace_period: 30s`: drain
  allowance. The exec-form runner CMD starts Node, not an npm shell wrapper.

The database role created by POSTGRES_USER is a **local demo superuser**. Production
needs separate least-privilege app/migration roles and reviewed secret management.
POSTGRES_* initialization settings apply only to empty storage. Editing .env is
not password rotation for an existing database. Do not delete the volume to fix it.

### Image explained

The dependencies stage copies package/lockfiles and runs npm ci before source.
Prisma's tools/build stage installs OpenSSL and CA certificates for its migration
engine. Development copies source (and generates Prisma's client). Build runs
next build with no live DB or credentials. Runner copies standalone traced output
plus static assets and uses `USER node`. There is no public/ directory here; if you
add one, copy it into the runner. Migration CLIs/files stay in the tools image.
No health test should execute migrations. This is a local production-style build,
not a complete internet deployment: see the separate recovery/delivery checkpoints
for backups, hardened runtime and release boundaries. Public TLS/auth need review.

## 3. Verify state, readiness and recovery

Create a uniquely titled task, assign it and mark it complete. Inspect seeds:

```bash
docker compose exec db psql -U tracker -d tracker -c 'SELECT id, title, done FROM "Task";'
```

`exec` runs in the existing container; `psql -c` executes the quoted SQL. Single
quotes preserve SQL double quotes in Bash. Expected: welcome plus your task.

**Warning:** the next commands deliberately interrupt only this disposable lab.

```bash
docker compose down
docker compose up -d
docker compose stop db
```

After down/up, your task must remain. While DB is stopped, `/api/healthz` stays 200,
`/api/readyz` returns 503 and API writes fail visibly. The app is not liveness-
restarted for dependency failure. Recover with `docker compose start db`, wait
for health, then Refresh. Pools cap at five per process; plan DB connection budgets
before adding replicas. Writes are not blindly retried (avoids duplicate creates).

## 4. Hot reload

```bash
docker compose -f compose.yaml -f compose.dev.yaml up --build -d app
```

Change a heading in app/page.js and confirm it updates. Only app/ and lib/ are
bind-mounted: dependencies and .next remain image/container-local, avoiding host
node_modules and build-output collisions. Package/schema changes require rebuild;
do not expect mounted schema edits to generate Prisma's client automatically.
The config explicitly permits loopback 127.0.0.1 as an additional development
origin so mapped-port browser assets/HMR work; no wildcard origins are allowed.
Stop using both -f files, then start base app with --build to return to the runner.
Never deploy next dev. To test a host production build, stop dev first, then
`npm run build` and `node --env-file=.env --run start` (host DB override required).
Do not run build over a live dev server's .next directory.

## Failures and safe fixes

| Symptom | Diagnosis → safe fix → prevention |
| --- | --- |
| Port occupied | Check this project's ps and host apps → choose a free APP_PORT → give concurrent copies unique ports |
| db not resolvable on host | Check request origin → host URL uses loopback 5433, containers use db:5432 → document execution location |
| Authentication failed | Check original volume credentials and .env → use correct credentials or explicit SQL rotation → initialization is not rotation |
| Task table absent | Review tools migration logs → apply chosen history → controlled migrations before startup |
| Prisma client missing | Check generation/build → db:generate and rebuild → distinguish generation from schema migration |
| Drizzle history mismatch | Inspect committed SQL plus metadata → restore matching history → never push over shared schema |
| Unhealthy app | Compare healthz/readyz and logs → recover evidenced DB/schema issue → separate liveness/readiness |
| No hot reload | Check source path/mounts → edit the mounted WSL source → rebuild for dependencies/schema |

Read logs using `docker compose logs app db`; redact credentials before sharing.
Do not use global prune, permission weakening or unknown-container deletion.

## Cleanup and next gate

`docker compose down` keeps your lab data. For the dev stack supply the same two
`-f` files. Deliberate permanent volume deletion needs inspecting the exact owned
volume and confirmation; no broad deletion command is provided here.

This baseline checkpoint covers fresh migrations, idempotent seed, requests,
containers, persistence and readiness recovery. Continue to the separate
[recovery checkpoint](../recovery/README.md) for tested logical database
backup/restore and an existing-data **schema upgrade** (not merely migration rerun).
Continue to the [delivery checkpoint](../delivery/README.md) for controlled
migration failure reconciliation, hardening, CI and single-host release/rollback.
Public production deployment requires separate environment/security approval.
Image rollback does not reverse SQL migrations. Keep this boundary explicit.

See ../../../CONTENT-REVIEW.md for observed validation and remaining limits.
