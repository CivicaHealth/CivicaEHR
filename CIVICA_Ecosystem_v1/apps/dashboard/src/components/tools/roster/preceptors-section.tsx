import { Card, CardTitle } from '@civica/ui';
import type { getPeopleList, getTodaysRoster } from '@/server/queries/roster-queries';
import { MarkPreceptorForm } from './mark-preceptor-form';
import { RemovePreceptorButton } from './remove-preceptor-button';

interface PreceptorsSectionProps {
  preceptors: Awaited<ReturnType<typeof getTodaysRoster>>['preceptors'];
  people: Awaited<ReturnType<typeof getPeopleList>>;
  canEdit: boolean;
}

export function PreceptorsSection({ preceptors, people, canEdit }: PreceptorsSectionProps) {
  const presentIds = new Set(preceptors.map((preceptor) => preceptor.personId));
  const availablePreceptors = (people.preceptor ?? []).filter((person) => !presentIds.has(person.id));

  return (
    <Card className="p-6">
      <CardTitle>Preceptors present</CardTitle>
      {preceptors.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {preceptors.map((preceptor) => (
            <li key={preceptor.id} className="flex items-center justify-between gap-2 text-sm text-[var(--navy)]">
              <span>{preceptor.person.name}</span>
              {canEdit && <RemovePreceptorButton preceptorId={preceptor.id} />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">No preceptors marked present yet.</p>
      )}
      {canEdit && (
        <div className="mt-4">
          <MarkPreceptorForm availablePreceptors={availablePreceptors} />
        </div>
      )}
    </Card>
  );
}
