'use client';

/**
 * ContinueExploring — contextual "what to read next" footer.
 *
 * Placed at the bottom of every page via app/layout.tsx.
 * Reads the current pathname and shows 3 logically-next pages.
 * Pure presentation — no data or stats logic.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, DOCS_ITEM } from '@/lib/nav';

/** For each route, the 3 most natural "next" destinations. */
const EXPLORATION_MAP: Record<string, [string, string, string]> = {
  '/':                   ['/macro-outlook',      '/sector-intelligence', '/tourism-monitor'],
  '/macro-outlook':      ['/sector-intelligence', '/household-debt',      '/trade-network'],
  '/sector-intelligence':['/tourism-monitor',    '/investment-tracker',  '/macro-outlook'],
  '/province-map':       ['/trade-network',       '/sector-intelligence', '/research-library'],
  '/trade-network':      ['/macro-outlook',       '/investment-tracker',  '/province-map'],
  '/tourism-monitor':    ['/sector-intelligence', '/macro-outlook',       '/forecast-lab'],
  '/household-debt':     ['/macro-outlook',       '/statistical-engine',  '/investment-tracker'],
  '/investment-tracker': ['/trade-network',       '/sector-intelligence', '/forecast-lab'],
  '/statistical-engine': ['/macro-outlook',       '/research-library',    '/forecast-lab'],
  '/forecast-lab':       ['/statistical-engine',  '/macro-outlook',       '/sector-intelligence'],
  '/research-library':   ['/data-sources',        '/macro-outlook',       '/statistical-engine'],
  '/data-sources':       ['/data-editor',         '/research-library',    '/macro-outlook'],
  '/data-editor':        ['/data-sources',         '/research-library',    '/macro-outlook'],
  '/docs':               ['/research-library',     '/macro-outlook',       '/statistical-engine'],
  '/contact':            ['/macro-outlook',        '/research-library',    '/data-sources'],
};

const ALL_ITEMS = [...NAV_ITEMS, DOCS_ITEM];

export default function ContinueExploring() {
  const pathname = usePathname();

  const nextHrefs: string[] = EXPLORATION_MAP[pathname] ?? [
    '/macro-outlook',
    '/sector-intelligence',
    '/research-library',
  ];

  const items = nextHrefs
    .map((href) => ALL_ITEMS.find((i) => i.href === href))
    .filter(Boolean) as (typeof ALL_ITEMS)[number][];

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Continue exploring"
      className="mt-16 border-t border-[var(--glass-border)] pt-8 pb-4"
    >
      <p
        className="mb-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-soft"
        style={{ fontFamily: 'var(--font-label)' }}
      >
        Continue exploring
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--surface)]/40 px-4 py-3.5 transition-all duration-150 hover:border-primary/30 hover:bg-[var(--surface-strong)]"
            >
              <Icon
                size={15}
                strokeWidth={1.75}
                className="shrink-0 text-ink-soft transition-colors group-hover:text-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-ink">{item.label}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">{item.description}</p>
              </div>
              <ArrowRight
                size={13}
                className="shrink-0 text-ink-soft transition-colors group-hover:text-primary"
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
