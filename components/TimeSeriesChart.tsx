'use client';

import { useSyncExternalStore } from 'react';
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
} from 'recharts';
import type { IndicatorSeries } from '@/lib/types';
import { formatValue } from '@/lib/data';

/** Thaitone palette in plot order — hex values required; SVG attributes don't resolve CSS vars. */
const SERIES_COLORS = [
  '#2563eb',  // primary blue
  '#14b8a6',  // secondary teal
  '#8b5cf6',  // violet
  '#f43f5e',  // rose
  '#16a34a',  // green
  '#f59e0b',  // amber
];

function formatTick(date: string) {
  // Dates come in as 'YYYY' or 'YYYY-MM' or 'YYYY-MM-DD'.
  if (/^\d{4}$/.test(date)) return date;
  const [y, m] = date.split('-');
  if (!m) return y;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[Number(m) - 1] ?? m} '${y.slice(2)}`;
}

type ChartDatum = { date: string; [seriesName: string]: string | number | null };

function mergeSeries(series: IndicatorSeries[]): ChartDatum[] {
  const byDate = new Map<string, ChartDatum>();
  series.forEach((s) => {
    s.points.forEach((p) => {
      const row: ChartDatum = byDate.get(p.date) ?? { date: p.date };
      row[s.indicatorName] = p.value;
      byDate.set(p.date, row);
    });
  });
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function ChartTooltip({
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
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: <span className="font-medium text-ink">{formatValue(entry.value, unit ?? '')}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Renders one or more IndicatorSeries on a shared time axis.
 *
 * Single-series charts render as a soft filled area (good for "the shape
 * of one trend"); multi-series comparisons render as lines (so overlap
 * stays legible). Every chart should sit beside the question it answers --
 * this component only draws the picture, the surrounding page supplies
 * the "why does this matter" framing per the spec's research-question rule.
 */
export default function TimeSeriesChart({
  series,
  height = 280,
  variant,
  yDomain,
}: {
  series: IndicatorSeries | IndicatorSeries[];
  height?: number;
  /** Force 'area' or 'line'; defaults to area for one series, line for many. */
  variant?: 'area' | 'line';
  yDomain?: [number | 'auto', number | 'auto'];
}) {
  const list = Array.isArray(series) ? series : [series];
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (list.length === 0) return null;

  const data = mergeSeries(list);
  const unit = list[0]?.unit;
  const mode = variant ?? (list.length === 1 ? 'area' : 'line');
  const hasDemo = list.some((s) => s.isDemo);

  const axisProps = {
    stroke: 'var(--text-soft)',
    tick: { fill: 'var(--text-soft)', fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: 'var(--glass-border)' },
  };

  return (
    /* Mobile: horizontal scroll so dense charts stay readable on small screens.
       A right-side fade mask signals scrollability without chrome or labels. */
    <div className="relative overflow-x-auto md:overflow-visible">
      <div className="min-w-[400px] md:min-w-0">
    <div style={{ width: '100%', height }} className="relative">
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
            <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tsc-fill-0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_COLORS[0]} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={SERIES_COLORS[0]} stopOpacity={0.02} />
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
              <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: 'var(--glass-border)', strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey={list[0].indicatorName}
                stroke={SERIES_COLORS[0]}
                strokeWidth={2}
                fill="url(#tsc-fill-0)"
                connectNulls
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--glass-border)" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatTick} {...axisProps} minTickGap={28} />
              <YAxis
                {...axisProps}
                width={56}
                domain={yDomain ?? ['auto', 'auto']}
                tickFormatter={(v: number) => formatValue(v, unit ?? '')}
              />
              <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: 'var(--glass-border)', strokeDasharray: '3 3' }} />
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
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          )
          }
        </ResponsiveContainer>
      )}
    </div>
      </div>
      {/* Scroll hint — only visible on mobile when content overflows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/70 to-transparent md:hidden"
      />
    </div>
  );
}
