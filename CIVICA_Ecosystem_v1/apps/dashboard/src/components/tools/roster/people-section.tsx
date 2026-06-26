import type { getPeopleList } from '@/server/queries/roster-queries';
import { AddPersonForm } from './add-person-form';
import { RemovePersonButton } from './remove-person-button';
import { PERSON_ROLES, PERSON_ROLE_LABELS } from './roles';

interface PeopleSectionProps {
  people: Awaited<ReturnType<typeof getPeopleList>>;
  canEdit: boolean;
}

export function PeopleSection({ people, canEdit }: PeopleSectionProps) {
  return (
    <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--navy)]">Manage people</summary>
      <div className="mt-4 space-y-4">
        {PERSON_ROLES.map((role) => (
          <div key={role}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {PERSON_ROLE_LABELS[role]}
            </h3>
            {people[role]?.length ? (
              <ul className="mt-1 space-y-1">
                {people[role].map((person) => (
                  <li key={person.id} className="flex items-center justify-between gap-2 text-sm text-[var(--navy)]">
                    <span>
                      {person.name}
                      {person.notes && <span className="ml-2 text-[var(--text-secondary)]">({person.notes})</span>}
                    </span>
                    {canEdit && <RemovePersonButton personId={person.id} />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">No one yet.</p>
            )}
          </div>
        ))}
        {canEdit && <AddPersonForm />}
      </div>
    </details>
  );
}
