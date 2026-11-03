const { test } = require('node:test');
const assert = require('node:assert/strict');
const { publicFile } = require('../tools/build.cjs');
test('static release includes public sources but excludes local and sensitive artifacts', () => {
  assert.equal(publicFile('docs/OPERATIONS-RUNBOOK.md'), true);
  assert.equal(publicFile('docs/.env'), false);
  for (const file of ['index.html', 'README.md', 'assets/images/naruto.webp', 'assets/fonts/Inter-OFL.txt', 'examples/compose/prisma/.env.example', 'examples/compose/prisma/.dockerignore', 'examples/delivery/docker-ci.yaml']) assert.equal(publicFile(file), true, file);
  for (const file of ['.git/config', 'tests/results/compose-prisma.json', 'tools/serve.cjs', 'examples/compose/prisma/.env', 'examples/compose/prisma/.env.local', 'examples/compose/prisma/node_modules/a.js', 'examples/compose/prisma/.next/server.js', 'examples/compose/prisma/generated/client.js', 'examples/recovery/backup.dump', 'assets/images/naruto.jpg', 'examples/key.pem']) assert.equal(publicFile(file), false, file);
});
