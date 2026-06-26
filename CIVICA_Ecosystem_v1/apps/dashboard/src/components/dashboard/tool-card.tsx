import { ArrowRight, Lock } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@civica/ui';
import { launchToolAction } from '@/server/actions/tool-actions';
import { ToolIcon } from '@/lib/tools/icons';
import type { ToolCardData } from '@/lib/tools/registry';

const ICON_COLOR_CLASSES: Record<string, string> = {
  emr: 'bg-[var(--accent-light)] text-[var(--accent)]',
  inventory: 'bg-[var(--bg)] text-[var(--navy-light)]',
  roster: 'bg-[var(--accent-light)] text-[var(--navy-mid)]',
  'patient-portal': 'bg-[var(--accent-light)] text-[var(--accent)]',
  billing: 'bg-[var(--bg)] text-[var(--slate)]',
  admin: 'bg-[var(--navy)] text-white',
};

export function ToolCard({ tool }: { tool: ToolCardData }) {
  const iconClasses = ICON_COLOR_CLASSES[tool.slug] ?? 'bg-[var(--accent-light)] text-[var(--accent)]';

  const content = (
    <Card
      className={
        tool.accessible
          ? 'group flex h-full min-h-[170px] flex-col p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-slate-200/70'
          : 'flex h-full min-h-[170px] flex-col p-7 opacity-60'
      }
    >
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-200 ${tool.accessible ? `${iconClasses} group-hover:scale-105` : 'bg-[var(--bg)] text-[var(--muted)]'}`}
      >
        <ToolIcon slug={tool.slug} className="h-5 w-5" aria-hidden="true" />
      </div>
      <CardTitle>{tool.displayName}</CardTitle>
      {tool.description && <CardDescription className="mt-1">{tool.description}</CardDescription>}

      {tool.accessible ? (
        <div className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-[var(--accent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Open
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      ) : (
        <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-[var(--muted)]">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Not available for your role
        </p>
      )}
    </Card>
  );

  if (!tool.accessible) {
    return content;
  }

  return (
    <form action={launchToolAction.bind(null, tool.slug)} className="h-full text-left">
      <button type="submit" className="block h-full w-full cursor-pointer text-left">
        {content}
      </button>
    </form>
  );
}
