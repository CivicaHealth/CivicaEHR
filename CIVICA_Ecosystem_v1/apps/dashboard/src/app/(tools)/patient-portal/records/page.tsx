import { Card, CardTitle, Badge } from '@civica/ui';
import { requirePatientContext } from '@/lib/portal/context';
import { getPortalRecords } from '@/server/queries/portal-queries';

function formatDate(value: Date): string {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function PatientPortalRecordsPage() {
  const { link, tenantDb } = await requirePatientContext();
  const { sharedEncounters, allergies, problems } = await getPortalRecords(tenantDb, link.emrPatientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">My records</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Visit summaries your care team has shared with you, plus your allergies and ongoing problems.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-3 text-base">Allergies</CardTitle>
          {allergies.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No known allergies on file.</p>
          ) : (
            <ul className="space-y-2">
              {allergies.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--navy)]">
                    {a.allergen}
                    {a.reaction ? ` — ${a.reaction}` : ''}
                  </span>
                  {a.severity && (
                    <Badge variant={a.severity === 'severe' ? 'danger' : a.severity === 'moderate' ? 'warning' : 'neutral'}>
                      {a.severity}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-3 text-base">Problems</CardTitle>
          {problems.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No problems on file.</p>
          ) : (
            <ul className="space-y-2">
              {problems.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--navy)]">{p.description}</span>
                  <Badge variant={p.status === 'active' ? 'accent' : 'success'}>{p.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-[var(--navy)]">Shared visit summaries</h2>
        {sharedEncounters.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--text-secondary)]">
              Your care team hasn&apos;t shared any visit summaries yet. When they do, they&apos;ll appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sharedEncounters.map((enc) => (
              <Card key={enc.id}>
                <div className="mb-3 flex items-center justify-between">
                  <CardTitle className="text-base">{enc.reasonForVisit}</CardTitle>
                  <span className="text-xs text-[var(--text-secondary)]">{formatDate(enc.encounterDate)}</span>
                </div>

                {enc.soapNote && (enc.soapNote.assessment || enc.soapNote.plan) && (
                  <div className="mb-3 space-y-2 text-sm">
                    {enc.soapNote.assessment && (
                      <p>
                        <span className="font-medium text-[var(--navy)]">Assessment: </span>
                        <span className="text-[var(--text-secondary)]">{enc.soapNote.assessment}</span>
                      </p>
                    )}
                    {enc.soapNote.plan && (
                      <p>
                        <span className="font-medium text-[var(--navy)]">Plan: </span>
                        <span className="text-[var(--text-secondary)]">{enc.soapNote.plan}</span>
                      </p>
                    )}
                  </div>
                )}

                {enc.diagnoses.length > 0 && (
                  <div className="mb-3 text-sm">
                    <p className="font-medium text-[var(--navy)]">Diagnoses</p>
                    <ul className="mt-1 list-inside list-disc text-[var(--text-secondary)]">
                      {enc.diagnoses.map((d) => (
                        <li key={d.id}>{d.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {enc.medications.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium text-[var(--navy)]">Medications</p>
                    <ul className="mt-1 list-inside list-disc text-[var(--text-secondary)]">
                      {enc.medications.map((m) => (
                        <li key={m.id}>
                          {m.name}
                          {m.dosage ? ` — ${m.dosage}` : ''}
                          {m.instructions ? ` (${m.instructions})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
