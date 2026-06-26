'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/patient-portal', label: 'Overview' },
  { href: '/patient-portal/records', label: 'Records' },
  { href: '/patient-portal/messages', label: 'Messages' },
  { href: '/patient-portal/requests', label: 'Requests' },
  { href: '/patient-portal/profile', label: 'Profile' },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-[var(--border)]">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--navy)]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
