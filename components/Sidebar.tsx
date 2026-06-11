'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import clsx from 'clsx';
import { useUIStore, hydrateSidebarFromStorage } from '@/lib/store';
import { NAV_ITEMS, DOCS_ITEM } from '@/lib/nav';

/* ─── Item groups ─────────────────────────────────────── */
const EXCLUDED_FROM_MAIN = new Set(['/data-sources', '/data-editor', '/contact']);
const MAIN_ITEMS = NAV_ITEMS.filter((i) => i.implemented && !EXCLUDED_FROM_MAIN.has(i.href));
const DATA_ITEMS = NAV_ITEMS.filter(
  (i) => i.implemented && (i.href === '/data-sources' || i.href === '/data-editor'),
);
const CONTACT_ITEM = NAV_ITEMS.find((i) => i.href === '/contact')!;

/* ─── Section label ────────────────────────────────────── */
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed)
    return <div className="mx-auto my-2 h-px w-7 rounded-full bg-white/10" />;
  return (
    <p
      className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-white/25"
      style={{ fontFamily: 'var(--font-label)' }}
    >
      {label}
    </p>
  );
}

/* ─── NavLink ──────────────────────────────────────────── */
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
      {/* Left accent bar for active state */}
      {active && !collapsed && (
        <span className="pointer-events-none absolute inset-y-[5px] left-0 w-[3px] rounded-r-full bg-blue-400/90" />
      )}

      <Link
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={clsx(
          'group flex items-center rounded-xl text-[13px] font-medium transition-all duration-150',
          collapsed ? 'h-10 w-10 justify-center mx-auto' : 'gap-2.5 px-3 py-2',
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
        {!collapsed && (
          <span className="truncate leading-snug">{item.label}</span>
        )}
      </Link>
    </div>
  );
}

/* ─── SidebarContent ───────────────────────────────────── */
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

      {/* ── Logo ── */}
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
            <p className="truncate text-[10.5px] text-white/35 mt-px" style={{ fontFamily: 'var(--font-label)' }}>
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

      {/* ── Main nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
        <SectionLabel label="Analytics" collapsed={collapsed} />
        <div className="space-y-0.5">
          {MAIN_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <SectionLabel label="Data" collapsed={collapsed} />
        <div className="space-y-0.5">
          {DATA_ITEMS.map((item) => (
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

      {/* ── Footer ── */}
      <div
        className={clsx(
          'shrink-0 border-t px-2 py-3',
          'border-white/[0.07]',
        )}
      >
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

        {/* Collapse toggle */}
        {onClose === undefined && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={clsx(
              'mt-1 flex w-full items-center rounded-xl text-[12px] text-white/30 transition-all duration-150 hover:bg-white/[0.055] hover:text-white/60',
              collapsed ? 'h-10 w-10 justify-center mx-auto' : 'gap-3 px-3 py-2',
            )}
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
            {!collapsed && (
              <span style={{ fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Collapse
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Sidebar (root export) ────────────────────────────── */
export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = !sidebarOpen;

  useEffect(() => {
    hydrateSidebarFromStorage();
  }, []);

  /* Reset mobile drawer on route change — state update during render
     (the React-recommended approach to avoid setState-in-effect) */
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
      {/* Desktop rail */}
      <aside
        data-collapsed={collapsed}
        className="sidebar-shell sticky top-0 hidden h-screen shrink-0 overflow-hidden md:block"
        style={sidebarStyle}
        /* Clicking blank areas on the collapsed rail expands it;
           clicks on nav links/buttons navigate normally. */
        onClick={collapsed ? (e) => {
          const target = e.target as HTMLElement;
          if (target.closest('a') || target.closest('button')) return;
          toggleSidebar();
        } : undefined}
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
