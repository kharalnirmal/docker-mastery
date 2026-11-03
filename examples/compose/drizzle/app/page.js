'use client';
import { useEffect, useState } from 'react';

export default function Tracker() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('Loading…');
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  async function load(page = offset) {
    const response = await fetch(`/api/tasks?offset=${page}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Database unavailable. Check readiness and logs, then retry.');
    const data = await response.json();
    setTasks(data.tasks); setMembers(data.members); setMessage('');
  }
  useEffect(() => { load(offset).catch(error => setMessage(error.message)); }, [offset]);
  async function mutate(url, method, data) {
    setBusy(true);
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error((await response.json()).error);
      await load();
      return true;
    } catch (error) { setMessage(error.message); return false; }
    finally { setBusy(false); }
  }
  return <main>
    <p className="eyebrow">LOCAL CONTAINER LAB · DRIZZLE</p>
    <h1>Team Task Tracker</h1>
    <p>Leaf launch · Demo members only. No authentication: never publish this app or enter private data.</p>
    <form onSubmit={async event => {
      event.preventDefault(); const form = event.currentTarget;
      if (await mutate('/api/tasks', 'POST', { title: new FormData(form).get('title') })) form.reset();
    }}>
      <label htmlFor="title">New task</label>
      <div className="row"><input id="title" name="title" required maxLength={120} placeholder="What needs to happen?"/><button disabled={busy}>Add task</button></div>
    </form>
    <p role="status">{message}</p>
    <ul>{tasks.map(task => <li key={task.id}>
      <label><input type="checkbox" checked={task.done} disabled={busy} onChange={event => mutate(`/api/tasks/${task.id}`, 'PATCH', { done: event.target.checked })}/><span>{task.title}</span></label>
      <select aria-label={`Assign ${task.title}`} value={task.assigneeId || ''} disabled={busy} onChange={event => mutate(`/api/tasks/${task.id}`, 'PATCH', { assigneeId: event.target.value || null })}>
        <option value="">Unassigned</option>{members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
      </select>
    </li>)}</ul>
    <div className="row"><button disabled={offset === 0} onClick={() => setOffset(offset - 20)}>Previous</button><button disabled={tasks.length < 20} onClick={() => setOffset(offset + 20)}>Next</button><button onClick={() => load().catch(error => setMessage(error.message))}>Refresh</button></div>
    <p><a href="/api/healthz">Process health</a> · <a href="/api/readyz">Database readiness</a></p>
  </main>;
}
