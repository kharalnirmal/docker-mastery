/* Next checkpoint: shared concepts, then one equally supported ORM track. */
(() => {
  const trackLesson = track => {
    const prisma = track === 'prisma';
    const name = prisma ? 'Prisma' : 'Drizzle';
    const schema = prisma ? 'prisma/schema.prisma' : 'lib/schema.js';
    return {
      id: `${track}-track`, title: `Task tracker with ${name}`, group: 'Next.js & Compose', level: 'Intermediate', minutes: 35,
      description: `Define the task-tracker schema, inspect migrations and seed PostgreSQL using ${name}.`,
      keywords: `${name} ORM migration generate deploy seed PostgreSQL schema relations foreign key driver pool`,
      html: `
        <h2 id="prepare">1. Choose one track</h2>
        <p><strong>The problem:</strong> Naruto wants repeatable database setup, not a database edited by hand. Prerequisites: <a href="#nextjs-postgres">Next.js and PostgreSQL basics</a> and a working Docker engine. Allow 35 minutes. Choose ${name} here, or follow the equivalent <a href="#${prisma ? 'drizzle' : 'prisma'}-track">${prisma ? 'Drizzle' : 'Prisma'} track</a>. Do not run both histories against one database.</p>
        <p>Start in <code>examples/compose/${track}</code>. The <a href="examples/compose/README.md">checkpoint README</a> contains complete host and container workflows; all source and lockfiles are included. Demo data only; no login or private-data security is provided.</p>
        <h2 id="schema">2. Read the schema before using the ORM</h2>
        <p>Open <a href="examples/compose/${track}/${schema}">${schema}</a>. Project has an ID and name; Member has an ID and name; Task has an ID, title (up to 120 characters), done flag, required project ID and nullable assignee ID. Foreign keys reject nonexistent relationships. The project index supports project lookups; it does not make every query fast. Both tracks use identical table names and seed values.</p>
        <p>${prisma ? 'Prisma uses a declarative schema and generates a typed client into generated/prisma. The selected supported 7.x release uses prisma-client, an explicit output path and @prisma/adapter-pg. prisma.config.ts configures the CLI connection; runtime uses DATABASE_URL separately.' : 'Drizzle uses JavaScript table definitions and SQL-like query builders. drizzle-orm performs queries, pg manages connections, and drizzle-kit authors/applies migration files. No generated runtime client is needed. drizzle.config.js supplies the schema path, dialect and CLI connection.'}</p>
        <h2 id="migration">3. Distinguish generation from application</h2>
        <p>${prisma ? '<code>npm run db:generate</code> generates the client, without applying SQL or needing a live database. To author a future migration on your own disposable development database, use <code>npx prisma migrate dev --name describe_change</code>: --name labels a migration; migrate dev may need a separate shadow database and must not target shared or production data.' : '<code>npm run db:generate</code> invokes drizzle-kit generate: it compares schema definitions to committed snapshots and writes SQL plus metadata. It does not apply the change. Inspect every generated statement before committing; do not edit applied migration history.'}</p>
        <p>For this supplied checkpoint, <strong>do not generate or reset anything</strong>. Review the checked-in initial SQL under ${prisma ? 'prisma/migrations' : 'drizzle'}, then apply that history using the explicit command below. <code>db:migrate</code> runs ${prisma ? 'prisma migrate deploy' : 'drizzle-kit migrate'}, not schema push.</p>
        <h2 id="run">4. Apply and seed explicitly</h2>
        <pre><code>cp .env.example .env
docker compose up -d db
docker compose run --build --rm tools npm run db:migrate
docker compose run --rm tools npm run db:seed</code></pre>
        <p>Bash commands, run inside your chosen directory. <code>cp</code> copies the local sample config; do not overwrite an existing .env. Compose <code>up -d db</code> creates/starts only the database in the background. <code>run</code> creates a one-off tools container, <code>--build</code> builds its image first, <code>--rm</code> removes that one-off container after exit, and the trailing npm command replaces its default command. It does not delete the database volume. The tools service waits for the database health check.</p>
        <p>The seed runs in a transaction (all inserts succeed or none commit), inserts Leaf launch, Naruto, Sakura and one welcome task, and preserves edits on repeat execution. Client generation, migration, seed and app startup are separate operations, not hidden inside every app replica.</p>
        <h2 id="verify">5. Verify actual data</h2>
        <pre><code>docker compose exec db psql -U tracker -d tracker -c 'SELECT id, title, done FROM "Task";'</code></pre>
        <p><code>exec</code> runs in the existing database container. PostgreSQL's <code>psql</code> is the SQL client; <code>-U</code> selects the database role, <code>-d</code> the database, and <code>-c</code> executes the quoted SQL. Single quotes protect the SQL's double-quoted case-sensitive table name in Bash. Expected: welcome task, initially not done. Run the seed twice and confirm only one welcome row exists.</p>
        <h2 id="failure">6. Diagnose without deleting</h2>
        <p>Authentication failed → inspect host versus container URL and original volume credentials → restore the correct local config, not delete data. Missing table → inspect migration output/history → apply the reviewed migration. ${prisma ? 'Missing generated client → run db:generate and rebuild; generation is not a migration.' : 'Missing migration metadata → restore the matching committed SQL and snapshots; do not replace history with push.'} A failed schema change needs evidence and a recovery plan; application rollback does not undo database changes.</p>
        <h2 id="exercise">7. Practice and review</h2>
        <p>Guided: query all seeded members and explain each foreign key. <strong>Independent challenge:</strong> sketch a nullable task description change and inspect its generated SQL in a separate disposable copy; do not apply it to the course checkpoint. Explain which old app queries remain compatible.</p>
        <details><summary>Optional AI migration review</summary><p>Provide only this public schema and proposed SQL. Ask which statements could lose data or lock tables. Verify manually using the official references and a disposable database; AI approval is not permission to migrate.</p></details>
        <h2 id="cleanup">8. Cleanup, recap and references</h2>
        <p><code>docker compose down</code> interrupts the chosen lab, removes its containers/network, and keeps pgdata. Do not add volume deletion flags. Can you distinguish client generation, migration authoring, migration application and seeding?</p>
        <p>Primary references: ${prisma ? '<a href="https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators">Prisma 7 generators</a> and <a href="https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production">migration workflows</a>' : '<a href="https://orm.drizzle.team/docs/get-started-postgresql">Drizzle PostgreSQL</a> and <a href="https://orm.drizzle.team/docs/drizzle-kit-migrate">migration application</a>'}. Next: <a href="#compose-stack">connect the full Compose stack</a>.</p>`
    };
  };
  window.LESSONS.push({
    id: 'nextjs-postgres', title: 'Meet the Next.js + PostgreSQL app', group: 'Next.js & Compose', level: 'Intermediate', minutes: 30,
    description: 'Follow a request from the browser to Next.js and PostgreSQL, and choose Prisma or Drizzle.',
    keywords: 'Next.js PostgreSQL SQL ORM Prisma Drizzle host localhost DATABASE_URL healthz readyz tables keys transactions',
    html: `
      <h2 id="prepare">1. A real application, still a small lab</h2>
      <p><strong>The problem:</strong> a static page cannot remember the team's tasks. Naruto needs a server and a database. Prerequisites: <a href="#first-dockerfile">first Dockerfile</a>, <a href="#container-networks">networks</a>, and <a href="#persistent-data">volumes</a>. Allow 30 minutes, internet for package/image downloads, Node 24.11+ (Node 24 recommended), npm and a local Linux engine. Windows: WSL Bash with your copy in the Linux filesystem. macOS/Linux: Bash. Build one track at a time on an 8 GB machine; close unused workloads.</p>
      <div class="callout warning">Local learning app only: seeded demo members, no authentication or authorization, no tenant isolation. Never enter private data or publish it. Loopback bindings reduce accidental exposure; they do not turn this app into a secure product.</div>
      <h2 id="request">2. Trace a task request</h2>
      <figure><a href="assets/images/compose.svg"><img src="assets/images/compose.svg" alt="Host browser calls loopback port 3000 on Next.js. Only the Next.js server reaches PostgreSQL at db port 5432 inside the Compose network. PostgreSQL persists to pgdata." loading="lazy"></a><figcaption>Browser HTTP and database SQL are separate connections. Open the diagram full size.</figcaption></figure>
      <p>The browser renders a small React interface and requests <code>/api/tasks</code> on the same origin. Next.js route handlers run in Node, validate writes, and use a server-only ORM module. PostgreSQL stores tasks. Only the server reads <code>DATABASE_URL</code>. The browser cannot resolve Compose service name <code>db</code>, and must never receive database credentials.</p>
      <h2 id="vocabulary">3. Learn the database vocabulary</h2>
      <p>A <strong>table</strong> stores rows; a <strong>primary key</strong> uniquely identifies a row. A <strong>foreign key</strong> protects a relationship. <strong>Constraints</strong> reject invalid data. An <strong>index</strong> speeds selected lookups at a storage/write cost. A <strong>transaction</strong> commits a group of changes together or rolls them back. A <strong>migration</strong> is a reviewed, ordered schema change stored in version control. An ORM maps application operations to SQL; it does not replace database design, backups or permissions.</p>
      <h2 id="choice">4. Choose Prisma or Drizzle, equally</h2>
      <div class="table-wrap"><table><thead><tr><th>Track</th><th>Workflow</th></tr></thead><tbody><tr><td><a href="#prisma-track">Prisma</a></td><td>Declarative schema, generated client, Prisma Migrate and pg adapter.</td></tr><tr><td><a href="#drizzle-track">Drizzle</a></td><td>JavaScript schema, SQL-like queries, Drizzle Kit and pg driver.</td></tr></tbody></table></div>
      <p>Choose the API/schema style your team prefers. Both implement the same task operations, constraints and seeds; neither is the default or universally faster/easier. Use one directory, lockfile, volume and migration history. Switching an existing database is a separate migration project.</p>
      <h2 id="host">5. Run on the host first</h2>
      <p>From the guide root, enter <code>examples/compose/prisma</code> or <code>examples/compose/drizzle</code>. Open the <a href="examples/compose/README.md">complete runnable walkthrough</a>. First read your chosen track's migration lesson, then use this host-development sequence:</p>
      <pre><code>cp .env.example .env
docker compose -f compose.yaml -f compose.host.yaml up -d db
npm ci
node --env-file=.env --run db:generate
node --env-file=.env --run db:migrate
node --env-file=.env --run db:seed
node --env-file=.env --run dev</code></pre>
      <p>Do not overwrite an existing .env. <code>npm ci</code> installs exactly the committed lockfile. Repeated <code>-f</code> flags merge Compose files in order; the host-only override publishes PostgreSQL on loopback 5433. Node's <code>--env-file=.env</code> explicitly loads variables for CLI scripts; <code>--run</code> executes a package script. Prisma generate builds its client; Drizzle generate checks schema snapshots (no changes expected). Next dev serves development assets with hot reload, not a production server.</p>
      <h2 id="verify">6. Verify and locate the state</h2>
      <p>Open <code>http://localhost:3000</code>. Expected: the welcome task and two demo assignees. Add a task, assign Sakura and mark it done. <code>/api/healthz</code> reports process health without SQL; <code>/api/readyz</code> queries the Task table and returns 503 if the database/schema is unavailable. Pools allow at most five connections per app process; additional replicas need a connection budget.</p>
      <p>Application source and .env are on the host; node_modules and .next are local build artifacts; PostgreSQL data is in the Compose named volume. NEXT_PUBLIC_* variables are browser-visible and inlined during build: never put credentials there. This app does not need any public environment variables.</p>
      <h2 id="practice">7. Diagnose and practice</h2>
      <p>Port occupied → inspect your own running apps → choose a free host port rather than killing an unknown process. Host cannot resolve db → use the sample host URL (127.0.0.1:5433); containers use db:5432. Missing table → apply the chosen migration, not reset. Guided: compare the two health endpoints. <strong>Independent challenge:</strong> draw each request and label the hostname as seen by its caller.</p>
      <details><summary>Optional AI request tracing</summary><p>Ask for a trace of this public app's request flow. Manually verify the route and store source. Reject any proposal to connect PostgreSQL from a client component.</p></details>
      <h2 id="cleanup">8. Cleanup and references</h2>
      <p>Ctrl+C stops the host development process. <code>docker compose -f compose.yaml -f compose.host.yaml down</code> stops/removes this lab's containers/network but preserves database data. Recap: why are localhost and db different? Which endpoint checks SQL? Which files are excluded from an image?</p>
      <p>Primary references: <a href="https://nextjs.org/docs/app/guides/self-hosting">Next.js self-hosting</a>, <a href="https://www.postgresql.org/docs/current/tutorial.html">PostgreSQL tutorial</a>. Continue with <a href="#prisma-track">Prisma</a> or <a href="#drizzle-track">Drizzle</a>, then <a href="#compose-stack">Compose</a>.</p>`
  }, trackLesson('prisma'), trackLesson('drizzle'), {
    id: 'compose-stack', title: 'Run the task tracker with Compose', group: 'Next.js & Compose', level: 'Intermediate', minutes: 45,
    description: 'Build Next.js, migrate PostgreSQL explicitly, test persistence and diagnose readiness failures.',
    keywords: 'Compose services depends_on healthcheck readiness volumes pgdata postgres multi-stage standalone hot reload build run migration',
    html: `
      <h2 id="prepare">1. One app, one database</h2>
      <p><strong>The problem:</strong> Sakura needs a reproducible stack that survives container replacement. Prerequisites: <a href="#nextjs-postgres">the host app</a> and either <a href="#prisma-track">Prisma</a> or <a href="#drizzle-track">Drizzle</a>. Allow 45 minutes. Stop host Next dev and the host-database stack first to release ports. Work in only your chosen examples/compose track. Confirm <code>docker context show</code> points to your local lab engine.</p>
      <h2 id="files">2. Read complete files, not fragments</h2>
      <p>Choose one set: <a href="examples/compose/prisma/compose.yaml">Prisma compose.yaml</a> / <a href="examples/compose/prisma/Dockerfile">Dockerfile</a>, or <a href="examples/compose/drizzle/compose.yaml">Drizzle compose.yaml</a> / <a href="examples/compose/drizzle/Dockerfile">Dockerfile</a>. The <a href="examples/compose/README.md">README</a> explains each field and command. No obsolete top-level version field is needed.</p>
      <p><strong>services</strong> defines db, app and an opt-in tools service. <strong>image</strong> selects PostgreSQL 18's mutable bookworm tag. <strong>build.context</strong> scopes files to this track; <strong>target</strong> selects a named build stage. <strong>environment</strong> passes runtime variables. Compose reads .env for interpolation, not automatic injection of every value. Required password syntax fails when missing; APP_PORT defaults to 3000.</p>
      <p><strong>ports</strong> publishes only the app on host loopback. PostgreSQL is not published in the base stack. <strong>volumes</strong> declares pgdata and mounts it at <code>/var/lib/postgresql</code>: PostgreSQL 18 uses a major-specific data subdirectory. Do not reuse older 17-and-below mount examples or point a new major at old data. Initialization credentials only take effect on an empty data directory; editing .env does not rotate an existing database password.</p>
      <h2 id="image">3. Follow the image stages</h2>
      <p>Dependencies copies package metadata before source so npm ci can use build cache. Development adds source and Prisma generation where applicable. Build runs next build without a live database. Runner copies standalone traced server dependencies and .next/static, sets runtime configuration, and uses the existing non-root node user. No public directory exists in this checkpoint; if you add one, copy it into the runner too. .dockerignore excludes .env, host dependencies and build clutter.</p>
      <p>Exec-form CMD starts node directly; <strong>init: true</strong> supplies signal forwarding/reaping, and <strong>stop_grace_period: 30s</strong> permits shutdown draining. Tooling and migration files stay in the separate development/tools image, not the application runtime. A smaller image is not proof that it is hardened.</p>
      <h2 id="start">4. Build, migrate, seed, start</h2>
      <pre><code>docker compose up -d db
docker compose run --build --rm tools npm run db:migrate
docker compose run --rm tools npm run db:seed
docker compose up --build -d app
docker compose ps</code></pre>
      <p>Use the .env copied in the previous lesson. <code>up --build</code> builds before starting; <code>-d</code> detaches; <code>ps</code> lists this project's service state. tools is under <strong>profiles</strong>, so normal up does not start it; naming it explicitly in run activates it. Never run migrations automatically in every app replica.</p>
      <p><strong>depends_on.condition: service_healthy</strong> waits for initial database readiness, not permanent availability. The database health command uses pg_isready: -U role, -d database. Its CMD-SHELL form runs via a shell; app's CMD form executes Node directly. interval is the check cadence, timeout its deadline, retries the failure threshold and start_period an initial grace window. The app readiness fetch exits 0 on HTTP success and 1 otherwise. Docker marks health; it does not automatically restart an unhealthy app.</p>
      <h2 id="verify">5. Prove persistence and failure recovery</h2>
      <p>Expected: app and db healthy in ps; browser at localhost:3000 shows the welcome task. Add a uniquely named task, assign Sakura and mark it done. Then run:</p>
      <pre><code>docker compose down
docker compose up -d
docker compose stop db</code></pre>
      <p>Warning: down interrupts this lab and removes its containers/network; it keeps pgdata. After up, confirm your task remains. stop db deliberately interrupts SQL. While it is stopped, /api/healthz stays 200 and /api/readyz returns 503; writes show an error instead of silently succeeding. Run <code>docker compose start db</code>, wait for healthy, then Refresh. Requests retry when you refresh; no duplicate-prone automatic write retries are used.</p>
      <h2 id="development">6. Hot reload is a separate mode</h2>
      <pre><code>docker compose -f compose.yaml -f compose.dev.yaml up --build -d app</code></pre>
      <p>The override selects development and bind-mounts only app and lib. Dependencies remain inside the image; .next remains container-local, so host node_modules and production build output do not overwrite them. Change a heading and verify hot reload; rebuild after package or schema changes. Windows: keep source in WSL's Linux filesystem. Never deploy next dev. To return to the base stack, stop with the same two -f files, then start the base app with --build.</p>
      <h2 id="practice">7. Troubleshooting and practice</h2>
      <pre><code>docker compose logs app db
docker compose config --quiet</code></pre>
      <p><code>logs</code> reads both service outputs (redact before sharing). <code>config --quiet</code> validates merged configuration without printing resolved credentials. Missing password → copy the sample locally; bad authentication → compare original volume credentials; app unhealthy with process healthy → inspect migration and DB connectivity; no hot reload → verify mounted source path. Never fix these with blanket prune, privileged mode or volume deletion.</p>
      <p>Guided: repeat the stop/start readiness exercise. <strong>Independent challenge:</strong> use a second copy with a distinct project name (<code>docker compose -p leaf-other ...</code>) and APP_PORT to explain how networks/volumes and host ports differ. <code>-p</code> selects the project namespace; use it consistently on every command. Data under the original project is not lost when a new project gets an empty volume.</p>
      <details><summary>Optional AI Compose review</summary><p>Ask an approved assistant to identify exposed ports, durable state and startup-only assumptions using these public files. Verify its answer against the config and the database outage exercise yourself.</p></details>
      <h2 id="cleanup">8. Cleanup, recap and references</h2>
      <p><code>docker compose down</code> stops/removes the lab but retains the database volume. Deliberate permanent data deletion requires inspecting the exact project-owned volume first; no bulk cleanup shortcut is part of this lesson. Persistence is not a backup: database dump and tested restoration belong to a separate recovery checkpoint.</p>
      <p>Can you explain why EXPOSE is not publication, why health checks do not guarantee uptime, why pgdata survives down, and why image rollback cannot undo SQL migrations? Primary references: <a href="https://docs.docker.com/compose/how-tos/startup-order/">Compose startup order</a>, <a href="https://docs.docker.com/reference/compose-file/services/">service fields</a>, <a href="https://hub.docker.com/_/postgres">PostgreSQL image</a>, <a href="https://nextjs.org/docs/app/guides/self-hosting">Next.js self-hosting</a>. Next: <a href="#database-backups">back up PostgreSQL and prove restoration</a>, then schema upgrades and secure Docker delivery.</p>`
  });
})();
