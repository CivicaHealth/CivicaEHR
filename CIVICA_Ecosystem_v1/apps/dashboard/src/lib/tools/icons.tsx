import {
  FileText,
  Package,
  CalendarDays,
  HeartPulse,
  Receipt,
  ShieldCheck,
  LayoutGrid,
  type LucideProps,
} from 'lucide-react';

const TOOL_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  emr: FileText,
  inventory: Package,
  roster: CalendarDays,
  'patient-portal': HeartPulse,
  billing: Receipt,
  admin: ShieldCheck,
};

export function ToolIcon({ slug, ...props }: { slug: string } & LucideProps) {
  const Icon = TOOL_ICONS[slug] ?? LayoutGrid;
  return <Icon {...props} />;
}
