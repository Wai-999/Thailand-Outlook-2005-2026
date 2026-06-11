'use client';

import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export type HeatmapIndicator = {
  code: string;
  name: string;
  latestYear: number | null;
};

export type HeatmapSector = {
  sector: string;
  indicators: HeatmapIndicator[];
};

// ── Freshness logic ────────────────────────────────────────────────────────────
type FreshnessLevel = 'current' | 'aging' | 'stale' | 'none';

function freshnessLevel(year: number | null): FreshnessLevel {
  if (year === null) return 'none';
  if (year >= 2024) return 'current';
  if (year >= 2022) return 'aging';
  return 'stale';
}

const FRESHNESS_META: Record<
  FreshnessLevel,
  { bg: string; border: string; label: string; range: string }
> = {
  current: {
    bg: 'rgba(22, 163, 74, 0.80)',
    border: 'rgba(21, 128, 61, 0.90)',
    label: 'Current',
    range: '2024–2025',
  },
  aging: {
    bg: 'rgba(217, 119, 6, 0.80)',
    border: 'rgba(180, 83, 9, 0.90)',
    label: 'Aging',
    range: '2022–2023',
  },
  stale: {
    bg: 'rgba(220, 38, 38, 0.80)',
    border: 'rgba(185, 28, 28, 0.90)',
    label: 'Stale',
    range: '≤ 2021',
  },
  none: {
    bg: 'rgba(156, 163, 175, 0.30)',
    border: 'rgba(156, 163, 175, 0.50)',
    label: 'No data',
    range: '—',
  },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function LegendSwatch({ level }: { level: FreshnessLevel }) {
  const meta = FRESHNESS_META[level];
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
      <span
        aria-hidden
        className="inline-block h-3 w-3 shrink-0 rounded-sm"
        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
      />
      <span>
        <span className="font-medium text-ink">{meta.label}</span>{' '}
        <span className="text-ink-soft">({meta.range})</span>
      </span>
    </span>
  );
}

function Cell({
  indicator,
  onHover,
  onLeave,
}: {
  indicator: HeatmapIndicator;
  onHover: (ind: HeatmapIndicator) => void;
  onLeave: () => void;
}) {
  const level = freshnessLevel(indicator.latestYear);
  const meta = FRESHNESS_META[level];
  return (
    <span
      role="img"
      aria-label={`${indicator.name}: ${indicator.latestYear ?? 'no data'}`}
      onMouseEnter={() => onHover(indicator)}
      onMouseLeave={onLeave}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
      className="inline-block h-6 w-6 cursor-default rounded-sm transition-[filter] duration-100 hover:brightness-110"
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * FreshnessHeatmap — a CSS-grid heatmap showing how current each indicator is.
 * Each colored cell represents one indicator; colour encodes the most recent
 * non-null year in its data. Grouped by sector; hover a cell for details.
 */
export default function FreshnessHeatmap({ data }: { data: HeatmapSector[] }) {
  const [active, setActive] = useState<HeatmapIndicator | null>(null);

  // Summary counts for the legend sub-header
  const total = data.reduce((n, s) => n + s.indicators.length, 0);
  const currentCount = data
    .flatMap((s) => s.indicators)
    .filter((i) => freshnessLevel(i.latestYear) === 'current').length;

  return (
    <div>
      {/* ── Legend ───────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {(['current', 'aging', 'stale', 'none'] as FreshnessLevel[]).map((l) => (
          <LegendSwatch key={l} level={l} />
        ))}
      </div>

      {/* ── Hover info bar ───────────────────────────────────────── */}
      <div
        className={`mb-4 rounded-lg border px-3 py-2 text-xs transition-colors ${
          active
            ? 'border-[var(--glass-border)] bg-surface-strong text-ink'
            : 'border-transparent bg-transparent text-ink-soft'
        }`}
        aria-live="polite"
      >
        {active ? (
          <>
            <span className="font-medium">{active.name}</span>
            <span className="mx-1.5 text-ink-soft">·</span>
            <span
              style={{ color: FRESHNESS_META[freshnessLevel(active.latestYear)].bg }}
              className="font-semibold"
            >
              {FRESHNESS_META[freshnessLevel(active.latestYear)].label}
            </span>
            <span className="mx-1.5 text-ink-soft">·</span>
            <span>Latest year: {active.latestYear ?? 'no data'}</span>
          </>
        ) : (
          `Hover a cell to see indicator details · ${currentCount} of ${total} indicators have 2024–2025 data`
        )}
      </div>

      {/* ── Sector rows ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {data.map(({ sector, indicators }) => (
          <div key={sector} className="flex items-start gap-3">
            {/* Sector label */}
            <p
              className="w-44 shrink-0 pt-0.5 text-right text-[11px] leading-tight text-ink-muted md:w-52"
              title={sector}
            >
              {/* Strip "Derived — " prefix to keep labels short */}
              {sector.replace(/^Derived\s*—\s*/i, 'Derived · ')}
            </p>

            {/* Cells */}
            <div className="flex flex-1 flex-wrap gap-1">
              {indicators.map((ind) => (
                <Cell
                  key={ind.code}
                  indicator={ind}
                  onHover={setActive}
                  onLeave={() => setActive(null)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
