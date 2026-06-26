import { type HTMLAttributes, type ReactNode } from 'react';
import { Card, CardTitle } from '@civica/ui';

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-4 py-2.5">
        <CardTitle className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">{title}</CardTitle>
        {action}
      </div>
      <div>{children}</div>
    </Card>
  );
}

export function PanelRow({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`group border-b border-[var(--border)] px-4 py-2 last:border-b-0 hover:bg-[var(--bg)] ${className}`}
      {...props}
    />
  );
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-2.5 text-xs text-[var(--muted)]">{children}</div>;
}

export function PanelSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">{children}</div>
  );
}

export function PanelRowActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 hidden gap-1.5 group-hover:flex group-focus-within:flex">{children}</div>
  );
}
