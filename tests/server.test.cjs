const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPreviewServer, blockedPath } = require('../tools/serve.cjs');
test('preview rejects private artifacts and normalized target paths', () => {
  for (const name of ['backup.gz', 'archive.tar', 'client.PFX', 'error.LOG', 'data.sqlite', 'data.db', 'RESULTS/evidence.json', 'NODE_MODULES/package.json', '.env.production']) {
    assert.equal(blockedPath(`examples/${name}`), true, name);
  }
  for (const name of ['.env.example', 'migrations/initial.sql', 'package-lock.json']) assert.equal(blockedPath(name), false, name);
});
test('preview serves docs but blocks environment files, dependencies and backup artifacts', async () => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const url of ['/', '/assets/js/delivery.js', '/examples/delivery/README.md', '/examples/compose/prisma/.env.example']) {
      assert.equal((await fetch(base + url)).status, 200, url);
    }
    for (const url of ['/examples/compose/prisma/.env', '/examples/compose/prisma/.env.release', '/examples/compose/drizzle/node_modules/next/package.json', '/tests/results/recovery-prisma.json', '/backup.dump', '/%2eenv', '/.git/config']) {
      assert.equal((await fetch(base + url)).status, 403, url);
    }
    assert.equal((await fetch(base + '/missing')).status, 404);
    for (const url of ['/', '/missing', '/.git/config', '/%ZZ']) {
      const response = await fetch(base + url);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
    }
    for (const url of ['/%ZZ', '/%E0%A4', '/%00', '/%0a']) {
      assert.equal((await fetch(base + url)).status, 400, url);
    }
    assert.equal((await fetch(base + '/')).status, 200, 'malformed requests do not terminate the server');
    for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
      const response = await fetch(base + '/', { method });
      assert.equal(response.status, 405);
      assert.equal(response.headers.get('allow'), 'GET, HEAD');
    }
    const head = await fetch(base + '/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal(Number(head.headers.get('content-length')), Buffer.byteLength(await (await fetch(base + '/')).text()));
    const portrait = await fetch(base + '/assets/images/naruto.webp');
    assert.equal(portrait.status, 200);
    assert.equal(portrait.headers.get('content-type'), 'image/webp');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
