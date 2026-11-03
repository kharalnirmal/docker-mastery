/* Recovery follows working Compose. */
(() => {
  window.LESSONS.push({
    id: 'database-backups', title: 'Back up PostgreSQL and prove restoration', group: 'Recovery & migrations', level: 'Intermediate', minutes: 35,
    description: 'Create a logical archive, restore into a separate empty database and verify data and ORM history.',
    keywords: 'PostgreSQL pg_dump pg_restore backup restore custom archive RPO RTO recovery migration history',
    html: `
      <h2 id="prepare">1. Persistence is not a backup</h2>
      <p><strong>The problem:</strong> Sakura needs to prove the team can recover tasks, not merely restart a container. Prerequisites: <a href="#compose-stack">the running Compose stack</a> and one selected ORM. Allow 35 minutes and disk space for an archive and a second database. Windows: WSL Bash; macOS/Linux: Bash. Stay in your chosen examples/compose track and repeat any custom project name on every command.</p>
      <p>A volume survives container replacement; it does not survive every disk failure, accidental write or host loss. A <strong>logical backup</strong> exports database definitions and rows. A <strong>restore drill</strong> proves they can be reconstructed. Follow the <a href="examples/recovery/README.md">complete recovery checkpoint</a>, which explains every option and the same workflow for both ORMs.</p>
      <h2 id="boundary">2. Name the source and destination</h2>
      <figure><a href="assets/images/recovery.svg"><img src="assets/images/recovery.svg" alt="PostgreSQL tracker exports a consistent logical snapshot to an archive copied to the host. The host archive restores into separate empty tracker_restore. The source remains unchanged; both databases still share this lab server." loading="lazy"></a><figcaption>A separate destination prevents accidental overwrite, but sharing a server is not independent disaster recovery.</figcaption></figure>
      <p>Source: tracker. Destination: unused tracker_restore. The archive includes Project, Member, Task and your ORM history, but not cluster roles, server configuration or writes after the snapshot. Only use trusted archives: restoration can execute source-defined database code. Protect real backups with encryption, access controls, retention and independent storage; never put them in Git or a public site.</p>
      <h2 id="evidence">3. Record what must survive</h2>
      <p>Confirm <code>docker context show</code> targets your local lab. Add a uniquely named task, assign Sakura, mark it complete and record its ID. Stop editing during the drill so the snapshot comparison has a known baseline. Read the full checkpoint before running anything.</p>
      <h2 id="dump">4. Export without shell encoding surprises</h2>
      <p>Choose a new directory name if this one exists. Do not overwrite older backups.</p>
      <pre><code>mkdir "$HOME/tracker-backup-01"
docker compose exec db pg_dump -U tracker -d tracker -Fc -f /tmp/tracker-01.dump
docker compose exec db pg_restore --list /tmp/tracker-01.dump
docker compose cp db:/tmp/tracker-01.dump "$HOME/tracker-backup-01/tracker.dump"</code></pre>
      <p>pg_dump reads a consistent snapshot. <code>-U</code> selects the role; <code>-d</code> selects the source database; <code>-Fc</code> chooses custom compressed format; <code>-f</code> writes a file inside the container. pg_restore <code>--list</code> reads its contents index, not its rows. Compose <code>cp</code> copies bytes to the host, avoiding binary corruption from text-shell redirection. <code>$HOME</code> is your Bash home directory, outside this guide's web root; quotes preserve spaces. Check exit statuses and warnings. A readable archive listing is not yet proof of recovery.</p>
      <h2 id="restore">5. Restore to a new empty database</h2>
      <div class="callout warning">State-changing: creates a second database in this lab. If tracker_restore exists, stop and choose another unused name. Never add --clean or restore over tracker.</div>
      <pre><code>docker compose cp "$HOME/tracker-backup-01/tracker.dump" db:/tmp/restore-01.dump
docker compose exec db createdb -U tracker -T template0 tracker_restore
docker compose exec db pg_restore -U tracker -d tracker_restore --single-transaction --no-owner --no-acl /tmp/restore-01.dump</code></pre>
      <p>createdb <code>-T template0</code> selects an empty database template, not Docker's unrelated no-TTY flag. pg_restore <code>-d</code> is the destination. <code>--single-transaction</code> makes this small restore all-or-nothing and stops on error. <code>--no-owner</code> uses the restoring role as owner; <code>--no-acl</code> skips source grants. This same-role demo does not establish production permissions. Do not use --create: it would select the database name stored in the archive.</p>
      <h2 id="verify">6. Verify rows and migration history</h2>
      <pre><code>docker compose exec db psql -U tracker -d tracker_restore -c 'SELECT id, title, done, "assigneeId" FROM "Task" ORDER BY id;'</code></pre>
      <p>Expected: your exact recorded IDs, titles, completion and assignment, plus matching project/member rows. <code>ORDER BY</code> stabilizes ordering; matching counts alone are insufficient. Follow the README's explicit DATABASE_URL override to run your chosen ORM's migration deploy against the restored copy. Expected: no initial migration replay, because the dump restored its history too. Do not seed to conceal missing data.</p>
      <h2 id="practice">7. Diagnose and practice</h2>
      <p>Unsupported archive → compare tool major versions → use the matching PostgreSQL 18 tools. Objects already exist → check destination → create a different empty database, not drop the source. Missing grants → inspect role/ACL policy separately. Guided: compare original and restored rows. <strong>Independent challenge:</strong> time the restore and explain which later writes would be lost. RPO is acceptable data-loss duration; RTO is acceptable recovery duration. Local timing is not a production guarantee.</p>
      <details><summary>Optional AI recovery review</summary><p>Share only these public commands, not a real dump or credentials. Ask which resources are changed and which failure types remain untested. Verify the answer manually; do not delegate database deletion.</p></details>
      <h2 id="cleanup">8. Cleanup, recap and references</h2>
      <p><code>docker compose down</code> interrupts the lab but retains both databases in its volume. Keep the host archive until review; inspect its exact path before deliberate deletion. This drill uses the same server, not independent-host disaster recovery. Why is a volume not backup? Why must migration history survive?</p>
      <p>Primary references: <a href="https://www.postgresql.org/docs/18/app-pgdump.html">pg_dump</a> and <a href="https://www.postgresql.org/docs/18/app-pgrestore.html">pg_restore</a>. Next: <a href="#schema-upgrades">upgrade a populated schema compatibly</a>.</p>`
  }, {
    id: 'schema-upgrades', title: 'Upgrade a populated schema safely', group: 'Recovery & migrations', level: 'Intermediate', minutes: 30,
    description: 'Apply a nullable-column migration with either ORM and prove the old app still works with existing data.',
    keywords: 'Prisma Drizzle migration upgrade expand contract description nullable schema rollback compatibility',
    html: `
      <h2 id="prepare">1. Change the schema, not the past</h2>
      <p><strong>The problem:</strong> Naruto wants task descriptions without losing completed assignments or breaking the previous app. Prerequisites: <a href="#database-backups">a verified backup and restored copy</a>, a populated Compose database and one ORM track. Allow 30 minutes. Use only local demo data. The <a href="examples/recovery/README.md">complete checkpoint</a> contains the exact commands, explanations and recovery boundaries.</p>
      <h2 id="expand">2. Expand before requiring new behavior</h2>
      <pre><code>ALTER TABLE "Task" ADD COLUMN "description" TEXT;</code></pre>
      <p>Illustrative reviewed migration SQL, not a command to replay manually. Nullable means existing rows can hold NULL; old writes can omit the field. No default, backfill, rename or drop is introduced. ALTER TABLE still requires a lock: compatibility does not mean zero operational risk.</p>
      <h2 id="tracks">3. Read the matching track overlay</h2>
      <p>Prisma: <a href="examples/recovery/prisma/prisma/schema.prisma">updated schema</a> and <a href="examples/recovery/prisma/prisma/migrations/202611030002_description/migration.sql">second migration</a>. Drizzle: <a href="examples/recovery/drizzle/lib/schema.js">updated schema</a>, <a href="examples/recovery/drizzle/drizzle/0001_description.sql">second migration</a> and <a href="examples/recovery/drizzle/drizzle/meta/_journal.json">journal</a> plus linked snapshot. These merge over the selected baseline, preserving its initial migration. Never apply both ORM histories to one database or edit an already applied initial migration.</p>
      <h2 id="apply">4. Apply in one controlled step</h2>
      <p>From your original chosen Compose track directory, choose exactly one matching Bash value: <code>TRACK=prisma</code> or <code>TRACK=drizzle</code>. Do not run this until your restore has been verified. It changes the original lab database, not merely the restored copy.</p>
      <pre><code>docker compose run --rm --volume "$PWD/../../recovery/$TRACK:/upgrade:ro" tools sh -ec 'cp -R /upgrade/. /app/; npm run db:migrate'</code></pre>
      <p><code>--volume</code> bind-mounts the host overlay at /upgrade; <code>:ro</code> makes that mount read-only. <code>$PWD</code> and <code>$TRACK</code> are Bash variables; quoting preserves spaces. <code>sh -ec</code> executes a string and exits on failed commands. <code>cp -R</code> recursively merges into this one-off tools container, not your host files. The semicolon separates commands. <code>--rm</code> removes that container afterward; SQL remains applied. Use WSL Bash on Windows.</p>
      <p>The package script runs Prisma migrate deploy or Drizzle Kit migrate explicitly. Prisma generation is not migration application: this SQL-only change does not need a regenerated old client. A new app using descriptions would need the updated schema and a rebuild. Keep the full merged history for future releases rather than authoring from the old baseline.</p>
      <h2 id="verify">5. Verify old data and old code</h2>
      <pre><code>docker compose exec db psql -U tracker -d tracker -c 'SELECT id, title, description, done, "assigneeId" FROM "Task" ORDER BY id;'</code></pre>
      <p>Expected: every recorded row and relationship remains; descriptions are NULL. Repeat the migration command: no new change should apply. Refresh the unchanged app, create a task and verify it in SQL. This proves backward compatibility for this specific expansion. The UI/API deliberately does not implement descriptions yet. Do not claim a completed feature or arbitrary migration safety.</p>
      <h2 id="rollback">6. Separate rollback from data recovery</h2>
      <p>Rolling back the app image does not remove this column. Restoring yesterday's database would lose today's writes. Future expand-and-contract work means add compatible structures, ship compatible readers/writers, backfill deliberately, and only later review removals. Do not add a NOT NULL field to populated tables without a data/rollout plan.</p>
      <p>Column exists but deploy failed → stop, inspect history and partial effects → plan ORM-specific reconciliation with reviewed evidence. Never mark a migration applied just to silence an error. This checkpoint tests successful expansion, not failed-migration reconciliation or automatic down migrations.</p>
      <h2 id="practice">7. Exercise and review</h2>
      <p>Guided: explain why the old app can still insert a task. <strong>Independent challenge:</strong> propose a staged validation/backfill rollout before making descriptions required, including lock risks and rollback boundaries. Do not execute it on the checkpoint.</p>
      <details><summary>Optional AI compatibility review</summary><p>Provide the public before/after schema and SQL. Request assumptions about old writes and table locks. Check against actual source and this disposable test; AI approval is not deployment permission.</p></details>
      <h2 id="cleanup">8. Cleanup, recap and references</h2>
       <p><code>docker compose down</code> stops the chosen lab and retains the upgraded database. Keep the verified archive. Can you distinguish migration application, client generation, application rollback and database restoration? Next: <a href="#migration-failures">diagnose a failed migration</a>, then secure builds and delivery.</p>
      <p>Primary references: <a href="https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production">Prisma migration workflows</a>, <a href="https://orm.drizzle.team/docs/drizzle-kit-migrate">Drizzle migration application</a>, <a href="https://www.postgresql.org/docs/18/ddl-alter.html">PostgreSQL table changes</a>.</p>`
  });
})();
