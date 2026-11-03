// Requires successful --keep runs of tools/check-compose-labs.cjs for both tracks.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const cli = process.env.AGENT_BROWSER_BIN || (process.platform === 'win32'
  ? path.join(process.env.APPDATA, 'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe') : 'agent-browser');
const session = execFileSync(cli, ['session', 'id', '--scope', 'worktree', '--prefix', 'next-dev-loop'], { cwd: root, encoding: 'utf8' }).trim();
const browser = (...args) => execFileSync(cli, ['--session', session, '--restore', ...args], { cwd: root, encoding: 'utf8', timeout: 60000 });
const check = code => {
  const output = JSON.parse(browser('--json', 'eval', code));
  assert.equal(output.success, true, JSON.stringify(output));
  assert.equal(output.data.result, true, JSON.stringify(output));
};
async function mcp(base, method, params) {
  const response = await fetch(`${base}/_next/mcp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  assert.equal(response.status, 200);
  const text = await response.text();
  const json = JSON.parse(text.split('\n').find(line => line.startsWith('data: ')).slice(6));
  assert.ok(!json.error, JSON.stringify(json));
  return json.result;
}
(async () => {
  const tracks = process.argv[2] ? [process.argv[2]] : ['prisma', 'drizzle'];
  assert.ok(tracks.every(track => ['prisma', 'drizzle'].includes(track)));
  for (const track of tracks) {
    const resultPath = path.join(root, `tests/results/compose-${track}.json`);
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    assert.equal(result.passed, true);
    const cwd = path.join(root, `examples/compose/${track}`);
    const env = { ...process.env, POSTGRES_PASSWORD: 'local_demo_only', APP_PORT: '0' };
    const compose = (...args) => execFileSync('docker', ['compose', '-p', result.project, '--env-file', '.env.example', ...args], { cwd, env, encoding: 'utf8', timeout: 600000 });
    const dev = (...args) => compose('-f', 'compose.yaml', '-f', 'compose.dev.yaml', ...args);
    dev('up', '--build', '-d', '--wait', '--wait-timeout', '120', 'app');
    const base = `http://${dev('port', 'app', '3000').trim()}`;
    try { browser('close'); } catch (error) {
      if (!String(error.stderr).includes('EOF while parsing')) throw error;
      // The daemon may have closed successfully without acknowledging. open reconciles it.
    }
    browser('--enable', 'react-devtools', 'open', base);
    browser('wait', '--text', 'Compose persistence proof');
    const tools = await mcp(base, 'tools/list', {});
    assert.ok(tools.tools.some(tool => tool.name === 'get_compilation_issues'));
    const compilation = await mcp(base, 'tools/call', { name: 'get_compilation_issues', arguments: {} });
    assert.ok(!compilation.isError && !JSON.stringify(compilation).includes('Turbopack project is not available'), JSON.stringify(compilation));
    assert.deepEqual(JSON.parse(compilation.content.find(item => item.type === 'text').text).issues, []);
    result.compilation = compilation;
    result.routes = await mcp(base, 'tools/call', { name: 'get_routes', arguments: {} });
    browser('fill', '#title', `Browser proof ${track}`);
    browser('click', 'button[type=submit], form button');
    browser('wait', '--text', `Browser proof ${track}`);
    browser('select', `select[aria-label="Assign Browser proof ${track}"]`, 'sakura');
    browser('wait', '--fn', `!document.querySelector('form button').disabled`);
    browser('check', `li:has(select[aria-label="Assign Browser proof ${track}"]) input[type=checkbox]`);
    browser('wait', '--fn', `!document.querySelector('form button').disabled`);
    browser('reload');
    browser('wait', '--text', `Browser proof ${track}`);
    check(`document.querySelector('select[aria-label="Assign Browser proof ${track}"]').value === 'sakura' && document.querySelector('li:has(select[aria-label="Assign Browser proof ${track}"]) input').checked`);
    for (const width of [320, 1440]) {
      browser('set', 'viewport', String(width), '900');
      check('document.documentElement.scrollWidth <= innerWidth');
    }
    result.react = JSON.parse(browser('--json', 'react', 'tree'));
    assert.equal(result.react.success, true);
    assert.match(JSON.stringify(result.react), /Tracker/);
    result.runtime = await mcp(base, 'tools/call', { name: 'get_errors', arguments: {} });
    const errorsText = JSON.stringify(result.runtime);
    assert.ok(!result.runtime.isError, errorsText);
    const runtimeErrors = JSON.parse(result.runtime.content.find(item => item.type === 'text').text);
    assert.deepEqual(runtimeErrors.configErrors, []);
    assert.deepEqual(runtimeErrors.sessionErrors, []);
    result.browserErrors = browser('errors');
    assert.ok(!result.browserErrors.trim(), result.browserErrors);
    result.browserPassed = true;
    result.devBase = base;
    // Rebuild final production image, then prove browser-origin API writes there too.
    compose('up', '--build', '-d', '--wait', '--wait-timeout', '120', 'app');
    const production = `http://${compose('port', 'app', '3000').trim()}`;
    browser('--enable', 'react-devtools', 'open', production);
    browser('wait', '--text', `Browser proof ${track}`);
    browser('fill', '#title', `Production proof ${track}`);
    browser('click', 'form button');
    browser('wait', '--text', `Production proof ${track}`);
    result.productionBrowserPassed = true;
    compose('down', '--volumes'); // Only the recorded uniquely owned verification project.
    result.cleaned = true;
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
    console.log(`PASS ${track}: Next MCP, browser create/assign/complete, reload, mobile, React tree, production browser write`);
  }
  browser('close');
})().catch(error => { console.error(error); process.exitCode = 1; });
