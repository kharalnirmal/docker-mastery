import { pgTable, text, varchar, boolean, index } from 'drizzle-orm/pg-core';

export const projects = pgTable('Project', { id: text('id').primaryKey(), name: text('name').notNull() });
export const people = pgTable('Member', { id: text('id').primaryKey(), name: text('name').notNull() });
export const tasks = pgTable('Task', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 120 }).notNull(),
  done: boolean('done').notNull().default(false),
  projectId: text('projectId').notNull().references(() => projects.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  assigneeId: text('assigneeId').references(() => people.id, { onDelete: 'set null', onUpdate: 'cascade' })
}, table => [index('Task_projectId_idx').on(table.projectId)]);
