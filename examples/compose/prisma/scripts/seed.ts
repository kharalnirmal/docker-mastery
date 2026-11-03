import { db, close } from '../lib/store.js';

try {
  await db.$transaction(async tx => {
    await tx.project.upsert({ where: { id: 'leaf' }, update: {}, create: { id: 'leaf', name: 'Leaf launch' } });
    for (const [id, name] of [['naruto', 'Naruto'], ['sakura', 'Sakura']]) {
      await tx.member.upsert({ where: { id }, update: {}, create: { id, name } });
    }
    await tx.task.upsert({ where: { id: 'welcome' }, update: {}, create: { id: 'welcome', title: 'Verify the Compose stack', projectId: 'leaf', assigneeId: 'naruto' } });
  });
} finally { await close(); }
