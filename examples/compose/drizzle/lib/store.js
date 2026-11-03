import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { tasks, people } from './schema.js';

const pool = globalThis.missionPool || new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 3000 });
if (process.env.NODE_ENV !== 'production') globalThis.missionPool = pool;
pool.on('error', () => console.error('Idle database connection lost'));
export const db = drizzle(pool);
export const ready = () => db.select({ id: tasks.id }).from(tasks).limit(1);
export const list = (offset = 0) => db.select().from(tasks).orderBy(tasks.id).limit(20).offset(offset);
export const members = () => db.select().from(people).orderBy(people.id);
export const create = async data => (await db.insert(tasks).values({ id: crypto.randomUUID(), projectId: 'leaf', ...data }).returning())[0];
export const update = async (id, data) => (await db.update(tasks).set(data).where(eq(tasks.id, id)).returning())[0] || null;
export const close = () => pool.end();
