import Link from 'next/link';
import { Badge, Card, CardTitle } from '@civica/ui';
import type { LabRequestWithPatient } from '@/server/queries/labs-queries';

/** Completed lab requests awaiting a doctor's review, with a link into the split-view review page. */
export function LabReviewQueue({ labRequests }: { labRequests: LabRequestWithPatient[] }) {
  return (
    <div className="space-y-2">
      <CardTitle className="text-sm">Needs doctor review</CardTitle>
      <Card className="p-0">
        {labRequests.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
            No completed labs are waiting on a doctor review.
          </div>
        ) : (
          labRequests.map((labRequest) => (
            <Link
              key={labRequest.id}
              href={`/labs/review/${labRequest.id}`}
              className="flex flex-col gap-1 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0 hover:bg-[var(--bg)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-[var(--navy)]">{labRequest.testName}</span>
                  <Badge variant="accent" className="text-[10px] capitalize">
                    {labRequest.category}
                  </Badge>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {labRequest.patient.lastName}, {labRequest.patient.firstName}
                  {labRequest.resultAt ? ` · Resulted ${new Date(labRequest.resultAt).toLocaleDateString()}` : ''}
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--accent)]">Review →</span>
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}
