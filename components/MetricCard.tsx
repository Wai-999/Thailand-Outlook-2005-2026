'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import type { IndicatorSeries } from '@/lib/types';
import { latestPoint, yoyChange, formatValue } from '@/lib/data';
import { loadThresholds, isBreach, type ThresholdConfig } from '@/lib/thresholds';
import SourceBadge from './SourceBadge';
import DataFreshnessBadge from './DataFreshnessBadge';

/**
 * The core "headline number" card: value, unit, period-over-period
 * change, and where it came from -- always visible together so a
 * number is never shown without its provenance.
 *
 * When an indicator has a matching threshold config, an amber border
 * and warning icon appear on breach (SPEC-07).
 */
export default function MetricCard({
  series,
  label,
  goodDirection = 'up',
  reliability = 'secondary',
}: {
  series: IndicatorSeries;
  /** Override the displayed label (defaults to the indicator name). */
  label?: string;
  /** Whether a rising value should read as positive ('up') or negative ('down'/'neutral'). */
  goodDirection?: 'up' | 'down' | 'neutral';
  reliability?: 'official' | 'international' | 'secondary' | 'demo';
}) {
  const latest = latestPoint(series);
  const change = yoyChange(series);
  const year = latest?.date.slice(0, 4);

  // ── Threshold alert (SPEC-07) ─────────────────────────────────────────────
  const [thresholdConfig, setThresholdConfig] = useState<ThresholdConfig | null>(null);

  useEffect(() => {
    function syncThreshold() {
      const configs = loadThresholds();
      const match = configs.find((c) => c.code === series.indicatorCode) ?? null;
      setThresholdConfig(match);
    }
    syncThreshold();
    // Re-sync when ThresholdDrawer fires a storage event after saving
    window.addEventListener('storage', syncThreshold);
    return () => window.removeEventListener('storage', syncThreshold);
  }, [series.indicatorCode]);

  const breached =
    thresholdConfig !== null && isBreach(latest?.value ?? null, thresholdConfig);

  // ── Change indicator ──────────────────────────────────────────────────────
  let changeTone = 'text-ink-soft';
  let ChangeIcon = Minus;
  if (change !== null && Math.abs(change) >= 0.05) {
    const rising = change > 0;
    ChangeIcon = rising ? ArrowUpRight : ArrowDownRight;
    const positive = goodDirection === 'neutral' ? null : rising === (goodDirection === 'up');
    changeTone = positive === null ? 'text-ink-muted' : positive ? 'text-success' : 'text-danger';
  }

  return (
    <div
      className={clsx(
        'glass-card flex min-w-0 flex-col gap-3 overflow-hidden p-4 transition-[border-color] sm:p-5',
        breached ? 'border-2 border-amber-400' : '',
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-medium uppercase tracking-wide text-ink-soft">
          {label ?? series.indicatorName}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {breached && (
            <span
              aria-label={`Alert: ${series.indicatorName} has crossed its configured threshold`}
              title={`Alert: value ${thresholdConfig?.direction} ${thresholdConfig?.threshold}${thresholdConfig?.unit ?? ''}`}
              className="inline-flex items-center text-amber-500"
            >
              <AlertTriangle size={13} strokeWidth={2.5} />
            </span>
          )}
          {year && <span className="text-[11px] text-ink-soft">{year}</span>}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink md:text-3xl">
          {latest ? formatValue(latest.value, series.unit) : '—'}
        </span>
        {change !== null && (
          <span className={clsx('inline-flex shrink-0 items-center gap-0.5 text-xs font-medium', changeTone)}>
            <ChangeIcon size={14} strokeWidth={2.25} />
            {Math.abs(change).toFixed(1)}% YoY
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <DataFreshnessBadge series={series} />
        <SourceBadge sourceName={series.sourceName} sourceUrl={series.sourceUrl} reliability={reliability} compact />
      </div>
    </div>
  );
}
