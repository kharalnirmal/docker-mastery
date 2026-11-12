// Bound bytes before parsing; Content-Length alone is not trustworthy.
export function parseOffset(params) {
  const values = params.getAll('offset');
  if (!values.length) return 0;
  if (values.length !== 1 || !/^\d+$/.test(values[0])) return null;
  const value = Number(values[0]);
  return Number.isSafeInteger(value) && value <= 10000 ? value : null;
}
export async function readJson(request, limit = 16384) {
  const fail = (status, message) => Object.assign(new Error(message), { status });
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw fail(415, 'Use application/json');
  if (Number(request.headers.get('content-length')) > limit) throw fail(413, 'Request body too large');
  if (!request.body) throw fail(400, 'Invalid JSON');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw fail(413, 'Request body too large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (error.status === 413) throw error;
    throw fail(400, 'Invalid JSON');
  } finally { reader.releaseLock(); }
}
