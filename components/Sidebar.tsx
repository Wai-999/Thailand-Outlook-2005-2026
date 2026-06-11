'use client';

/**
 * Sidebar — desktop rail + mobile drawer.
 *
 * Nav is split into three labelled groups that match the information
 * architecture overhaul:
 *   Overview   → Command Center
 *   Analysis   → the 9 analytical pages
 *   Reference  → Research Library, Data Sources, Data Editor
 *
 * The footer shows an "Explored X of 12" progress counter that updates
 * via localStorage whenever the user visits a new page.
 *
 * Presentation-only — no data or stats logic.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import clsx from 'clsx';
import { useUIStore, hydrateSidebarFromStorage } from '@/lib/store';
import { NAV_ITEMS, DOCS_ITEM } from '@/lib/nav';
import { markVisited, getProgress, TOTAL_SECTIONS } from '@/lib/exploration';

/* ─── Nav groups ───────────────────────────────────────────────────── */

const OVERVIEW_HREFS  = new Set(['/']);
const REFERENCE_HREFS = new Set(['/research-library', '/data-sources', '/data-editor']);
const EXCLUDED_HREFS  = new Set(['/contact']); // lives in footer only

const OVERVIEW_ITEMS  = NAV_ITEMS.filter((i) => i.implemented && OVERVIEW_HREFS.has(i.href));
const ANALYSIS_ITEMS  = NAV_ITEMS.filter(
  (i) => i.implemented && !OVERVIEW_HREFS.has(i.href) && !REFERENCE_HREFS.has(i.href) && !EXCLUDED_HREFS.has(i.href),
);
const REFERENCE_ITEMS = NAV_ITEMS.filter((i) => i.implemented && REFERENCE_HREFS.has(i.href));
const CONTACT_ITEM    = NAV_ITEMS.find((i) => i.href === '/contact')!;

/* ─── Shared primitives ────────────────────────────────────────────── */

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="mx-auto my-2 h-px w-7 rounded-full bg-white/10" />;
  return (
    <p
      className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-white/25"
      style={{ fontFamily: 'var(--font-label)' }}
    >
      {label}
    </p>
  );
}

function NavLink({
  item,
  collapsed,
  active,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number];
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <div className="relative">
      {active && !collapsed && (
        <span className="pointer-events-none absolute inset-y-[5px] left-0 w-[3px] rounded-r-full bg-blue-400/90" />
      )}
      <Link
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={clsx(
          'group flex items-center rounded-xl text-[13px] font-medium transition-all duration-150',
          collapsed ? 'mx-auto h-10 w-10 justify-center' : 'gap-2.5 px-3 py-2',
          active
            ? 'bg-blue-500/15 text-white'
            : 'text-white/60 hover:bg-white/5 hover:text-white/85',
        )}
      >
        <Icon
          size={15}
          strokeWidth={active ? 2 : 1.75}
          className={clsx(
            'shrink-0 transition-colors',
            active ? 'text-blue-300' : 'text-white/55 group-hover:text-white/80',
          )}
        />
        {!collapsed && <span className="truncate leading-snug">{item.label}</span>}
      </Link>
    </div>
  );
}

/* ─── Progress pill ────────────────────────────────────────────────── */

function ExplorationProgress({ collapsed }: { collapsed: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      setCount(getProgress().count);
    }
    sync();
    window.addEventListener('thailand-outlook:visited-updated', sync);
    return () => window.removeEventListener('thailand-outlook:visited-updated', sync);
  }, []);

  if (collapsed) {
    return (
      <div
        title={`Explored ${count} of ${TOTAL_SECTIONS} sections`}
        className="mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white/30"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {count}
      </div>
    );
  }

  const pct = Math.round((count / TOTAL_SECTIONS) * 100);

  return (
    <div className="mt-2 px-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-white/30" style={{ fontFamily: 'var(--font-label)' }}>
          Explored {count} of {TOTAL_SECTIONS}
        </p>
        <p className="text-[10px] text-white/20">{pct}%</p>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-blue-400/50 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── PageTracker — marks current page visited on mount ───────────── */

function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    markVisited(pathname);
  }, [pathname]);
  return null;
}

