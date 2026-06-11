'use client';

/**
 * MobileBottomNav — persistent bottom navigation bar for mobile viewports.
 *
 * Shows on screens below the `md` breakpoint, replacing the hamburger-
 * triggered drawer for the 4 most-visited pages. A "More" button still
 * opens the full sidebar drawer via the existing event bridge.
 *
 * Pure presentation — no data or stats logic.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Factory, Plane, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { openMobileNav } from './Sidebar';

const BOTTOM_ITEMS = [
  { href: '/',                   label: 'Home',    Icon: LayoutDashboard },
  { href: '/macro-outlook',      label: 'Macro',   Icon: TrendingUp      },
  { href: '/sector-intelligence',label: 'Sectors', Icon: Factory         },
  { href: '/tourism-monitor',    label: 'Tourism', Icon: Plane           },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-white/[0.07] md:hidden"
      style={{
        background: 'linear-gradient(0deg, #0a1422 0%, #0f1d2e 100%)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {BOTTOM_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              active ? 'text-blue-300' : 'text-white/40 hover:text-white/70',
            )}
          >
            <Icon
              size={18}
              strokeWidth={active ? 2 : 1.75}
              className={active ? 'text-blue-300' : 'text-white/40'}
            />
            <span style={{ fontFamily: 'var(--font-label)', letterSpacing: '0.04em' }}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* More — opens the existing full sidebar drawer */}
      <button
        onClick={openMobileNav}
        aria-label="All pages"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-white/40 transition-colors hover:text-white/70"
        style={{ fontFamily: 'var(--font-label)', letterSpacing: '0.04em' }}
      >
        <MoreHorizontal size={18} strokeWidth={1.75} className="text-white/40" />
        More
      </button>
    </nav>
  );
}
