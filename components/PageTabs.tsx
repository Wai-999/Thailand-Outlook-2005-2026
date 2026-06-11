'use client';

import { useState } from 'react';

export type TabDef = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export default function PageTabs({
  tabs,
  defaultTab,
}: {
  tabs: TabDef[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--glass-border)]">
        <nav className="-mb-px flex gap-1 overflow-x-auto pb-0" aria-label="Page sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              aria-selected={active === tab.id}
              role="tab"
              className={[
                'shrink-0 rounded-t-lg border-b-2 px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
                active === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-ink-soft hover:border-ink-soft/40 hover:text-ink',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10" role="tabpanel">
        {current?.content}
      </div>
    </div>
  );
}
