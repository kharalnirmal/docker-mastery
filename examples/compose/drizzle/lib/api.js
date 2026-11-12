import 'server-only';
import * as store from './store.js';
import { readJson } from './request.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
function validate(data, partial = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (Object.keys(data).some(key => !['title', 'done', 'assigneeId'].includes(key))) return false;
  if ((!partial || 'title' in data) && (typeof data.title !== 'string' || !data.title.trim() || data.title.trim().length > 120)) return false;
  if ('done' in data && typeof data.done !== 'boolean') return false;
  if ('assigneeId' in data && data.assigneeId !== null && !['naruto', 'sakura'].includes(data.assigneeId)) return false;
  if (typeof data.title === 'string') data.title = data.title.trim();
  return Object.keys(data).length > 0;
}
export async function GET(request) {
  const raw = new URL(request.url).searchParams.get('offset') || '0';
  if (!/^\d+$/.test(raw) || Number(raw) > 10000) return json({ error: 'Invalid offset' }, 400);
  try { return json({ tasks: await store.list(Number(raw)), members: await store.members() }); }
  catch { return json({ error: 'Database unavailable' }, 503); }
}
async function write(request, context, partial) {
  const origin = request.headers.get('origin');
  if (origin && origin !== `${new URL(request.url).protocol}//${request.headers.get('host')}`) return json({ error: 'Cross-origin write rejected' }, 403);
  let data;
  try { data = await readJson(request); } catch (error) { return json({ error: error.message }, error.status || 400); }
  if (!validate(data, partial)) return json({ error: 'Invalid task fields' }, 400);
  try {
    const result = partial ? await store.update((await context.params).id, data) : await store.create(data);
    return result ? json(result, partial ? 200 : 201) : json({ error: 'Task not found' }, 404);
  } catch { return json({ error: 'Database unavailable' }, 503); }
}
export const POST = request => write(request, null, false);
export const PATCH = (request, context) => write(request, context, true);
export async function readiness() {
  try { await store.ready(); return json({ ready: true }); }
  catch { return json({ ready: false }, 503); }
}
