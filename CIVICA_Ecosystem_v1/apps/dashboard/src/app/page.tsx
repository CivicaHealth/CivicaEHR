import { redirect } from 'next/navigation';
import { getCurrentUser, getPatientLink } from '@civica/auth';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Patients have their own home (the portal); everyone else goes to the dashboard.
  const patientLink = await getPatientLink(user.id);
  redirect(patientLink ? '/patient-portal' : '/dashboard');
}
