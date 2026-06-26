import { LayoutGrid } from 'lucide-react';
import { Card } from '@civica/ui';
import { ToolCard } from '@/components/dashboard/tool-card';
import type { ToolCardData } from '@/lib/tools/registry';

export function ToolGrid({ tools }: { tools: ToolCardData[] }) {
  if (tools.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-12 text-center">
        <LayoutGrid className="h-8 w-8 text-[var(--muted)]" aria-hidden="true" />
        <p className="text-sm text-[var(--text-secondary)]">No tools are currently enabled.</p>
      </Card>
    );
  }

  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}
