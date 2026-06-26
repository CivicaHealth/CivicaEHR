'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@civica/ui';
import type { getEmrPatients } from '@/server/queries/emr-queries';

interface EmrPatientsTableProps {
  patients: Awaited<ReturnType<typeof getEmrPatients>>;
}

function calculateAge(dateOfBirth: string): number | null {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasNotHadBirthdayThisYear =
    now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (hasNotHadBirthdayThisYear) age -= 1;
  return age;
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function EmrPatientsTable({ patients }: EmrPatientsTableProps) {
  const [filter, setFilter] = useState('');

  const normalized = filter.trim().toLowerCase();
  const filtered = normalized
    ? patients.filter(
        (patient) =>
          patient.firstName.toLowerCase().includes(normalized) || patient.lastName.toLowerCase().includes(normalized),
      )
    : patients;

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
        <Input
          placeholder="Search by name"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Search patients by name"
          className="pl-9"
        />
      </div>
      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                <th className="py-2 pr-4 font-semibold">Patient</th>
                <th className="py-2 pr-4 font-semibold">Date of birth</th>
                <th className="py-2 pr-4 font-semibold">Age</th>
                <th className="py-2 pr-4 font-semibold">Sex</th>
                <th className="py-2 pr-4 font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => {
                const age = calculateAge(patient.dateOfBirth);
                return (
                  <tr key={patient.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/emr/patients/${patient.id}`}
                        className="group flex items-center gap-3 text-[var(--navy)] hover:text-[var(--accent)]"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-xs font-semibold text-[var(--accent)]">
                          {initials(patient.firstName, patient.lastName)}
                        </span>
                        <span className="font-medium group-hover:underline">
                          {patient.lastName}, {patient.firstName}
                        </span>
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{patient.dateOfBirth}</td>
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{age ?? '—'}</td>
                    <td className="py-2.5 pr-4 capitalize text-[var(--text-secondary)]">{patient.sex}</td>
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{patient.phone || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
          {normalized ? 'No patients match your search.' : 'No patients yet. Add one to get started.'}
        </p>
      )}
    </div>
  );
}
