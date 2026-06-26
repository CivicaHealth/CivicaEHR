import Link from 'next/link';
import { Card, CardTitle } from '@civica/ui';
import type { EmrPatient } from '@civica/db/tenant/schema';

export function DashboardStats({
  patientCount,
  appointmentCount,
  encounterCount,
  recentPatients,
}: {
  patientCount: number;
  appointmentCount: number;
  encounterCount: number;
  recentPatients: EmrPatient[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Patients" value={patientCount} />
        <StatCard label="Appointments" value={appointmentCount} />
        <StatCard label="Encounters" value={encounterCount} />
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
          <CardTitle className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            Recently added patients
          </CardTitle>
        </div>
        {recentPatients.length > 0 ? (
          <table className="w-full text-left text-sm">
            <tbody>
              {recentPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-2">
                    <Link href={`/emr/patients/${patient.id}`} className="font-medium text-[var(--navy)] hover:text-[var(--accent)]">
                      {patient.lastName}, {patient.firstName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-[var(--text-secondary)]">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-3 text-xs text-[var(--muted)]">No patients yet.</div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-[var(--navy)]">{value}</div>
    </Card>
  );
}
