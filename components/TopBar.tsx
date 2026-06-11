'use client';

/**
 * TopBar — sticky header with breadcrumbs, page title, and quick-nav trigger.
 *
 * Changes from the UI/UX overhaul:
 *  - Added breadcrumb trail (Home > Page name) for non-root pages
 *  - Added Cmd+K search button on the right side
 *
 * Pure presentation — no data or stats logic.
 */

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles, Search, Command } from 'lucide-react';
import Link from 'next/link';
import { NAV_ITEMS, DOCS_ITEM } from '@/lib/nav';
import { openMobileNav } from './Sidebar';
import { openCmdK } from './CmdKSearch';

function currentNavItem(pathname: string) {
  return (
    NAV_ITEMS.find((item) => item.href === pathname) ||
    (pathname === DOCS_ITEM.href ? DOCS_ITEM : undefined)
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const current = currentNavItem(pathname);
  const isHome = pathname === '/';

  const todayLabel = useSyncExternalStore(
    () => () => {},
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    () => '',
  );

  return (
    <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-glass-border px-4 py-3 md:px-8">
      {/* Mobile hamburger — hidden once MobileBottomNav is mounted */}
      <button
        onClick={openMobileNav}
        aria-label="Open navigation"
        className="rounded-[var(--radius-sm)] p-2 text-ink-muted hover:bg-surface-strong hover:text-ink md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Page title + breadcrumb */}
      <div className="min-w-0 flex-1">
        {/* Breadcrumb — only shown on non-home pages */}
        {!isHome && (
          <nav aria-label="Breadcrumb" className="mb-0.5 flex items-center gap-1.5">
            <Link
              href="/"
              className="text-[10px] font-medium text-ink-soft transition-colors hover:text-ink"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              Command Center
            </Link>
            <span className="text-[10px] text-ink-soft/40" aria-hidden>›</span>
            <span
              className="text-[10px] font-semibold text-primary"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              {current?.label ?? pathname}
            </span>
          </nav>
        )}

        {/* Page title row */}
        <div className="flex flex-wrap items-center gap-2">
          {isHome && (
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
              Live route
            </span>
          )}
          <p className="truncate text-sm font-semibold text-ink md:text-base">
            {current?.label ?? 'Thailand Outlook'}
          </p>
        </div>
        {current?.description && (
          <p className="hidden truncate text-xs text-ink-soft sm:block">{current.description}</p>
        )}
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Annual research snapshot badge */}
        <span className="glass-card hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-secondary lg:flex">
          <Sparkles size={14} strokeWidth={2} />
          Annual research snapshot
        </span>

        {/* Date badge */}
        {todayLabel && (
          <span className="hidden rounded-full border border-glass-border bg-white/55 px-3 py-1.5 text-xs font-medium text-ink-soft sm:inline-flex">
            {todayLabel}
          </span>
        )}

        {/* Cmd+K quick-nav button */}
        <button
          onClick={openCmdK}
          aria-label="Quick navigation (⌘K)"
          title="Quick navigation (⌘K)"
          className="hidden items-center gap-1.5 rounded-[var(--radius-md)] border border-glass-border bg-surface/60 px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-primary/30 hover:text-ink md:flex"
        >
          <Search size={12} strokeWidth={2} />
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '11px' }}>Search</span>
          <span className="ml-0.5 flex items-center gap-0.5 rounded border border-glass-border bg-surface-strong px-1 py-px font-mono text-[9px] text-ink-soft/60">
            <Command size={8} />K
          </span>
        </button>
      </div>
    </header>
  );
}
