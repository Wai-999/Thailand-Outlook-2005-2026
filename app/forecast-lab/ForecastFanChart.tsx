'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import GlassCard from '@/components/GlassCard';
import SourceBadge from '@/components/SourceBadge';
import type { IndicatorSeries } from '@/lib/types';
import { formatValue } from '@/lib/data';

// ── Constants ──────────────────────────────────────────────────────────────────
const PESS_COLOR = '#ef4444';
const OPT_COLOR = '#16a34a';
const ACTUAL_COLOR = '#2563eb';

// ── Types ──────────────────────────────────────────────────────────────────────
/**
 * Serializable subset of OLSResult — the predict() function closure is stripped
 * so this type can safely cross the server→client component boundary as a prop.
 */
export type SerializableModel = {
  slope: number;
  intercept: number;
  rSquared: number;
  n: number;
};

export type SerializableProjection = {
  forecast: { date: string; value: number }[];
  model: SerializableModel | null;
};

type FanDatum = {
  date: string;
  actual: number | null;
  /** Transparent stacking base — positions the bottom of the pessimistic band. */
  pess_floor: number | null;
  /** Height of the pessimistic band (baseline → pessimistic). */
  pess_band: number | null;
  /** Height of the optimistic band (baseline → optimistic). */
  opt_band: number | null;
  baseline_fcast: number | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function yearStr(date: string): string {
  return date.slice(0, 4);
}

function formatTick(date: string): string {
  if (/^\d{4}$/.test(date)) return date;
  const [y, m] = date.split('-');
  if (!m) return y ?? date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m) - 1] ?? m} '${y.slice(2)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function FanTooltip({
  active,
  payload,
  label,
  unit,
  pessOffset,
  optOffset,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number | null }[];
  label?: string;
  unit: string;
  pessOffset: number;
  optOffset: number;
}) {
  if (!active || !payload?.length) return null;
  const actualVal = payload.find((p) => p.dataKey === 'actual')?.value ?? null;
  const baseVal = payload.find((p) => p.dataKey === 'baseline_fcast')?.value ?? null;
  return (
    <div className="glass-strong rounded-lg border border-[var(--glass-border)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-ink">{String(label).slice(0, 4)}</p>
      {actualVal !== null && (
        <p className="text-ink-muted">
          Actual: <span className="font-medium text-ink">{formatValue(actualVal, unit)}</span>
        </p>
      )}
      {baseVal !== null && (
        <>
          <p className="text-ink-muted">
            Baseline:{' '}
            <span className="font-medium text-ink">{formatValue(baseVal, unit)}</span>
          </p>
          <p style={{ color: PESS_COLOR }}>
            Pessimistic:{' '}
            <span className="font-medium">{formatValue(baseVal + pessOffset, unit)}</span>
          </p>
          <p style={{ color: OPT_COLOR }}>
            Optimistic:{' '}
            <span className="font-medium">{formatValue(baseVal + optOffset, unit)}</span>
          </p>
        </>
      )}
    </div>
  );
}

