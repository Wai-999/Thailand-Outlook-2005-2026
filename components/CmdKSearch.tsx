'use client';

/**
 * CmdKSearch — Cmd+K / Ctrl+K quick-navigation modal.
 *
 * Mounts once in app/layout.tsx. Listens globally for the keyboard
 * shortcut, renders a spotlight-style modal over a backdrop, and
 * navigates on Enter or click. No data or stats logic.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Command } from 'lucide-react';
import { NAV_ITEMS, DOCS_ITEM } from '@/lib/nav';

const ALL_ITEMS = [
  ...NAV_ITEMS.filter((i) => i.implemented),
  DOCS_ITEM,
];

/** Groups for the three sidebar sections — used as section headings in results */
const GROUP_LABELS: Record<string, string> = {
  '/': 'Overview',
  '/macro-outlook': 'Analysis',
  '/sector-intelligence': 'Analysis',
  '/province-map': 'Analysis',
  '/trade-network': 'Analysis',
  '/tourism-monitor': 'Analysis',
  '/household-debt': 'Analysis',
  '/investment-tracker': 'Analysis',
  '/statistical-engine': 'Analysis',
  '/forecast-lab': 'Analysis',
  '/research-library': 'Reference',
  '/data-sources': 'Reference',
  '/data-editor': 'Reference',
  '/docs': 'Reference',
  '/contact': 'Reference',
};

export default function CmdKSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /* ── Filter items by query ─────────────────────────────────────────── */
  const filtered = query.trim()
    ? ALL_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()),
      )
    : ALL_ITEMS;

  /* ── Global keyboard listener ──────────────────────────────────────── */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ── Reset state + focus when opening ─────────────────────────────── */
  useEffect(() => {
    if (open) {
      // Defer so the modal has rendered before we mutate its state
      const t = setTimeout(() => {
        setQuery('');
        setActiveIdx(0);
        inputRef.current?.focus();
      }, 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* ── Navigation helper ─────────────────────────────────────────────── */
  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  // Clamp activeIdx to the current filtered list length so changing the
  // query never leaves the cursor pointing at a non-existent item.
  const safeIdx = Math.min(activeIdx, Math.max(0, filtered.length - 1));

  /* ── Keyboard navigation inside the modal ──────────────────────────── */
  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (filtered[safeIdx]) navigate(filtered[safeIdx].href);
        break;
    }
  }

  if (!open) return null;

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4"
      role="dialog"
      aria-modal
      aria-label="Quick navigation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(7,18,35,0.55)] backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--surface)] shadow-[var(--shadow-glass-lg)]"
        style={{ background: 'rgba(15,29,47,0.96)', backdropFilter: 'blur(24px)' }}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-soft" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-soft outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="shrink-0 rounded border border-[var(--glass-border)] bg-[var(--surface-strong)] px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-[340px] overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-soft">
              No pages match &ldquo;{query}&rdquo;.
            </p>
          )}

          {filtered.map((item, idx) => {
            const Icon = item.icon;
            const group = GROUP_LABELS[item.href] ?? '';
            const prevGroup = idx > 0 ? GROUP_LABELS[filtered[idx - 1].href] ?? '' : '';
            const showGroupHeader = !query && group !== prevGroup;

            return (
              <div key={item.href}>
                {/* Group separator */}
                {showGroupHeader && (
                  <p className="mt-2 mb-0.5 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft/60">
                    {group}
                  </p>
                )}
                <button
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={[
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    idx === safeIdx
                      ? 'bg-[rgba(37,99,235,0.12)] text-ink'
                      : 'text-ink-muted hover:bg-[var(--surface-strong)]',
                  ].join(' ')}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.75}
                    className={idx === safeIdx ? 'shrink-0 text-primary' : 'shrink-0 text-ink-soft'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className="mt-0.5 truncate text-xs leading-snug text-ink-soft">
                      {item.description}
                    </p>
                  </div>
                  {idx === safeIdx && (
                    <CornerDownLeft size={12} className="shrink-0 text-ink-soft" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-[var(--glass-border)] px-4 py-2">
          <span className="text-[10px] text-ink-soft">↑↓&nbsp;navigate</span>
          <span className="text-[10px] text-ink-soft">↵&nbsp;open</span>
          <span className="text-[10px] text-ink-soft">esc&nbsp;close</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-ink-soft/50">
            <Command size={9} />K
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Exported so TopBar can open the modal via a button click
 * (fires the same synthetic keyboard event the listener catches).
 */
export function openCmdK() {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
  );
}
