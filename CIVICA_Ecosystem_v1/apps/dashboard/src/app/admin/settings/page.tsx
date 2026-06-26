import { redirect } from 'next/navigation';
import { getPlatformSettings } from '@civica/db/control/settings';
import { Card, CardTitle, CardDescription } from '@civica/ui';
import { requireAdminAccess } from '@/lib/admin/access';
import { NotificationEmailForm } from '@/components/admin/notification-email-form';

export default async function AdminSettingsPage() {
  const { clinicId } = await requireAdminAccess();
  if (clinicId !== null) {
    redirect('/admin');
  }

  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Platform-wide configuration.</p>
      </div>

      <Card className="space-y-4">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Get notified by email about platform events that need your attention.</CardDescription>
        </div>
        <NotificationEmailForm notificationEmail={settings.notificationEmail} />
      </Card>
    </div>
  );
}
