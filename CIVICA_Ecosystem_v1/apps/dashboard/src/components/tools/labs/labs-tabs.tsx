'use client';

import { useState, type ReactNode } from 'react';

export function LabsTabs({
  generalTab,
  gynoTab,
  allTab,
  settingsTab,
}: {
  generalTab: ReactNode;
  gynoTab: ReactNode;
  allTab: ReactNode;
  settingsTab?: ReactNode;
}) {
  const [tab, setTab] = useState<'general' | 'gyno' | 'all' | 'settings'>('all');

  const tabContent = {
    general: generalTab,
    gyno: gynoTab,
    all: allTab,
    settings: settingsTab,
  }[tab];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-[var(--border)]">
        <TabButton active={tab === 'general'} onClick={() => setTab('general')}>
          General
        </TabButton>
        <TabButton active={tab === 'gyno'} onClick={() => setTab('gyno')}>
          Gyno
        </TabButton>
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
          All
        </TabButton>
        {settingsTab && (
          <TabButton active={tab === 'settings'} onClick={() => setTab('settings')}>
            Settings
          </TabButton>
        )}
      </div>
      {tabContent}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-[var(--accent)] text-[var(--navy)]'
          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--navy)]'
      }`}
    >
      {children}
    </button>
  );
}
