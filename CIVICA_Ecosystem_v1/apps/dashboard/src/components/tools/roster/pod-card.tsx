import Link from 'next/link';
import { Card, CardTitle } from '@civica/ui';
import type { getTodaysRoster } from '@/server/queries/roster-queries';

interface PodCardProps {
  pod: Awaited<ReturnType<typeof getTodaysRoster>>['pods'][number];
}

export function PodCard({ pod }: PodCardProps) {
  return (
    <Link href={`/roster/pods/${pod.id}`}>
      <Card className="h-full p-5 transition-colors hover:border-[var(--accent)]/40">
        <CardTitle>{pod.name}</CardTitle>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {pod.assignments.length} staff &middot; {pod.patients.length} patient{pod.patients.length === 1 ? '' : 's'}
        </p>
        <div className="mt-3 flex gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-1 ${pod.roomCleaned ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'bg-[var(--bg)] text-[var(--muted)]'}`}
          >
            Room {pod.roomCleaned ? 'cleaned' : 'pending'}
          </span>
          <span
            className={`rounded-full px-2 py-1 ${pod.cubicleCleaned ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'bg-[var(--bg)] text-[var(--muted)]'}`}
          >
            Cubicle {pod.cubicleCleaned ? 'cleaned' : 'pending'}
          </span>
        </div>
      </Card>
    </Link>
  );
}
