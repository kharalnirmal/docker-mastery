# Recovery and compatible schema expansion

Prerequisites: complete one [Compose track](../compose/README.md), with seeded
PostgreSQL 18 and a working app. Use only disposable local demo data. Windows:
WSL Bash; macOS/Linux: Bash. Allow 45–60 minutes, disk space for an extra database
and archive. One track at a time fits the original 8 GB planning target.

These are **overlays**, not replacements for the original checkpoint. They add a
nullable Task.description column. Prisma keeps its own second migration; Drizzle
keeps SQL, journal and a linked snapshot. Initial histories remain untouched.
The existing UI/API deliberately does not expose descriptions: this tests the
old application against the expanded schema, not a completed description feature.

## 1. Establish evidence before changing anything

Work inside `examples/compose/prisma` OR `examples/compose/drizzle` with the same
`.env` and project name as before. If you used `-p`, repeat it on **every** Compose
command below. Do not run against a remote or production context.

```bash
docker context show
docker compose ps
docker compose exec db psql -U tracker -d tracker -c 'SELECT id, title, done, "assigneeId" FROM "Task" ORDER BY id;'
```

Add a distinct task in the browser, assign Sakura and mark it complete. Record its
ID, title and assignment. `ORDER BY id` makes SQL output deterministic. Persistence
is not backup: the volume and server can fail together.

## 2. Create a logical archive and move it outside the container

`pg_dump` reads one consistent database snapshot while normal writes can continue.
It exports schema, rows and ORM history, not cluster roles, server config or future
writes. Stop changing demo data during this drill so comparisons are meaningful.
Do not tar a running PostgreSQL data directory as a substitute.

Choose an unused host directory and archive path; **do not overwrite a previous
backup**. `mkdir` fails if this directory already exists: choose a new name.

```bash
mkdir "$HOME/tracker-backup-01"
docker compose exec db pg_dump -U tracker -d tracker -Fc -f /tmp/tracker-01.dump
docker compose exec db pg_restore --list /tmp/tracker-01.dump
docker compose cp db:/tmp/tracker-01.dump "$HOME/tracker-backup-01/tracker.dump"
```

- `-U tracker`: database role; `-d tracker`: source database, not a directory.
- `-Fc`: `-F c`, custom compressed archive format, rather than default plain SQL.
- `-f`: file written **inside the database container**, not your host directory.
- `pg_restore --list`: reads the archive table of contents without restoring.
  Expected: Project, Member, Task and your ORM's migration table. A readable list
  alone is not proof that all rows can be restored.
- `docker compose cp`: copies bytes from `service:path` to the host path, avoiding
  shell encoding transformations of binary output (especially in PowerShell).
  `$HOME` is your Bash home directory; this keeps the archive outside the guide's
  web root and application build context. Quoting preserves spaces in the path.

Check each command's exit status and warnings; do not proceed on error. This image
permits the local demo role over its local socket; production access needs reviewed
authentication and least privilege, not a database superuser in application code.

The host archive survives container removal, but a copy on the same machine is not
off-site disaster recovery. Dumps can contain sensitive data: keep them out of Git
and public web roots; use approved encryption, access control, retention and an
independent storage location in a real system. Restore only archives you trust:
database restoration can execute source-defined code. Use the PostgreSQL 18 tools
from the selected image; this is not a server-major-upgrade procedure.

## 3. Restore into an empty, separate database

**State-changing:** these commands create `tracker_restore` in this lab's database
server. The original `tracker` is not overwritten. If that name exists, stop and
choose a different unused name everywhere; do not drop it or add `--clean`.

```bash
docker compose cp "$HOME/tracker-backup-01/tracker.dump" db:/tmp/restore-01.dump
docker compose exec db createdb -U tracker -T template0 tracker_restore
docker compose exec db pg_restore -U tracker -d tracker_restore --single-transaction --no-owner --no-acl /tmp/restore-01.dump
docker compose exec db psql -U tracker -d tracker_restore -c 'SELECT id, title, done, "assigneeId" FROM "Task" ORDER BY id;'
```

`createdb` creates a database; its `-T template0` copies PostgreSQL's empty template.
This is **not** Compose's unrelated `exec -T` (which disables pseudo-terminal
allocation in automation). `pg_restore -d` names the destination. No `--create`
is used: that option would use the archived database name, defeating our isolation.
`--single-transaction` makes the small restore all-or-nothing and implies
`--exit-on-error`; default restore can continue after errors. `--no-owner` makes
restored objects owned by the restoring role, and `--no-acl` skips original grants.
That is appropriate only for this same-role lab: review roles/grants separately
for a real recovery. The trailing path is the archive input.

Expected: your exact recorded task, completion and assignment, plus matching
projects/members. Foreign keys and ORM history must also be present. Counts alone
do not prove content equality. Verify the restored migration history by targeting
the copy explicitly (sample local password only):

```bash
docker compose run --rm -e DATABASE_URL=postgresql://tracker:local_demo_only@db:5432/tracker_restore tools npm run db:migrate
```

`run -e` overrides only this one-off container's environment. Substitute your local
sample password if changed; real credentials should not enter terminal history.
Expected: successful deployment with nothing new to apply, not table recreation.
Do not seed the restored copy to hide missing backup rows. The test runner compares
every business row and exercises this history check independently for both ORMs.
This drill shares a server/volume with the source; it is not a loss-of-host test.

