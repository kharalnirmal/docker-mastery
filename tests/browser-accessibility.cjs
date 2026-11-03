// Optional Chromium checks; requires agent-browser and the local preview.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const cli = process.env.AGENT_BROWSER_BIN || (process.platform === 'win32'
  ? path.join(process.env.APPDATA, 'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe')
  : 'agent-browser');
const run = (...args) => execFileSync(cli, ['--session', 'docker-accessibility', ...args], { encoding: 'utf8', timeout: 60000 });
const evaluate = code => {
  const result = JSON.parse(run('--json', 'eval', code));
  assert.equal(result.success, true, JSON.stringify(result));
  return result.data.result;
};
run('open', 'http://127.0.0.1:4173/#home');
run('reload');
run('set', 'viewport', '390', '844');
run('set', 'media', 'light', 'reduced-motion');
assert.equal(evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.querySelector('.hero-main')).transitionDuration === '0s'`), true);
for (const theme of ['light', 'dark']) {
  for (const route of ['home', 'first-container', 'first-dockerfile', 'compose-stack', 'docker-capstone']) {
    run('open', `http://127.0.0.1:4173/#${route}`);
    evaluate(`document.documentElement.dataset.theme = '${theme}'`);
    const result = JSON.parse(run('a11y', '--json'));
    assert.equal(result.success, true, JSON.stringify(result));
    assert.equal(result.data.counts.violations, 0, JSON.stringify(result.data.violations));
    console.log(`PASS axe ${theme} ${route}: zero violations (${result.data.counts.incomplete} manual-review rules)`);
  }
}
run('open', 'http://127.0.0.1:4173/#home');
// CSS zoom is a layout stress test, not certification of browser/OS text zoom.
assert.equal(evaluate(`(async () => {
  document.body.style.zoom = '2';
  await new Promise(resolve => requestAnimationFrame(resolve));
  const home = document.getElementById('home');
  home.scrollTop = 0;
  const top = document.querySelector('.landing-inner').getBoundingClientRect().top;
  const reachableTop = top >= home.getBoundingClientRect().top;
  document.querySelector('.creator-socials').scrollIntoView();
  const bottom = document.querySelector('.creator-socials').getBoundingClientRect().bottom;
  const reachableBottom = bottom <= innerHeight;
  document.body.style.zoom = '';
  return reachableTop && reachableBottom;
})()`), true);
console.log('PASS reduced motion and 200% CSS-zoom scroll reachability; manual/physical-device review still required');
