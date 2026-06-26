import { controlDb } from './client';
import { platformSettings } from './schema';

export async function getPlatformSettings() {
  const [row] = await controlDb.select().from(platformSettings).limit(1);
  if (row) return row;
  const [created] = await controlDb.insert(platformSettings).values({ id: 'default' }).returning();
  return created;
}

export async function setNotificationEmail(notificationEmail: string | null) {
  await controlDb.insert(platformSettings).values({ id: 'default', notificationEmail }).onConflictDoUpdate({
    target: platformSettings.id,
    set: { notificationEmail, updatedAt: new Date() },
  });
}