/* ─── SidebarContent ───────────────────────────────────────────────── */

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
  onClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        className={clsx(
          'flex shrink-0 items-center gap-3 px-3 py-5',
          collapsed && 'justify-center px-0',
        )}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
          }}
        >
          <span className="text-xs font-bold tracking-tight">TH</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p
              className="truncate text-[13.5px] font-semibold text-white/92"
              style={{ letterSpacing: '-0.02em' }}
            >
              Thailand Outlook
            </p>
            <p
              className="mt-px truncate text-[10.5px] text-white/35"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              Economic Research
            </p>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/8 hover:text-white/70"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Nav groups ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
        {/* GROUP: Overview */}
        <SectionLabel label="Overview" collapsed={collapsed} />
        <div className="space-y-0.5">
          {OVERVIEW_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        {/* GROUP: Analysis */}
        <SectionLabel label="Analysis" collapsed={collapsed} />
        <div className="space-y-0.5">
          {ANALYSIS_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        {/* GROUP: Reference */}
        <SectionLabel label="Reference" collapsed={collapsed} />
        <div className="space-y-0.5">
          {REFERENCE_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className={clsx('shrink-0 border-t px-2 py-3', 'border-white/[0.07]')}>
        <div className="space-y-0.5">
          <NavLink
            item={DOCS_ITEM}
            collapsed={collapsed}
            active={pathname === DOCS_ITEM.href}
            onNavigate={onNavigate}
          />
          <NavLink
            item={CONTACT_ITEM}
            collapsed={collapsed}
            active={pathname === CONTACT_ITEM.href}
            onNavigate={onNavigate}
          />
        </div>

        {/* Exploration progress */}
        <ExplorationProgress collapsed={collapsed} />

        {/* Collapse toggle (desktop only) */}
        {onClose === undefined && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={clsx(
              'mt-2 flex w-full items-center rounded-xl text-[12px] text-white/30 transition-all duration-150 hover:bg-white/[0.055] hover:text-white/60',
              collapsed ? 'mx-auto h-10 w-10 justify-center' : 'gap-3 px-3 py-2',
            )}
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
            {!collapsed && (
              <span
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '10px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Collapse
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Sidebar (root export) ────────────────────────────────────────── */

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = !sidebarOpen;

  useEffect(() => {
    hydrateSidebarFromStorage();
  }, []);

  /* Close mobile drawer on route change */
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  const sidebarStyle = {
    background: 'linear-gradient(175deg, #0f1d2e 0%, #0a1422 100%)',
    borderRight: '1px solid rgba(255,255,255,0.07)',
  };

  return (
    <>
      {/* Track page visits for the progress counter */}
      <PageTracker />

      {/* Desktop rail */}
      <aside
        data-collapsed={collapsed}
        className="sidebar-shell sticky top-0 hidden h-screen shrink-0 overflow-hidden md:block"
        style={sidebarStyle}
        onClick={
          collapsed
            ? (e) => {
                const target = e.target as HTMLElement;
                if (target.closest('a') || target.closest('button')) return;
                toggleSidebar();
              }
            : undefined
        }
      >
        <SidebarContent collapsed={collapsed} onToggle={toggleSidebar} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[rgba(7,18,35,0.55)] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 w-full max-w-[300px] shadow-2xl"
            style={sidebarStyle}
          >
            <SidebarContent
              collapsed={false}
              onToggle={toggleSidebar}
              onNavigate={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <SidebarMobileTriggerBridge onOpen={() => setMobileOpen(true)} />
    </>
  );
}

function SidebarMobileTriggerBridge({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('thailand-outlook:open-mobile-nav', handler);
    return () => window.removeEventListener('thailand-outlook:open-mobile-nav', handler);
  }, [onOpen]);
  return null;
}

export function openMobileNav() {
  window.dispatchEvent(new Event('thailand-outlook:open-mobile-nav'));
}
