// State-changing: unique disposable resources only. No remote deployments.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const track = process.argv[2];
assert.ok(['prisma', 'drizzle'].includes(track), 'Choose prisma or drizzle');
const root = path.resolve(__dirname, '..');
const cwd = path.join(root, 'examples/compose', track);
const project = `guide-delivery-${track}-${Date.now()}`;
const ci = process.argv.includes('--ci');
if (ci) assert.equal(process.env.GITHUB_ACTIONS, 'true', '--ci is only for isolated GitHub-hosted runners');
const context = ci ? 'default' : 'desktop-linux';
const env = { ...process.env, POSTGRES_PASSWORD: 'local_demo_only', APP_PORT: '0' };
const docker = (...args) => execFileSync('docker', args, { cwd, env, encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024 });
assert.equal(docker('context', 'show').trim(), context, 'Confirm the intended local Docker context');
const cli = (...args) => docker('--context', context, ...args);
const flags = ['compose', '-p', project, '--env-file', '.env.example', '-f', 'compose.yaml', '-f', '../../delivery/compose.secure.yaml'];
const compose = (...args) => cli(...flags, ...args);
const sql = query => compose('exec', '-T', 'db', 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'tracker', '-d', 'tracker', '-At', '-c', query).trim();
const result = { track, project, context, checkedAt: new Date().toISOString(), checks: [] };
const record = name => { result.checks.push(name); console.log(`PASS ${track}: ${name}`); };
async function ready(base) {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(base + '/api/readyz', { signal: AbortSignal.timeout(3000) })).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Readiness timed out');
}
let workspace;
(async () => {
  try {
    compose('config', '--quiet');
    compose('build', 'app', 'tools');
    compose('run', '--rm', '--no-deps', 'tools', 'npm', 'run', 'db:generate');
    record('schema/client generation with remediated tooling');
    compose('up', '-d', 'db');
    compose('run', '--rm', 'tools', 'sh', '-ec', 'npm run db:migrate && npm run db:seed');
    sql(`INSERT INTO "Task" (id,title,done,"projectId","assigneeId") VALUES ('failure-proof','Keep this assignment',true,'leaf','sakura');`);
    const rows = () => sql(`SELECT json_agg(t ORDER BY id) FROM (SELECT id,title,done,"projectId","assigneeId" FROM "Task") t;`);
    const before = rows();
    workspace = `${project}-tools`;
    compose('run', '-d', '--name', workspace, '--no-deps', 'tools', 'sleep', 'infinity');
    cli('cp', path.join(root, 'examples/recovery', track) + '/.', `${workspace}:/app`);
    // Deliberately conflicting empty column, only in this newly created database.
    sql('ALTER TABLE "Task" ADD COLUMN description TEXT;');
    let failed = false;
    try { cli('exec', workspace, 'npm', 'run', 'db:migrate'); } catch { failed = true; }
    assert.ok(failed, 'Conflicting migration must fail');
    assert.equal(rows(), before);
    if (track === 'prisma') assert.equal(sql(`SELECT count(*) FROM _prisma_migrations WHERE migration_name='202611030002_description' AND finished_at IS NULL AND rolled_back_at IS NULL;`), '1');
    else assert.equal(sql('SELECT count(*) FROM drizzle.__drizzle_migrations;'), '1');
    record('controlled migration failure preserves business rows and verified ORM history');
    assert.equal(sql('SELECT count(*) FROM "Task" WHERE description IS NOT NULL;'), '0');
    sql('ALTER TABLE "Task" DROP COLUMN description;');
    if (track === 'prisma') cli('exec', workspace, 'npx', '--no-install', 'prisma', 'migrate', 'resolve', '--rolled-back', '202611030002_description');
    cli('exec', workspace, 'npm', 'run', 'db:migrate');
    cli('exec', workspace, 'npm', 'run', 'db:migrate');
    assert.equal(rows(), before);
    record('verified lab-only conflict removal, explicit Prisma reconciliation, retry and repeat deploy');
    compose('up', '-d', 'app');
    const base = `http://${compose('port', 'app', '3000').trim()}`;
    await ready(base);
    const app = compose('ps', '-q', 'app').trim();
    const info = JSON.parse(cli('inspect', app))[0];
    assert.equal(info.Config.User, 'node');
    assert.equal(info.HostConfig.ReadonlyRootfs, true);
    assert.ok(info.HostConfig.CapDrop.includes('ALL'));
    assert.ok(info.HostConfig.SecurityOpt.some(v => v.startsWith('no-new-privileges')));
    assert.equal(info.HostConfig.Memory, 512 * 1024 * 1024);
    assert.equal(info.HostConfig.PidsLimit, 128);
    assert.equal(info.HostConfig.LogConfig.Config['max-size'], '10m');
    compose('exec', '-T', 'app', 'sh', '-ec', 'test ! -w /app/server.js; touch /tmp/proof; touch /app/.next/cache/proof');
    assert.ok((await (await fetch(base + '/api/tasks')).json()).tasks.some(t => t.id === 'failure-proof'));
    const response = await fetch(base + '/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ title: 'Hardened runtime write' }) });
    assert.equal(response.status, 201);
    const task = await response.json();
    record('read-only non-root runtime, dropped capabilities, writable tmpfs, resource/log limits and real API writes');
    const imageId = info.Image;
    compose('stop', 'app');
    const stopped = JSON.parse(cli('inspect', app))[0].State;
    assert.ok([0, 143].includes(stopped.ExitCode), `Unexpected stop exit: ${stopped.ExitCode}`);
    assert.equal(stopped.OOMKilled, false);
    compose('start', 'app');
    // Engine-assigned ephemeral host ports can change across stop/start.
    await ready(`http://${compose('port', 'app', '3000').trim()}`);
    record('SIGTERM stop without forced kill or OOM; process restarts healthy');
    // Test the pull-only release manifest with exact locally built image IDs.
    // Local IDs test replacement, NOT public registry digests/attestations.
    env.APP_IMAGE = imageId;
    env.TOOLS_IMAGE = cli('image', 'inspect', `${project}-tools`, '--format', '{{.Id}}').trim();
    const release = (...args) => cli(...flags, '-f', '../../delivery/compose.release.yaml', ...args);
    release('config', '--quiet');
    release('up', '-d', '--no-build', '--pull', 'never', '--force-recreate', 'app');
    const releaseBase = `http://${release('port', 'app', '3000').trim()}`;
    await ready(releaseBase);
    assert.equal(JSON.parse(cli('inspect', release('ps', '-q', 'app').trim()))[0].Image, imageId);
    assert.ok((await (await fetch(releaseBase + '/api/tasks')).json()).tasks.some(t => t.id === task.id));
    record('pull-only release overlay recreates same artifact and retains database writes');
    result.appImage = imageId;
    result.toolsImage = env.TOOLS_IMAGE;
    result.passed = true;
  } catch (error) {
    result.passed = false; result.error = error.message; process.exitCode = 1;
    try { console.error(compose('logs', 'app', 'db')); } catch {}
  } finally {
    try {
      if (workspace) cli('rm', '-f', workspace);
      compose('down', '--volumes'); // Only this run's test-owned data.
      result.cleaned = true;
    } catch (error) { result.cleaned = false; result.cleanupError = error.message; process.exitCode = 1; }
    fs.writeFileSync(path.join(root, `tests/results/delivery-${track}.json`), JSON.stringify(result, null, 2) + '\n');
  }
})();
