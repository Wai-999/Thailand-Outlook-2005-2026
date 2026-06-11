'use client';

import { useState, useId, useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from 'recharts';
import type { IndicatorSeries } from '@/lib/types';
import { formatValue } from '@/lib/data';

const SERIES_COLORS = [
  '#2563eb', // primary blue
  '#14b8a6', // secondary teal
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#16a34a', // green
  '#f59e0b', // amber
];

function formatTick(date: string) {
  if (/^\d{4}$/.test(date)) return date;
  const [y, m] = date.split('-');
  if (!m) return y;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${monthNames[Number(m) - 1] ?? m} '${y.slice(2)}`;
}

type ChartDatum = { date: string; [key: string]: string | number | null };

function mergeSeries(seriesList: IndicatorSeries[]): ChartDatum[] {
  const byDate = new Map<string, ChartDatum>();
  seriesList.forEach((s) => {
    s.points.forEach((p) => {
      const row: ChartDatum = byDate.get(p.date) ?? { date: p.date };
      row[s.indicatorName] = p.value;
      byDate.set(p.date, row);
    });
  });
  return Array.from(byDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
}

function RcTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg border border-[var(--glass-border)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 text-ink-muted">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}:{' '}
          <span className="font-medium text-ink">{formatValue(entry.value, unit ?? '')}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * RangeChart — a drop-in replacement for TimeSeriesChart that adds
 * interactive date-range selection via Recharts ReferenceArea + mouse events.
 *
 * Drag on the chart to select a date range. The chart zooms to that window
 * and shows a "Show full range" pill to reset. An optional `onRangeChange`
 * callback lets parent components respond to the committed range (e.g. to
 * recompute stats panels).
 */
export default function RangeChart({
  series,
  height = 280,
  variant,
  yDomain,
  colors,
  onRangeChange,
}: {
  series: IndicatorSeries | IndicatorSeries[];
  height?: number;
  variant?: 'area' | 'line';
  yDomain?: [number | 'auto', number | 'auto'];
  /** Override per-series colors. Index 0 = first series, etc. Falls back to SERIES_COLORS. */
  colors?: string[];
  /** Called with (start, end) when the user commits a drag selection, or (null, null) on reset. */
  onRangeChange?: (startDate: string | null, endDate: string | null) => void;
}) {
  // Stable unique ID for gradient — useId() is SSR-safe and unique per instance.
  const uid = useId();
  const gradId = `rc-g-${uid.replace(/:/g, '')}`;

  // Drag-in-progress tracking
  const [refLeft, setRefLeft] = useState('');
  const [refRight, setRefRight] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Committed zoom range (null = show all)
  const [zoomStart, setZoomStart] = useState<string | null>(null);
  const [zoomEnd, setZoomEnd] = useState<string | null>(null);

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const list = Array.isArray(series) ? series : [series];
  const allData = mergeSeries(list);

  // Normalise so lo ≤ hi regardless of drag direction
  const lo = zoomStart && zoomEnd ? (zoomStart <= zoomEnd ? zoomStart : zoomEnd) : null;
  const hi = zoomStart && zoomEnd ? (zoomStart <= zoomEnd ? zoomEnd : zoomStart) : null;

  const data = lo && hi ? allData.filter((d) => d.date >= lo && d.date <= hi) : allData;

  const unit = list[0]?.unit;
  const mode = variant ?? (list.length === 1 ? 'area' : 'line');
  const hasDemo = list.some((s) => s.isDemo);
  const isZoomed = !!(lo && hi);

  const axisProps = {
    stroke: 'var(--text-soft)',
    tick: { fill: 'var(--text-soft)', fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: 'var(--glass-border)' },
  };

  // ── Event handlers ────────────────────────────────────────────────────────
  // Recharts passes CategoricalChartState as the first arg; activeLabel holds
  // the x-axis key (date string) at the mouse position.
  function handleMouseDown(e: { activeLabel?: string | number }) {
    const label = String(e?.activeLabel ?? '');
    if (label) {
      setRefLeft(label);
      setRefRight('');
      setIsDragging(true);
    }
  }

  function handleMouseMove(e: { activeLabel?: string | number }) {
    if (!isDragging) return;
    const label = String(e?.activeLabel ?? '');
    if (label) setRefRight(label);
  }

  function handleMouseUp() {
    if (isDragging && refLeft && refRight && refLeft !== refRight) {
      const start = refLeft <= refRight ? refLeft : refRight;
      const end = refLeft <= refRight ? refRight : refLeft;
      setZoomStart(start);
      setZoomEnd(end);
      onRangeChange?.(start, end);
    }
    setIsDragging(false);
    setRefLeft('');
    setRefRight('');
  }

  function handleReset() {
    setZoomStart(null);
    setZoomEnd(null);
    setRefLeft('');
    setRefRight('');
    setIsDragging(false);
    onRangeChange?.(null, null);
  }

  if (list.length === 0) return null;

  // Shared props for both AreaChart and LineChart
  const chartProps = {
    data,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    margin: { top: 12, right: 12, left: 0, bottom: 0 },
  };

  // ReferenceArea shown while the user is actively dragging
  const dragArea =
    isDragging && refLeft && refRight && refLeft !== refRight ? (
      <ReferenceArea
        x1={refLeft}
        x2={refRight}
        fill="#2563eb"
        fillOpacity={0.1}
        stroke="#2563eb"
        strokeOpacity={0.4}
        strokeWidth={1}
      />
    ) : null;

  return (
    <div>
      {/* ── Chart ─────────────────────────────────────────────────────── */}
      <div
        style={{ width: '100%', height }}
        className={`relative select-none ${isDragging ? 'cursor-col-resize' : 'cursor-crosshair'}`}
      >
        {hasDemo && (
          <span className="absolute right-1 top-0 z-10 rounded-full bg-[var(--secondary)]/15 px-2 py-0.5 text-[10px] font-medium text-secondary">
            Modeled estimate
          </span>
        )}

        {!isHydrated ? (
          <div aria-hidden className="h-full w-full rounded-[var(--radius-md)] bg-white/25" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
            {mode === 'area' ? (
              <AreaChart {...chartProps}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors?.[0] ?? SERIES_COLORS[0]} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={colors?.[0] ?? SERIES_COLORS[0]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--glass-border)" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatTick} {...axisProps} minTickGap={28} />
                <YAxis
                  {...axisProps}
                  width={56}
                  domain={yDomain ?? ['auto', 'auto']}
                  tickFormatter={(v: number) => formatValue(v, unit ?? '')}
                />
                <Tooltip
                  content={<RcTooltip unit={unit} />}
                  cursor={{ stroke: 'var(--glass-border)', strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey={list[0].indicatorName}
                  stroke={colors?.[0] ?? SERIES_COLORS[0]}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  connectNulls
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
                {dragArea}
              </AreaChart>
            ) : (
              <LineChart {...chartProps}>
                <CartesianGrid stroke="var(--glass-border)" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatTick} {...axisProps} minTickGap={28} />
                <YAxis
                  {...axisProps}
                  width={56}
                  domain={yDomain ?? ['auto', 'auto']}
                  tickFormatter={(v: number) => formatValue(v, unit ?? '')}
                />
                <Tooltip
                  content={<RcTooltip unit={unit} />}
                  cursor={{ stroke: 'var(--glass-border)', strokeDasharray: '3 3' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: 'var(--text-soft)' }}
                  iconType="circle"
                  iconSize={8}
                />
                {list.map((s, i) => (
                  <Line
                    key={s.indicatorCode}
                    type="monotone"
                    dataKey={s.indicatorName}
                    stroke={colors?.[i] ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                ))}
                {dragArea}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Range indicator bar ───────────────────────────────────────── */}
      <div className="mt-2 flex min-h-[18px] items-center justify-between px-1">
        <p className="text-[10px] text-ink-soft">
          {isZoomed
            ? `Showing ${lo?.slice(0, 4)}–${hi?.slice(0, 4)} · drag to reselect`
            : 'Drag on chart to focus a date range'}
        </p>
        {isZoomed && (
          <button
            onClick={handleReset}
            className="rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-[var(--primary)]/20"
          >
            Show full range
          </button>
        )}
      </div>
    </div>
  );
}
