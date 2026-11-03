// State-changing local-only test. All projects, containers and volumes are owned.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const track = process.argv[2];
assert.ok(['prisma', 'drizzle'].includes(track), 'Choose prisma or drizzle');
const root = path.resolve(__dirname, '..');
const cwd = path.join(root, 'examples/compose', track);
const project = `guide-recovery-${track}-${Date.now()}`;
const env = { ...process.env, POSTGRES_PASSWORD: 'local_demo_only', APP_PORT: '0' };
const docker = (...args) => execFileSync('docker', args, { cwd, env, encoding: 'utf8', timeout: 600000, maxBuffer: 8 * 1024 * 1024 });
assert.equal(docker('context', 'show').trim(), 'desktop-linux', 'Only the confirmed local desktop-linux context is allowed');
// Explicit context prevents DOCKER_HOST/DOCKER_CONTEXT from silently changing targets.
const cli = (...args) => docker('--context', 'desktop-linux', ...args);
const compose = (...args) => cli('compose', '-p', project, '--env-file', '.env.example', ...args);
const result = { track, project, context: 'desktop-linux', checkedAt: new Date().toISOString(), checks: [] };
const record = name => { result.checks.push(name); console.log(`PASS ${track}: ${name}`); };
const sql = (db, query) => compose('exec', '-T', 'db', 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'tracker', '-d', db, '-At', '-c', query).trim();
const snapshot = db => sql(db, `SELECT json_build_object('projects', (SELECT json_agg(t ORDER BY id) FROM "Project" t), 'members', (SELECT json_agg(t ORDER BY id) FROM "Member" t), 'tasks', (SELECT json_agg(t ORDER BY id) FROM "Task" t));`);
const tools = command => compose('run', '--rm', 'tools', 'sh', '-ec', command);
async function ready(base) {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(base + '/api/readyz')).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('App readiness timed out');
}
(async () => {
  let workspace;
  try {
    compose('build', 'tools', 'app');
    compose('up', '-d', 'db');
    tools('npm run db:migrate && npm run db:seed');
    sql('tracker', `INSERT INTO "Task" (id,title,done,"projectId","assigneeId") VALUES ('recovery-proof','Keep this completed assignment',true,'leaf','sakura');`);
    const before = snapshot('tracker');
    record('fresh history plus existing completed/assigned task');
    compose('exec', '-T', 'db', 'pg_dump', '-U', 'tracker', '-d', 'tracker', '-Fc', '-f', '/tmp/tracker.dump');
    const toc = compose('exec', '-T', 'db', 'pg_restore', '--list', '/tmp/tracker.dump');
    assert.ok(toc.includes(track === 'prisma' ? '_prisma_migrations' : '__drizzle_migrations'));
    const db = compose('ps', '-q', 'db').trim();
    // Binary never passes through a text shell; copy off-container then back.
    const artifact = path.join(root, `tests/results/${project}.dump`);
    result.archive = path.basename(artifact);
    assert.ok(!fs.existsSync(artifact), `Move the previous ${artifact} before repeating`);
    compose('cp', 'db:/tmp/tracker.dump', artifact);
    result.archiveBytes = fs.statSync(artifact).size;
    const { createHash } = require('node:crypto');
    result.archiveSha256 = createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
    cli('cp', artifact, `${db}:/tmp/restore.dump`);
    compose('exec', '-T', 'db', 'createdb', '-U', 'tracker', '-T', 'template0', 'tracker_restore');
    compose('exec', '-T', 'db', 'pg_restore', '-U', 'tracker', '-d', 'tracker_restore', '--single-transaction', '--no-owner', '--no-acl', '/tmp/restore.dump');
    assert.equal(snapshot('tracker_restore'), before);
    record('custom archive copied to host; separate empty-database restore matches all business rows');
    const url = 'postgresql://tracker:local_demo_only@db:5432/tracker_restore';
    compose('run', '--rm', '-e', `DATABASE_URL=${url}`, 'tools', 'npm', 'run', 'db:migrate');
    assert.equal(snapshot('tracker_restore'), before);
    record('restored ORM migration history accepts deploy without replaying initial SQL');
    // Overlay only this one-off tools container; base source/history stays unchanged.
    workspace = `${project}-upgrade`;
    compose('run', '-d', '--name', workspace, '--no-deps', 'tools', 'sleep', 'infinity');
    cli('cp', path.join(root, 'examples/recovery', track) + '/.', `${workspace}:/app`);
    cli('exec', workspace, 'npm', 'run', 'db:migrate');
    cli('exec', workspace, 'npm', 'run', 'db:migrate');
    assert.equal(sql('tracker', `SELECT count(*) FROM "Task" WHERE description IS NOT NULL;`), '0');
    assert.deepEqual(JSON.parse(sql('tracker', `SELECT json_agg(t ORDER BY id) FROM (SELECT id,title,done,"projectId","assigneeId" FROM "Task") t;`)), JSON.parse(before).tasks);
    record('nullable-description migration and repeat deploy preserve existing rows');
    compose('up', '-d', 'app');
    const base = `http://${compose('port', 'app', '3000').trim()}`;
    await ready(base);
    const response = await fetch(base + '/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ title: 'Old app writes after expansion' }) });
    assert.equal(response.status, 201);
    const task = await response.json();
    assert.equal(sql('tracker', `SELECT description IS NULL FROM "Task" WHERE id='${task.id.replaceAll("'", "''")}';`), 't');
    const list = await (await fetch(base + '/api/tasks')).json();
    assert.ok(list.tasks.some(t => t.id === 'recovery-proof' && t.done && t.assigneeId === 'sakura'));
    record('unchanged standalone app reads existing data and creates rows after expansion');
    result.passed = true;
  } catch (error) {
    result.passed = false; result.error = error.message; process.exitCode = 1;
    try { console.error(compose('logs', 'db', 'app')); } catch {}
  } finally {
    try {
      if (workspace) cli('rm', '-f', workspace);
      compose('down', '--volumes'); // Deletes only this run's disposable owned data.
      result.cleaned = true;
    } catch (error) { result.cleaned = false; result.cleanupError = error.message; process.exitCode = 1; }
    fs.writeFileSync(path.join(root, `tests/results/recovery-${track}.json`), JSON.stringify(result, null, 2) + '\n');
  }
})();
