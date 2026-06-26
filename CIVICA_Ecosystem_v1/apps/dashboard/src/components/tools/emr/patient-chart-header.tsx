import { Badge } from '@civica/ui';
import type { getEmrPatientDetail } from '@/server/queries/emr-queries';

type Patient = NonNullable<Awaited<ReturnType<typeof getEmrPatientDetail>>>;

export function PatientChartHeader({ patient }: { patient: Patient }) {
  return (
    <div className="border-b border-[var(--border)] pb-4">
      <h1 className="text-2xl font-bold text-[var(--navy)]">
        {patient.firstName} {patient.lastName}
      </h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
        <span className="font-mono text-xs text-[var(--muted)]">ID: {patient.id.slice(0, 8)}</span>
        <span>DOB: {patient.dateOfBirth}</span>
        <Badge variant="neutral" className="capitalize">
          {patient.sex}
        </Badge>
        {patient.phone ? <span>{patient.phone}</span> : null}
      </div>
    </div>
  );
}
