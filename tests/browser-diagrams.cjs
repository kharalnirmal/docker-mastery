// Optional real-browser SVG layout check. Requires agent-browser and preview.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cli = process.env.AGENT_BROWSER_BIN || (process.platform === 'win32'
  ? path.join(process.env.APPDATA, 'npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe')
  : 'agent-browser');
const run = (...args) => execFileSync(cli, ['--session', 'docker-diagram-review', ...args], { encoding: 'utf8', timeout: 60000 });
try {
  for (const file of fs.readdirSync(path.join(__dirname, '../assets/images/guides')).filter(file => file.endsWith('.svg'))) {
    run('open', `http://127.0.0.1:4173/assets/images/guides/${file}`);
    const result = JSON.parse(run('--json', 'eval', `Array.from(document.querySelectorAll('text')).map(node => { const b = node.getBBox(); return { text: node.textContent, x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height }; }).filter(b => b.x < 8 || b.y < 0 || b.right > 632 || b.bottom > 360)`));
    assert.equal(result.success, true);
    assert.deepEqual(result.data.result, [], `${file}: SVG text must stay within its viewBox`);
    console.log(`PASS ${file}: no clipped SVG text`);
  }
} finally { run('close'); }
