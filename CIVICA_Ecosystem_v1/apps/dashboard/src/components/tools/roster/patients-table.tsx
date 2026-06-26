'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@civica/ui';
import type { getTodaysRoster } from '@/server/queries/roster-queries';

interface PatientsTableProps {
  patients: Awaited<ReturnType<typeof getTodaysRoster>>['patients'];
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const [filter, setFilter] = useState('');

  const normalized = filter.trim().toLowerCase();
  const filtered = normalized
    ? patients.filter(
        (patient) => patient.prn.toLowerCase().includes(normalized) || patient.name.toLowerCase().includes(normalized),
      )
    : patients;

  return (
    <div>
      <Input
        placeholder="Filter by PRN or name"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        aria-label="Filter patients"
        className="mb-3 max-w-xs"
      />
      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">PRN</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Pod</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => (
                <tr key={patient.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-4 text-[var(--text-secondary)]">{patient.appointmentTime}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/roster/patients/${patient.id}`} className="text-[var(--accent)] hover:underline">
                      {patient.prn}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-[var(--navy)]">{patient.name}</td>
                  <td className="py-2 pr-4 text-[var(--text-secondary)]">{patient.pod?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">No patients yet.</p>
      )}
    </div>
  );
}
