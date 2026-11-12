const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { finishReport } = require('../tools/lab-report.cjs');
test('lab evidence survives cleanup failure and distinguishes retained resources', t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-report-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const file = path.join(base, 'results/report.json');
  finishReport(file, { passed: true }, () => { throw new Error('cleanup failed'); });
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), { passed: false, cleaned: false, cleanupError: 'cleanup failed' });
  assert.equal(finishReport(file, { passed: true }, () => {}).cleaned, true);
  assert.deepEqual(finishReport(file, { passed: true }, null), { passed: true, cleaned: false, retained: true });
});