## 4. Review and apply one compatible expansion

Read your chosen overlay first. Both SQL files add nullable text with no default:

```sql
ALTER TABLE "Task" ADD COLUMN "description" TEXT;
```

Existing rows get NULL. Old writes can omit the column; existing reads remain
valid. Adding a column still needs a table lock: schedule and test against realistic
load before production. Nullable expansion does not justify later destructive
renames/drops. A future release would add API validation/UI, optionally backfill
in bounded batches, then separately review any constraint or removal.

From your original chosen track directory, set **one** matching track:

```bash
TRACK=prisma
```

For Drizzle use `TRACK=drizzle` instead. This is a Bash variable, not a CLI flag.
**State-changing:** the following applies the reviewed second migration to this
project's original `tracker`. First verify your backup restored correctly. Do not
run both tracks, concurrent migration commands or a schema reset/push.

```bash
docker compose run --rm --volume "$PWD/../../recovery/$TRACK:/upgrade:ro" tools sh -ec 'cp -R /upgrade/. /app/; npm run db:migrate'
docker compose run --rm --volume "$PWD/../../recovery/$TRACK:/upgrade:ro" tools sh -ec 'cp -R /upgrade/. /app/; npm run db:migrate'
docker compose exec db psql -U tracker -d tracker -c 'SELECT id, title, description, done, "assigneeId" FROM "Task" ORDER BY id;'
```

- `--volume host:container:ro` bind-mounts the chosen overlay read-only at /upgrade.
  `$PWD` is the current Bash path; quotes protect spaces. In Windows use WSL paths,
  not a PowerShell expansion of this Bash command.
- `sh -ec` runs a command string (`-c`) and exits on a failed simple command (`-e`).
  The semicolon separates two in-container commands, not SQL statements.
- `cp -R /upgrade/. /app/` merges the overlay recursively into only this disposable
  tools container. The original initial migration, packages and config remain in
  its image. Your host checkpoint is not modified. `--rm` removes the tools
  container afterward, **not** the database change.
- `db:migrate` uses Prisma migrate deploy or Drizzle Kit migrate. It records the
  second SQL change in the track's own history; the repeat should apply nothing.
  Prisma client generation is unnecessary for applying SQL. A new app using that
  field would require regeneration/rebuild; this drill keeps the old app unchanged.

After applying this overlay, retain it as the canonical next checkpoint. Do not
author a new migration from the old baseline or use its older tooling to deploy
future releases; it lacks the second history entry. In a real release commit the
merged schema, full history and matching built artifacts together.

Expected: all prior data preserved, new column NULL. Refresh the existing app and
create another task; it must succeed without knowing about descriptions. Verify
that row's NULL description via SQL. Image rollback leaves this column in place;
restoring the old dump would lose writes made after its snapshot. Never overwrite
the original database just to simulate an application rollback.

## Failures, exercises and cleanup

| Symptom | Diagnosis → safe fix → prevention |
| --- | --- |
| Unsupported archive version | Compare pg_dump/pg_restore major versions → use matching reviewed tools → record versions with backup |
| Restore says objects exist | Check destination name → create another empty database → never restore over the source |
| Missing roles/grants | Review ownership/ACL expectations → configure reviewed roles separately → back up cluster-level policy separately |
| Migration already applied | Inspect successful history → no fix needed → use migration deploy, not replayed raw SQL |
| Column exists but history missing | Stop and compare SQL/history and partial effects → reviewed ORM-specific reconciliation plan → never mark applied without evidence |
| Overlay not found | Check working directory, TRACK and mount path → correct selected track path → keep one ORM per checkpoint |

Guided: compare original and restored business rows before the upgrade. Independent
challenge: record snapshot time, restore duration and which later writes would be
lost. RPO is acceptable data-loss duration; RTO is acceptable recovery duration.
Your measured local exercise is evidence, not a production recovery guarantee.

Optional AI: provide only public schema/SQL and sanitized errors. Ask whether the
old app remains compatible. Manually review constraints/locks and test; never give
an assistant a real dump or authority to reset/reconcile production history.

Cleanup: `docker compose down` interrupts the selected lab and keeps its volume,
including `tracker_restore`. Keep the host archive until review; inspect its exact
path before any deliberate deletion. No database/volume deletion is required in
the learner sequence. No public ports or paid resources are added.

Recap: why is a volume not a backup? Why restore to another database? Which writes
are outside the snapshot? Why can the old app still write? Why is application
rollback different from database restoration?

## Automated disposable verification

From the guide root, `node tools/check-recovery-labs.cjs prisma` or `drizzle`.
Read the runner first: it requires the confirmed `desktop-linux` context, builds
images, creates a unique project with an ephemeral loopback app port, restores a
second database and applies the overlay only inside a one-off tools container.
It deletes only its own containers/network/volume, including both disposable
databases. Cached images and uniquely named **demo** archives remain in
`tests/results/`; JSON records include archive hash, checks and cleanup status.
The automation invokes Windows Docker CLI; WSL copy/paste is not certified by it.
It does not test ORM failure reconciliation or disaster recovery on another host.
The separate [delivery checkpoint](../delivery/README.md) now tests controlled
ORM failure/reconciliation; independent-host recovery is still a separate exercise.

Official references: [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html),
[pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html),
[Prisma migration workflows](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production),
[Drizzle migration application](https://orm.drizzle.team/docs/drizzle-kit-migrate).