function LegendItem({
  color,
  type,
  label,
}: {
  color: string;
  type: 'solid' | 'dashed' | 'band';
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
      {type === 'band' ? (
        <span
          className="inline-block h-3 w-5 shrink-0 rounded-sm"
          style={{ background: color, opacity: 0.4 }}
        />
      ) : (
        <span
          className="inline-block h-0 w-5 shrink-0 border-t-2"
          style={{
            borderColor: color,
            borderStyle: type === 'dashed' ? 'dashed' : 'solid',
          }}
        />
      )}
      {label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * ForecastFanChart — renders actual history as a solid line and carries the
 * forecast forward as a 3-scenario fan using stacked Recharts Area components.
 *
 * Stack layout (same stackId, all forecast-only):
 *   pess_floor  (transparent)  — positions the bottom edge of the fan
 *   pess_band   (red, low α)   — from pessimistic bound up to baseline
 *   opt_band    (green, low α) — from baseline up to optimistic bound
 *
 * The user adjusts pessimistic and optimistic offsets via range sliders; the
 * fan and Y-axis domain update in real time.
 */
export default function ForecastFanChart({
  series,
  projection,
  title,
  subtitle,
  height = 300,
}: {
  series: IndicatorSeries;
  projection: SerializableProjection;
  title: string;
  subtitle?: string;
  height?: number;
}) {
  const [pessOffset, setPessOffset] = useState(-1.5); // pp below baseline, always negative
  const [optOffset, setOptOffset] = useState(1.0);    // pp above baseline, always positive

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { chartData, yDomain, cutoffDate } = useMemo(() => {
    const pts = series.points;
    if (!pts.length || !projection.forecast.length) {
      return {
        chartData: pts.map((p) => ({
          date: yearStr(p.date),
          actual: p.value,
          pess_floor: null as number | null,
          pess_band: null as number | null,
          opt_band: null as number | null,
          baseline_fcast: null as number | null,
        })),
        yDomain: ['auto', 'auto'] as ['auto', 'auto'],
        cutoffDate: yearStr(pts.at(-1)?.date ?? ''),
      };
    }

    const lastActual = pts[pts.length - 1];
    const cutoff = yearStr(lastActual.date);

    // All historical points except the last (which becomes the transition)
    const hist: FanDatum[] = pts.slice(0, -1).map((p) => ({
      date: yearStr(p.date),
      actual: p.value,
      pess_floor: null,
      pess_band: null,
      opt_band: null,
      baseline_fcast: null,
    }));

    // Transition: last actual is also the fan's anchor point
    const transition: FanDatum = {
      date: cutoff,
      actual: lastActual.value,
      pess_floor: lastActual.value + pessOffset,
      pess_band: Math.abs(pessOffset),
      opt_band: optOffset,
      baseline_fcast: lastActual.value,
    };

    // Pure forecast dates
    const fcast: FanDatum[] = projection.forecast.map((f) => ({
      date: yearStr(f.date),
      actual: null,
      pess_floor: f.value + pessOffset,
      pess_band: Math.abs(pessOffset),
      opt_band: optOffset,
      baseline_fcast: f.value,
    }));

    const data: FanDatum[] = [...hist, transition, ...fcast];

    // Y domain: actual values + full fan range (pessimistic → optimistic)
    const actuals = pts.map((p) => p.value);
    const pessVals = projection.forecast.map((f) => f.value + pessOffset);
    const optVals = projection.forecast.map((f) => f.value + optOffset);
    const all = [...actuals, ...pessVals, ...optVals];
    const rawMin = Math.min(...all);
    const rawMax = Math.max(...all);
    const pad = Math.max(0.5, (rawMax - rawMin) * 0.07);
    const domain: [number, number] = [
      Math.floor((rawMin - pad) * 2) / 2,
      Math.ceil((rawMax + pad) * 2) / 2,
    ];

    return { chartData: data, yDomain: domain, cutoffDate: cutoff };
  }, [series, projection, pessOffset, optOffset]);

  const unit = series.unit;

  const axisProps = {
    stroke: 'var(--text-soft)',
    tick: { fill: 'var(--text-soft)', fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: 'var(--glass-border)' },
  } as const;

  return (
    <GlassCard title={title} subtitle={subtitle}>
      {/* ── Chart ────────────────────────────────────────────────────── */}
      <div style={{ width: '100%', height }}>
        {!isHydrated ? (
          <div aria-hidden className="h-full w-full rounded-[var(--radius-md)] bg-white/25" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
            <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid
                stroke="var(--glass-border)"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                {...axisProps}
                minTickGap={32}
              />
              <YAxis
                {...axisProps}
                width={56}
                domain={yDomain}
                tickFormatter={(v: number) => formatValue(v, unit)}
              />
              <Tooltip
                content={
                  <FanTooltip unit={unit} pessOffset={pessOffset} optOffset={optOffset} />
                }
                cursor={{ stroke: 'var(--glass-border)', strokeDasharray: '3 3' }}
              />

              {/* Vertical line at the last actual data point */}
              <ReferenceLine
                x={cutoffDate}
                stroke="var(--glass-border)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
              />

              {/* ── Fan bands: transparent floor → pessimistic → optimistic */}
              <Area
                stackId="fan"
                dataKey="pess_floor"
                type="linear"
                fill="transparent"
                stroke="none"
                isAnimationActive={false}
                legendType="none"
              />
              <Area
                stackId="fan"
                dataKey="pess_band"
                type="linear"
                fill={PESS_COLOR}
                fillOpacity={0.15}
                stroke={PESS_COLOR}
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="3 2"
                isAnimationActive={false}
                legendType="none"
              />
              <Area
                stackId="fan"
                dataKey="opt_band"
                type="linear"
                fill={OPT_COLOR}
                fillOpacity={0.15}
                stroke={OPT_COLOR}
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="3 2"
                isAnimationActive={false}
                legendType="none"
              />

              {/* ── Actual historical line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke={ACTUAL_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
                legendType="none"
                activeDot={{ r: 4, strokeWidth: 0 }}
              />

              {/* ── Baseline forecast line (dashed) */}
              <Line
                type="monotone"
                dataKey="baseline_fcast"
                stroke={ACTUAL_COLOR}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                connectNulls
                isAnimationActive={false}
                legendType="none"
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Custom legend ─────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 px-1">
        <LegendItem color={ACTUAL_COLOR} type="solid" label="Actual" />
        <LegendItem color={ACTUAL_COLOR} type="dashed" label="Baseline forecast" />
        <LegendItem
          color={PESS_COLOR}
          type="band"
          label={`Pessimistic (${pessOffset.toFixed(1)} pp)`}
        />
        <LegendItem
          color={OPT_COLOR}
          type="band"
          label={`Optimistic (+${optOffset.toFixed(1)} pp)`}
        />
      </div>

      {/* ── Offset sliders ────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--glass-border)] pt-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">
            Pessimistic offset:{' '}
            <span className="font-semibold" style={{ color: PESS_COLOR }}>
              {pessOffset.toFixed(1)} pp
            </span>
          </span>
          <input
            type="range"
            min={-3.0}
            max={-0.3}
            step={0.1}
            value={pessOffset}
            onChange={(e) => setPessOffset(Number(e.target.value))}
            className="w-full cursor-pointer accent-red-500"
          />
          <span className="flex justify-between text-[10px] text-ink-soft">
            <span>−3.0 pp</span>
            <span>−0.3 pp</span>
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">
            Optimistic offset:{' '}
            <span className="font-semibold" style={{ color: OPT_COLOR }}>
              +{optOffset.toFixed(1)} pp
            </span>
          </span>
          <input
            type="range"
            min={0.3}
            max={3.0}
            step={0.1}
            value={optOffset}
            onChange={(e) => setOptOffset(Number(e.target.value))}
            className="w-full cursor-pointer accent-green-600"
          />
          <span className="flex justify-between text-[10px] text-ink-soft">
            <span>+0.3 pp</span>
            <span>+3.0 pp</span>
          </span>
        </label>
      </div>

      {/* ── Source ────────────────────────────────────────────────────── */}
      {series.sourceName && (
        <div className="mt-4 flex flex-wrap gap-2">
          <SourceBadge
            sourceName={series.sourceName}
            sourceUrl={series.sourceUrl}
            reliability="secondary"
            compact
          />
        </div>
      )}
    </GlassCard>
  );
}
