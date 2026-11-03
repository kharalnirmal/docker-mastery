// Trusted Chromium touch input via CDP, not synthetic DOM click events.
// Requires agent-browser and a running local preview; no hardware claim.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const cli = process.env.AGENT_BROWSER_BIN || (process.platform === 'win32' ? path.join(process.env.APPDATA, 'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe') : 'agent-browser');
const run = (...args) => execFileSync(cli, ['--session', 'docker-guide-touch', ...args], { encoding: 'utf8', timeout: 60000 }).trim();
run('open', 'http://127.0.0.1:4173/#first-container');
run('reload');
const socket = new WebSocket(run('get', 'cdp-url'));
let next = 0, session;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  const entry = pending.get(message.id);
  if (!entry) return;
  clearTimeout(entry.timeout); pending.delete(message.id);
  if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result);
});
function send(method, params = {}, scoped = true) {
  return new Promise((resolve, reject) => {
    const id = ++next;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params, ...(scoped && session ? { sessionId: session } : {}) }));
  });
}
async function evaluate(expression) {
  const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
  return result.value;
}
async function settle() {
  await evaluate('(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));return true})()');
}
async function tap(selector) {
  const { x, y } = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'nearest'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle();
}
(async () => {
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  const targets = await send('Target.getTargets', {}, false);
  const target = targets.targetInfos.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:4173'));
  session = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false)).sessionId;
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await settle();
  await evaluate('window.observedTouches=0;document.addEventListener("touchstart",e=>{if(e.isTrusted)window.observedTouches++})');
  await tap('#menu');
  assert.equal(await evaluate('document.getElementById("menu").getAttribute("aria-expanded")'), 'true');
  await tap('.lesson-link[href="#container-lifecycle"]');
  assert.equal(await evaluate('location.hash'), '#container-lifecycle');
  assert.equal(await evaluate('document.getElementById("menu").getAttribute("aria-expanded")'), 'false');
  await tap('#menu');
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 370, y: 400 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle();
  assert.equal(await evaluate('document.getElementById("menu").getAttribute("aria-expanded")'), 'false');
  await tap('#search-trigger');
  assert.equal(await evaluate('document.getElementById("search-dialog").open'), true);
  await tap('#close-search');
  assert.equal(await evaluate('document.getElementById("search-dialog").open'), false);
  assert.ok(await evaluate('window.observedTouches >= 6'));
  console.log('PASS trusted emulated touch: hamburger, drawer lesson link, backdrop dismissal, search open/close (390×844)');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => socket.close());
