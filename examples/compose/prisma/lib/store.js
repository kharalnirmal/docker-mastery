import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const globalDb = globalThis;
export const db = globalDb.missionDb || new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 3000 })
});
if (process.env.NODE_ENV !== 'production') globalDb.missionDb = db;
export const ready = () => db.task.count();
export const list = (offset = 0) => db.task.findMany({ orderBy: { id: 'asc' }, skip: offset, take: 20 });
export const members = () => db.member.findMany({ orderBy: { id: 'asc' } });
export const create = data => db.task.create({ data: { id: crypto.randomUUID(), projectId: 'leaf', ...data } });
export async function update(id, data) {
  const result = await db.task.updateMany({ where: { id }, data });
  return result.count ? db.task.findUnique({ where: { id } }) : null;
}
export const close = () => db.$disconnect();
