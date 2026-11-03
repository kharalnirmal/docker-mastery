// Fake secrets only. Builds uniquely tagged disposable images; never pushes.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const docker = (...args) => execFileSync('docker', args, { cwd: root, encoding: 'utf8', timeout: 300000, maxBuffer: 8 * 1024 * 1024 });
assert.equal(docker('context', 'show').trim(), 'desktop-linux');
const cli = (...args) => docker('--context', 'desktop-linux', ...args);
const tag = `guide-buildkit-check:${Date.now()}`;
const tempRoot = process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : os.tmpdir();
const dir = fs.mkdtempSync(path.join(tempRoot, 'guide-buildkit-'));
const secret = path.join(dir, 'demo.txt');
fs.writeFileSync(secret, 'fake-demo-only');
const result = { checkedAt: new Date().toISOString(), tag, checks: [] };
const args = ['buildx', 'build', '--load', '-f', 'examples/delivery/Dockerfile.buildkit', '-t', tag];
try {
  let failed = false;
  try { cli(...args, '--no-cache', 'examples/delivery'); } catch { failed = true; }
  assert.ok(failed, 'Required secret must reject an uncached first build');
  result.checks.push('required missing secret fails');
  cli(...args, '--secret', `id=demo,src=${secret}`, 'examples/delivery');
  cli(...args, '--secret', `id=demo,src=${secret}`, 'examples/delivery');
  const proof = cli('run', '--rm', tag, 'sh', '-ec', 'test ! -e /run/secrets/demo; test ! -e /var/cache/guide/status; cat /proof.txt');
  assert.match(proof, /Build secret was mounted, not copied/);
  assert.doesNotMatch(cli('history', '--no-trunc', tag), /fake-demo-only/);
  assert.equal(JSON.parse(cli('image', 'inspect', tag))[0].Config.User, '1000:1000');
  result.checks.push('secret/cache mounts work; rebuild succeeds; final image excludes mounted files and secret text in history; non-root proof runs');
  result.passed = true;
} catch (error) { result.passed = false; result.error = error.message; process.exitCode = 1; }
finally {
  try {
    // Remove this exact test tag only; no cache/base-image pruning.
    cli('image', 'rm', tag);
    fs.unlinkSync(secret); fs.rmdirSync(dir);
    result.cleaned = true;
  } catch (error) { result.cleaned = false; result.cleanupError = error.message; process.exitCode = 1; }
  fs.writeFileSync(path.join(root, 'tests/results/buildkit.json'), JSON.stringify(result, null, 2) + '\n');
}
