// Disposable owned projects only. --keep retains them for browser verification.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { finishReport } = require('./lab-report.cjs');
const track = process.argv[2];
assert.ok(['prisma', 'drizzle'].includes(track), 'Choose prisma or drizzle');
const cwd = path.resolve(__dirname, `../examples/compose/${track}`);
const project = `guide-${track}-check-${Date.now()}`;
const env = { ...process.env, POSTGRES_PASSWORD: 'local_demo_only', APP_PORT: '0' };
const args = ['compose', '-p', project, '--env-file', '.env.example'];
const docker = (...command) => execFileSync('docker', command, { cwd, env, encoding: 'utf8', timeout: 600000 });
assert.equal(docker('context', 'show').trim(), 'desktop-linux', 'Only the confirmed local desktop-linux context is allowed');
const compose = (...command) => docker('--context', 'desktop-linux', ...args, ...command);
const result = { track, project, platform: process.platform, checks: [] };
const record = name => { result.checks.push(name); console.log(`PASS ${track}: ${name}`); };
async function waitFor(url, status) {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    try { const response = await fetch(url); if (response.status === status) return response; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out: ${url} expected ${status}`);
}
(async () => {
  try {
    compose('config', '--quiet'); record('Compose configuration');
    compose('build', 'app', 'tools'); record('standalone and tools builds without live database');
    compose('up', '-d', 'db');
    compose('run', '--rm', 'tools', 'npm', 'run', 'db:migrate');
    compose('run', '--rm', 'tools', 'npm', 'run', 'db:seed');
    compose('run', '--rm', 'tools', 'npm', 'run', 'db:migrate');
    compose('run', '--rm', 'tools', 'npm', 'run', 'db:seed');
    record('fresh migration and repeat migration/seed');
    compose('up', '-d', 'app');
    const address = compose('port', 'app', '3000').trim();
    const base = `http://${address}`;
    result.base = base;
    await waitFor(`${base}/api/readyz`, 200);
    assert.equal((await fetch(`${base}/api/healthz`)).status, 200);
    const initial = await (await fetch(`${base}/api/tasks`)).json();
    assert.equal(initial.tasks.length, 1);
    assert.equal(initial.members.length, 2); record('equivalent seeds and health endpoints');
    const send = (url, method, data) => fetch(base + url, { method, headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(data) });
    assert.equal((await fetch(`${base}/api/tasks`, { method: 'POST', body: '{}' })).status, 415);
    assert.equal((await send('/api/tasks', 'POST', { title: 'x'.repeat(17000) })).status, 413);
    assert.equal((await fetch(`${base}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await send('/api/tasks', 'POST', { title: ' ' })).status, 400);
    assert.equal((await send('/api/tasks', 'POST', { title: 'Invalid', assigneeId: 'unknown' })).status, 400);
    assert.equal((await fetch(`${base}/api/tasks?offset=-1`)).status, 400);
    for (const query of ['offset=', 'offset=0&offset=20', 'offset=10001', 'offset=1e2']) assert.equal((await fetch(`${base}/api/tasks?${query}`)).status, 400, query);
    assert.equal((await send('/api/tasks/absent', 'PATCH', { done: true })).status, 404);
    const response = await send('/api/tasks', 'POST', { title: 'Compose persistence proof' });
    assert.equal(response.status, 201);
    const task = await response.json();
    const updated = await send(`/api/tasks/${task.id}`, 'PATCH', { done: true, assigneeId: 'sakura' });
    assert.equal(updated.status, 200); assert.equal((await updated.json()).assigneeId, 'sakura');
    record('create, list, assignment, completion and invalid requests');
    const app = compose('ps', '-q', 'app').trim();
    const logging = JSON.parse(docker('--context', 'desktop-linux', 'inspect', '--format', '{{json .HostConfig.LogConfig}}', app));
    assert.equal(logging.Type, 'local');
    assert.equal(logging.Config['max-size'], '10m');
    assert.equal(logging.Config['max-file'], '3'); record('bounded local log rotation');
    assert.equal(docker('--context', 'desktop-linux', 'inspect', '--format', '{{.Config.User}}', app).trim(), 'node');
    assert.equal(compose('exec', '-T', 'app', 'id', '-u').trim(), '1000');
    const db = compose('ps', '-q', 'db').trim();
    assert.equal(docker('--context', 'desktop-linux', 'inspect', '--format', '{{json .HostConfig.PortBindings}}', db).trim(), '{}');
    record('non-root runner and unpublished database');
    compose('down'); compose('up', '-d');
    const newBase = `http://${compose('port', 'app', '3000').trim()}`;
    result.base = newBase;
    await waitFor(`${newBase}/api/readyz`, 200);
    const persisted = await (await fetch(`${newBase}/api/tasks`)).json();
    assert.ok(persisted.tasks.some(t => t.id === task.id && t.done && t.assigneeId === 'sakura'));
    record('data survives full container replacement');
    compose('stop', 'db');
    await waitFor(`${newBase}/api/readyz`, 503);
    assert.equal((await fetch(`${newBase}/api/healthz`)).status, 200);
    compose('start', 'db');
    await waitFor(`${newBase}/api/readyz`, 200);
    record('database outage: health 200, readiness 503, then recovery');
    result.images = JSON.parse(docker('--context', 'desktop-linux', 'image', 'inspect', `${project}-app`, '--format', '{{json .}}'));
    // Keep artifacts compact: record identity rather than full image metadata.
    result.images = { app: result.images.Id, nodeTag: 'node:24-bookworm-slim', postgresTag: 'postgres:18-bookworm' };
    result.passed = true;
  } catch (error) {
    result.passed = false; result.error = error.message;
    try { console.error(compose('logs', 'app', 'db')); } catch {}
    process.exitCode = 1;
  } finally {
    finishReport(path.resolve(__dirname, `../tests/results/compose-${track}.json`), result,
      process.argv.includes('--keep') ? null : () => compose('down', '--volumes'));
    if (result.cleanupError) { console.error(result.cleanupError); process.exitCode = 1; }
  }
})();
