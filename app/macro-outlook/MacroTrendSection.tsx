'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import RangeChart from '@/components/RangeChart';
import DataFreshnessBadge from '@/components/DataFreshnessBadge';
import { ChartExportWrapper } from '@/components/ChartExportControls';
import { ols } from '@/lib/stats';
import { formatValue } from '@/lib/data';
import { PARAM, encodeRange, decodeRange } from '@/lib/urlState';
import type { IndicatorSeries } from '@/lib/types';

/** Build a trend-line series + OLS fit from a set of GDP points. */
function buildTrend(base: IndicatorSeries): {
  trendSeries: IndicatorSeries;
  fit: NonNullable<ReturnType<typeof ols>>;
} | null {
  const xs = base.points.map((_, i) => i);
  const ys = base.points.map((p) => p.value);
  const fit = ols(xs, ys);
  if (!fit) return null;
  return {
    fit,
    trendSeries: {
      ...base,
      indicatorCode: `${base.indicatorCode}__trend`,
      indicatorName: 'Linear trend (selected range)',
      isDemo: true,
      points: base.points.map((p, i) => ({ date: p.date, value: fit.predict(i) })),
    },
  };
}

/**
 * The "above/below trend" section of Macro Outlook.
 *
 * Lives in a client component so the drag-select range on the chart can
 * simultaneously refit the OLS trend, update the stats card, and write
 * the selected range into the URL (SPEC-10 deep-link support).
 */
export default function MacroTrendSection({
  gdpGrowth,
}: {
  gdpGrowth: IndicatorSeries;
}) {
  // ── URL-synced range state (SPEC-10) ───────────────────────────────────────
  const router = useRouter();
  const searchParams = useSearchParams();
  const { start: initialStart, end: initialEnd } = decodeRange(searchParams);

  const [rangeStart, setRangeStart] = useState<string | null>(initialStart);
  const [rangeEnd, setRangeEnd] = useState<string | null>(initialEnd);

  const isFiltered = !!(rangeStart && rangeEnd);

  const handleRangeChange = useCallback(
    (start: string | null, end: string | null) => {
      setRangeStart(start);
      setRangeEnd(end);

      // Push range into URL so it survives a share / page refresh
      const next = new URLSearchParams(searchParams.toString());
      encodeRange(next, start, end);
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Filtered GDP series — recomputed only when range changes
  const filteredSeries: IndicatorSeries = useMemo(
    () => ({
      ...gdpGrowth,
      points:
        rangeStart && rangeEnd
          ? gdpGrowth.points.filter((p) => p.date >= rangeStart && p.date <= rangeEnd)
          : gdpGrowth.points,
    }),
    [gdpGrowth, rangeStart, rangeEnd],
  );

  // OLS fit on the filtered (or full) data
  const result = useMemo(() => buildTrend(filteredSeries), [filteredSeries]);

  // Stats for the "Show the work" panel
  const latestGrowth = filteredSeries.points.at(-1);
  const latestIndex = filteredSeries.points.length - 1;
  const trendAtLatest = result?.fit.predict(latestIndex);
  const gap =
    latestGrowth !== undefined && trendAtLatest !== undefined
      ? latestGrowth.value - trendAtLatest
      : null;

  // Series fed to RangeChart — both filtered to the same window so the
  // internal zoom and the pre-filtered data stay in sync.
  const chartSeries: IndicatorSeries[] = result
    ? [
        { ...filteredSeries, indicatorName: gdpGrowth.indicatorName },
        result.trendSeries,
      ]
    : [{ ...filteredSeries, indicatorName: gdpGrowth.indicatorName }];

  const chartSubtitle = isFiltered
    ? `Trend refitted to ${rangeStart?.slice(0, 4)}–${rangeEnd?.slice(0, 4)} · drag chart to adjust selection`
    : `A simple OLS fit through every year in the sample — the straight line is the 'expected' path, not a forecast`;

  const statsSubtitle = isFiltered
    ? `OLS fit for ${rangeStart?.slice(0, 4)}–${rangeEnd?.slice(0, 4)} sub-period`
    : `Exactly how the trend line was fitted`;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_minmax(0,320px)]">
      {/* ── Trend chart ─────────────────────────────────────────────── */}
      <GlassCard
        title="Real GDP growth vs. its own long-run trend line"
        subtitle={chartSubtitle}
      >
        <ChartExportWrapper filename="macro-gdp-trend">
          <RangeChart
            series={chartSeries}
            variant="line"
            onRangeChange={handleRangeChange}
          />
        </ChartExportWrapper>
        <DataFreshnessBadge series={gdpGrowth} />
      </GlassCard>

      {/* ── Stats panel ─────────────────────────────────────────────── */}
      <GlassCard title="Show the work" subtitle={statsSubtitle}>
        {result && latestGrowth && trendAtLatest !== undefined && gap !== null ? (
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
            {isFiltered && (
              <div className="rounded-md bg-[var(--primary-soft)] px-2.5 py-1.5 text-xs text-primary">
                Fit updated for {rangeStart?.slice(0, 4)}–{rangeEnd?.slice(0, 4)}.{' '}
                <button
                  onClick={() => handleRangeChange(null, null)}
                  className="underline underline-offset-2 opacity-80 hover:opacity-100"
                >
                  Reset to full sample
                </button>
              </div>
            )}
            <p>
              <span className="font-label font-semibold text-ink">Fitted line: </span>
              growth ≈ {result.fit.intercept.toFixed(2)} + {result.fit.slope.toFixed(3)} ×
              (year index)
            </p>
            <p>
              <span className="font-label font-semibold text-ink">Fit quality (R²): </span>
              {result.fit.rSquared.toFixed(2)} &mdash;{' '}
              {result.fit.rSquared < 0.15
                ? 'low, meaning year-to-year swings dominate over any steady drift'
                : result.fit.rSquared < 0.4
                  ? 'modest, meaning the trend explains only part of the year-to-year movement'
                  : 'fairly strong for a macro growth series'}
              .
            </p>
            <p>
              <span className="font-label font-semibold text-ink">Latest reading: </span>
              {formatValue(latestGrowth.value, gdpGrowth.unit ?? '')} vs. a trend-line
              expectation of {formatValue(trendAtLatest, gdpGrowth.unit ?? '')} for the same
              year &mdash; that&rsquo;s{' '}
              <strong className={gap >= 0 ? 'text-success' : 'text-danger'}>
                {Math.abs(gap).toFixed(1)} percentage points {gap >= 0 ? 'above' : 'below'}
              </strong>{' '}
              the line.
            </p>
            <p className="text-xs text-ink-soft">
              <strong className="text-ink-muted">Assumptions &amp; limitations:</strong> a
              straight line is the simplest possible trend model &mdash; it cannot capture
              cycles, structural breaks (like the 2020 shock visible in the chart), or policy
              changes. Treat the gap above as a rough compass heading, not a verdict on whether
              the economy is &ldquo;doing well.&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Not enough data to fit a trend line
            {isFiltered ? ' — try a wider selection.' : '.'}
          </p>
        )}
      </GlassCard>
    </div>
  );
}
