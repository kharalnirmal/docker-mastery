import { db, close } from '../lib/store.js';
import { projects, people, tasks } from '../lib/schema.js';

try {
  await db.transaction(async tx => {
    await tx.insert(projects).values({ id: 'leaf', name: 'Leaf launch' }).onConflictDoNothing();
    await tx.insert(people).values([{ id: 'naruto', name: 'Naruto' }, { id: 'sakura', name: 'Sakura' }]).onConflictDoNothing();
    await tx.insert(tasks).values({ id: 'welcome', title: 'Verify the Compose stack', projectId: 'leaf', assigneeId: 'naruto' }).onConflictDoNothing();
  });
} finally { await close(); }
