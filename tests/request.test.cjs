const { test } = require('node:test');
const assert = require('node:assert/strict');
for (const track of ['prisma', 'drizzle']) {
  test(`${track}: bounded JSON parsing rejects unsupported, oversized and malformed bodies`, async () => {
    const { readJson } = await import(`../examples/compose/${track}/lib/request.js`);
    const request = (body, headers = { 'Content-Type': 'application/json' }) => new Request('http://localhost/api/tasks', { method: 'POST', body, headers });
    assert.deepEqual(await readJson(request('{"title":"Test"}')), { title: 'Test' });
    assert.deepEqual(await readJson(request('{}', { 'Content-Type': 'Application/JSON; charset=utf-8' })), {});
    await assert.rejects(readJson(request('{}', {})), { status: 415 });
    await assert.rejects(readJson(request('{')), { status: 400 });
    await assert.rejects(readJson(request(new Uint8Array([0xff]))), { status: 400 });
    await assert.rejects(readJson(request('x'.repeat(16385))), { status: 413 });
    await assert.rejects(readJson(request('{}', { 'Content-Type': 'application/json', 'Content-Length': '17000' })), { status: 413 });
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(10000)); controller.enqueue(new Uint8Array(10000)); controller.close(); } });
    await assert.rejects(readJson(new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: stream, duplex: 'half' })), { status: 413 });
  });
}
