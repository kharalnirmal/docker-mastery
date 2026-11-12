const fs = require('node:fs');
const path = require('node:path');
function finishReport(file, result, cleanup) {
  result.cleaned = false;
  if (cleanup) {
    try { cleanup(); result.cleaned = true; }
    catch (error) { result.cleanupError = error.message; result.passed = false; }
  } else result.retained = true;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  return result;
}
module.exports = { finishReport };
