// Optional CLI-driven Chromium checks. Requires agent-browser and a running preview.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const cli = process.env.AGENT_BROWSER_BIN || (process.platform === 'win32'
  ? path.join(process.env.APPDATA, 'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe')
  : 'agent-browser');
const run = (...args) => execFileSync(cli, ['--session', 'docker-guide-check', ...args], { encoding: 'utf8', timeout: 60000 });
const check = code => {
  const result = JSON.parse(run('--json', 'eval', `(async () => { await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))); return (${code}); })()`));
  assert.equal(result.success, true, JSON.stringify(result));
  assert.equal(result.data.result, true, JSON.stringify(result));
};
run('open', 'http://127.0.0.1:4173');
run('reload');
check(`(await Promise.all([document.fonts.load('400 15px Inter'), document.fonts.load('500 13.5px "JetBrains Mono"')]), document.fonts.check('400 15px Inter') && document.fonts.check('500 13.5px "JetBrains Mono"'))`);
for (const [width, height] of [[320,568],[375,667],[390,844],[768,1024],[1366,768],[1440,900],[844,390]]) {
  run('set', 'viewport', String(width), String(height));
  run('open', 'http://127.0.0.1:4173/#home');
  check(`(await Promise.all([...document.querySelectorAll('.hero-stack img')].map(img => img.decode())), [...document.querySelectorAll('.hero-stack img')].every(img => img.naturalWidth === 440 && img.currentSrc.endsWith('.webp')))`);
  check(`document.documentElement.scrollWidth <= innerWidth && document.getElementById('home').scrollHeight <= document.getElementById('home').clientHeight + 1`);
  check(`document.querySelectorAll('.creator-socials a').length === 3 && [...document.querySelectorAll('.creator-socials a')].every(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth && el.querySelector('svg') && el.getAttribute('aria-label'); })`);
  run('click', '.primary');
  check(`document.querySelector('article h1').textContent === 'Run your first container' && document.documentElement.scrollWidth <= innerWidth && document.querySelectorAll('#toc a').length >= 8`);
  if (width <= 900) {
    run('click', '#menu');
    check(`document.getElementById('menu').getAttribute('aria-expanded') === 'true' && document.getElementById('reading').inert && document.activeElement.id === 'close-menu'`);
    run('press', 'Shift+Tab');
    check(`document.activeElement.classList.contains('home-link')`);
    run('press', 'Tab');
    check(`document.activeElement.id === 'close-menu'`);
    run('press', 'Escape');
    check(`document.getElementById('menu').getAttribute('aria-expanded') === 'false' && document.activeElement.id === 'menu' && document.getElementById('sidebar').inert`);
    run('click', '#menu');
    check(`document.getElementById('sidebar').classList.contains('open')`);
    run('click', '.lesson-link[href="#first-dockerfile"]');
    check(`document.getElementById('menu').getAttribute('aria-expanded') === 'false' && document.querySelector('article h1').textContent === 'Build an image, line by line'`);
  }
  console.log(`PASS ${width}×${height}: landing fits, lesson renders, no outer horizontal overflow${width <= 900 ? ', drawer keyboard/navigation' : ''}`);
}
run('set', 'viewport', '390', '844');
run('click', '#search-trigger');
run('fill', '#search', 'OOM');
check(`document.querySelectorAll('#search-results a').length >= 1 && [...document.querySelectorAll('#search-results a')].some(a => a.getAttribute('href') === '#troubleshooting')`);
run('fill', '#search', 'RTO');
check(`[...document.querySelectorAll('#search-results a')].some(a => a.hash === '#command-reference')`);
run('fill', '#search', 'no-such-lesson');
check(`document.querySelectorAll('#search-results a').length === 0 && document.getElementById('search-status').textContent === '0 lessons found'`);
run('fill', '#search', '');
run('press', 'Escape');
check(`!document.getElementById('search-dialog').open && document.activeElement.id === 'search-trigger'`);
run('press', 'Control+k');
check(`document.getElementById('search-dialog').open && document.activeElement.id === 'search'`);
run('press', 'ArrowDown');
check(`document.querySelectorAll('#search-results a')[1].classList.contains('selected')`);
run('fill', '#search', 'Dockerfile');
run('press', 'Enter');
check(`!document.getElementById('search-dialog').open && location.hash === '#first-dockerfile'`);
run('click', '#menu');
check(`document.getElementById('sidebar').classList.contains('open')`);
run('set', 'viewport', '1366', '768');
check(`document.getElementById('menu').getAttribute('aria-expanded') === 'false' && !document.getElementById('reading').inert && !document.getElementById('sidebar').inert`);
run('click', '#theme');
check(`document.documentElement.dataset.theme === localStorage.getItem('field-guide-theme')`);
run('reload');
check(`document.documentElement.dataset.theme === localStorage.getItem('field-guide-theme')`);
run('click', '.lesson-footer a:last-child');
check(`location.hash === '#container-networks'`);
run('back');
check(`location.hash === '#first-dockerfile'`);
check(`document.querySelectorAll('.code-frame').length > 0 && getComputedStyle(document.querySelector('pre')).fontFamily.includes('JetBrains Mono') && document.querySelectorAll('.lesson-link').length === 20`);
run('open', 'http://127.0.0.1:4173/#first-container/run');
check(`document.getElementById('run').getBoundingClientRect().top > 50`);
check(`[...document.images].every(img => img.complete && img.naturalWidth > 0)`);
run('click', '.code-copy');
check(`document.querySelector('.code-copy').textContent === 'Copied'`);
run('set', 'viewport', '320', '568');
for (const id of ['first-container','container-lifecycle','first-dockerfile','container-networks','persistent-data','troubleshooting','command-reference','nextjs-postgres','prisma-track','drizzle-track','compose-stack','database-backups','schema-upgrades','migration-failures','buildkit-workflows','secure-runtime','registry-artifacts','docker-ci','single-host-release','docker-capstone']) {
  run('open', `http://127.0.0.1:4173/#${id}`);
  check(`document.querySelectorAll('article h2').length >= 8 && document.documentElement.scrollWidth <= innerWidth && document.querySelector('.lesson-link[aria-current="page"]').hash === location.hash`);
}
for (const width of [320, 768, 1440]) {
  run('set', 'viewport', String(width), '900');
  run('open', 'http://127.0.0.1:4173/#first-dockerfile/files');
  check(`[...document.querySelectorAll('.instruction-table td:first-child code')].every(el => { const range = document.createRange(); range.selectNodeContents(el); return range.getClientRects().length === 1 && getComputedStyle(el).whiteSpace === 'nowrap'; }) && [...document.querySelectorAll('.instruction-table td')].every(el => getComputedStyle(el).verticalAlign === 'top') && document.documentElement.scrollWidth <= innerWidth`);
}
for (const [lesson, section] of [['first-container', 'terminal-basics'], ['command-reference', 'glossary']]) {
  run('open', `http://127.0.0.1:4173/#${lesson}/${section}`);
  check(`document.getElementById('${section}').getBoundingClientRect().top >= 50 && document.documentElement.scrollWidth <= innerWidth`);
}
run('open', 'http://127.0.0.1:4173/#not-found');
check(`document.querySelector('article h1').textContent === 'Lesson not found'`);
console.log('PASS bundled fonts, header search, Ctrl+K/arrows/Enter/Escape, resize dismissal, theme persistence, history, copy buttons, code frames, all twenty mobile lessons, unbroken/top-aligned Dockerfile instruction names, section links, images, missing route');
console.log(run('errors'));
