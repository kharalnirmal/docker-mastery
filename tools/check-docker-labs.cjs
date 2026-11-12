// Disposable lab verification. Creates uniquely named resources and removes only
// those it created, in finally. Never touches user containers, volumes or ports.
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { assertOwnership } = require('./lab-report.cjs');
const root = path.resolve(__dirname, '..');
const prefix = `fieldguide-${randomUUID().slice(0, 8)}`;
const containers = [], volumes = [], networks = [];
const report = { checkedAt: new Date().toISOString(), prefix, checks: [], images: {} };
const docker = (...args) => {
  if (args[0] === 'logs') {
    const result = spawnSync('docker', args, { encoding: 'utf8', timeout: 240000 });
    if (result.status !== 0) throw new Error(result.stderr || 'docker logs failed');
    return result.stdout + result.stderr;
  }
  return execFileSync('docker', args, { encoding: 'utf8', timeout: 240000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
};
function container(suffix, args) {
  const name = `${prefix}-${suffix}`;
  containers.push(name);
  return docker('run', '--name', name, '--label', `fieldguide.check=${prefix}`, ...args);
}
function volume(suffix) { const name = `${prefix}-${suffix}`; docker('volume', 'create', '--label', `fieldguide.check=${prefix}`, name); volumes.push(name); return name; }
const inspect = name => JSON.parse(docker('inspect', name))[0];
async function until(action) {
  let last;
  for (let i = 0; i < 60; i++) {
    try { return await action(); } catch (error) { last = error; await new Promise(resolve => setTimeout(resolve, 500)); }
  }
  throw last;
}
(async () => {
  report.context = docker('context', 'show');
  assert.equal(report.context, 'desktop-linux', 'This review runner targets the confirmed local Desktop context only.');
  report.version = JSON.parse(docker('version', '--format', '{{json .}}'));
  report.compose = docker('compose', 'version');
  // BuildKit can use a base without adding a named image to the engine store.
  // Pull explicitly so first-container behavior and exact digests are recorded.
  for (const image of ['nginx:stable-alpine', 'alpine:3', 'hello-world']) {
    docker('pull', image);
    report.images[image] = JSON.parse(docker('image', 'inspect', image))[0].RepoDigests;
  }
  container('hello', ['hello-world']);
  assert.equal(inspect(`${prefix}-hello`).State.ExitCode, 0);
  report.checks.push('hello-world: greeting container exits zero');
  docker('build', '--label', `fieldguide.check=${prefix}`, '-t', `${prefix}:checkpoint-01`, path.join(root, 'examples/docker/01-static-page'));
  container('page', ['-d', '-p', '127.0.0.1::80', `${prefix}:checkpoint-01`]);
  let port = docker('port', `${prefix}-page`, '80/tcp').split(':').at(-1);
  await until(async () => {
    const res = await fetch(`http://127.0.0.1:${port}`);
    assert.equal(res.status, 200); assert.match(await res.text(), /Team Task Tracker/);
  });
  report.checks.push('Dockerfile builds; loopback HTTP returns 200 and checkpoint heading');
  docker('exec', `${prefix}-page`, 'nginx', '-v');
  docker('stop', `${prefix}-page`);
  assert.equal(inspect(`${prefix}-page`).State.Running, false);
  docker('start', `${prefix}-page`);
  // Engine-assigned ephemeral host ports may change when a container restarts.
  port = docker('port', `${prefix}-page`, '80/tcp').split(':').at(-1);
  await until(async () => assert.equal((await fetch(`http://127.0.0.1:${port}`)).status, 200));
  report.checks.push('Lifecycle stop/start preserves the existing container and serves HTTP again');
  container('broken', ['-d', `${prefix}:checkpoint-01`, 'nginx', '-t', '-c', '/missing.conf']);
  await until(() => {
    const state = inspect(`${prefix}-broken`).State;
    assert.equal(state.Running, false); assert.notEqual(state.ExitCode, 0);
    assert.match(docker('logs', `${prefix}-broken`), /missing.conf/);
  });
  report.checks.push('Controlled missing-config command exits nonzero; logs identify missing.conf');
  container('recovered', ['-d', '-p', '127.0.0.1::80', `${prefix}:checkpoint-01`]);
  const recoveredPort = docker('port', `${prefix}-recovered`, '80/tcp').split(':').at(-1);
  await until(async () => assert.match(await (await fetch(`http://127.0.0.1:${recoveredPort}`)).text(), /Team Task Tracker/));
  report.checks.push('Recovery: newly created container with default CMD serves checkpoint page');
  const net = `${prefix}-net`;
  docker('network', 'create', '--label', `fieldguide.check=${prefix}`, net); networks.push(net);
  container('web', ['-d', '--network', net, '--network-alias', 'web', `${prefix}:checkpoint-01`]);
  await until(() => assert.match(container(`client-${containers.length}`, ['--network', net, 'alpine:3', 'wget', '-qO-', 'http://web']), /Team Task Tracker/));
  report.checks.push('User-defined bridge DNS resolves web; client gets checkpoint HTTP without host publication');
  const data = volume('notes'), backup = volume('backup'), restored = volume('restored');
  container('writer', ['--mount', `type=volume,source=${data},target=/data`, 'alpine:3', 'sh', '-c', 'printf "checkpoint-01\\n" > /data/note.txt']);
  docker('rm', `${prefix}-writer`);
  containers.splice(containers.indexOf(`${prefix}-writer`), 1);
  assert.equal(container('reader', ['--mount', `type=volume,source=${data},target=/data,readonly`, 'alpine:3', 'cat', '/data/note.txt']), 'checkpoint-01');
  container('backup', ['--mount', `type=volume,source=${data},target=/data,readonly`, '--mount', `type=volume,source=${backup},target=/backup`, 'alpine:3', 'tar', '-cf', '/backup/notes.tar', '-C', '/data', '.']);
  container('restore', ['--mount', `type=volume,source=${restored},target=/data`, '--mount', `type=volume,source=${backup},target=/backup,readonly`, 'alpine:3', 'tar', '-xf', '/backup/notes.tar', '-C', '/data']);
  assert.equal(container('restored-reader', ['--mount', `type=volume,source=${restored},target=/data,readonly`, 'alpine:3', 'cat', '/data/note.txt']), 'checkpoint-01');
  report.checks.push('Named-volume data survives between containers; tar archive restored into a separate volume and content verified');
  for (const image of ['nginx:stable-alpine', 'alpine:3', 'hello-world']) report.images[image] = JSON.parse(docker('image', 'inspect', image))[0].RepoDigests;
  report.success = true;
})().catch(error => {
  report.success = false; report.error = error.message;
  if (error.stderr) report.stderr = String(error.stderr);
  process.exitCode = 1;
}).finally(() => {
  report.cleanup = [];
  for (const name of containers.reverse()) {
    try {
      assertOwnership(inspect(name).Config.Labels, 'fieldguide.check', prefix);
      docker('rm', '-f', name);
    } catch (error) { report.cleanup.push(`${name}: ${error.message}`); }
  }
  for (const name of networks) try {
    assertOwnership(JSON.parse(docker('network', 'inspect', name))[0].Labels, 'fieldguide.check', prefix);
    docker('network', 'rm', name);
  } catch (error) { report.cleanup.push(`${name}: ${error.message}`); }
  for (const name of volumes) try {
    assertOwnership(JSON.parse(docker('volume', 'inspect', name))[0].Labels, 'fieldguide.check', prefix);
    docker('volume', 'rm', name);
  } catch (error) { report.cleanup.push(`${name}: ${error.message}`); }
  try {
    assertOwnership(JSON.parse(docker('image', 'inspect', `${prefix}:checkpoint-01`))[0].Config.Labels, 'fieldguide.check', prefix);
    docker('image', 'rm', `${prefix}:checkpoint-01`);
  } catch (error) { report.cleanup.push(error.message); }
  fs.mkdirSync(path.join(root, 'tests/results'), { recursive: true });
  fs.writeFileSync(path.join(root, 'tests/results/docker-labs.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (report.cleanup.length) process.exitCode = 1;
});
