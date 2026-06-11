'use client';

import { useState, useMemo, useId } from 'react';
import { lagCorrelation, ols, correlationStrength } from '@/lib/stats';
import type { OLSResult } from '@/lib/stats';

// ── Types ──────────────────────────────────────────────────────────────────────
type Pt = { date: string; value: number };
export type MatrixSeriesRaw = { label: string; points: Pt[] };

// ── Pair alignment ─────────────────────────────────────────────────────────────
function alignPair(a: Pt[], b: Pt[]): { x: number[]; y: number[]; dates: string[] } {
  const bMap = new Map(b.map((p) => [p.date, p.value]));
  const x: number[] = [], y: number[] = [], dates: string[] = [];
  for (const p of a) {
    const v = bMap.get(p.date);
    if (v !== undefined) { x.push(p.value); y.push(v); dates.push(p.date); }
  }
  return { x, y, dates };
}

function applyLag(
  x: number[], y: number[], dates: string[], lag: number,
): { px: number[]; py: number[]; pdates: string[] } {
  if (lag === 0) return { px: x, py: y, pdates: dates };
  if (lag > 0) return { px: x.slice(0, x.length - lag), py: y.slice(lag), pdates: dates.slice(0, x.length - lag) };
  const k = -lag;
  return { px: x.slice(k), py: y.slice(0, y.length - k), pdates: dates.slice(k) };
}

// ── Cell colour ────────────────────────────────────────────────────────────────
function cellBg(r: number | null): string {
  if (r === null) return 'transparent';
  const a = Math.min(1, Math.abs(r));
  return r > 0
    ? `rgba(73,106,104,${(0.12 + a * 0.55).toFixed(2)})`
    : `rgba(201,36,43,${(0.10 + a * 0.45).toFixed(2)})`;
}
function cellFg(r: number | null): string {
  if (r === null) return 'var(--ink-soft)';
  return Math.abs(r) > 0.55 ? '#fff' : 'var(--ink)';
}

// ── Scatter plot (pure SVG, no libraries) ──────────────────────────────────────
const PAD = { top: 32, right: 36, bottom: 52, left: 56 };
const VW = 520, VH = 310;
const PW = VW - PAD.left - PAD.right;   // 428
const PH = VH - PAD.top - PAD.bottom;   // 226

function ScatterPlot({
  xLabel, yLabel, px, py, pdates, fit, lag,
}: {
  xLabel: string; yLabel: string;
  px: number[]; py: number[]; pdates: string[];
  fit: OLSResult | null; lag: number;
}) {
  const uid = useId().replace(/:/g, '');
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  if (!px.length) {
    return <p className="py-4 text-sm text-ink-soft">Not enough overlapping data for this pair{lag > 0 ? ' at this lag' : ''}.</p>;
  }

  const xMin = Math.min(...px), xMax = Math.max(...px);
  const yMin = Math.min(...py), yMax = Math.max(...py);
  const xSpan = xMax - xMin || 1, ySpan = yMax - yMin || 1;
  const xLo = xMin - xSpan * 0.12, xHi = xMax + xSpan * 0.12;
  const yLo = yMin - ySpan * 0.12, yHi = yMax + ySpan * 0.12;

  const toSX = (v: number) => PAD.left + ((v - xLo) / (xHi - xLo)) * PW;
  const toSY = (v: number) => PAD.top + PH - ((v - yLo) / (yHi - yLo)) * PH;

  const N = 4;
  const xTicks = Array.from({ length: N + 1 }, (_, k) => xLo + (k / N) * (xHi - xLo));
  const yTicks = Array.from({ length: N + 1 }, (_, k) => yLo + (k / N) * (yHi - yLo));
  const linePts = fit
    ? { x1: toSX(xLo), y1: toSY(fit.predict(xLo)), x2: toSX(xHi), y2: toSY(fit.predict(xHi)) }
    : null;

  const showLabels = px.length <= 12;
  const xAxisLabel = lag > 0 ? `${xLabel} (year t)` : xLabel;
  const yAxisLabel = lag > 0 ? `${yLabel} (year t+${lag})` : yLabel;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ fontFamily: 'inherit', display: 'block' }}>
      <defs>
        <clipPath id={`clip-${uid}`}>
          <rect x={PAD.left} y={PAD.top} width={PW} height={PH} />
        </clipPath>
      </defs>

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PH} stroke="var(--glass-border)" strokeWidth={1} />
      <line x1={PAD.left} y1={PAD.top + PH} x2={PAD.left + PW} y2={PAD.top + PH} stroke="var(--glass-border)" strokeWidth={1} />

      {/* Zero references */}
      {yLo < 0 && yHi > 0 && (
        <line x1={PAD.left} y1={toSY(0)} x2={PAD.left + PW} y2={toSY(0)}
          stroke="var(--glass-border)" strokeDasharray="3 3" strokeWidth={1} />
      )}
      {xLo < 0 && xHi > 0 && (
        <line x1={toSX(0)} y1={PAD.top} x2={toSX(0)} y2={PAD.top + PH}
          stroke="var(--glass-border)" strokeDasharray="3 3" strokeWidth={1} />
      )}

      {/* OLS line */}
      {linePts && (
        <line
          x1={linePts.x1} y1={linePts.y1} x2={linePts.x2} y2={linePts.y2}
          stroke="var(--secondary)" strokeWidth={2} strokeDasharray="5 3"
          opacity={0.85} clipPath={`url(#clip-${uid})`}
        />
      )}

      {/* Dots */}
      {px.map((xv, idx) => {
        const cx = toSX(xv), cy = toSY(py[idx]);
        const year = pdates[idx]?.slice(0, 4) ?? '';
        const isHov = hovIdx === idx;
        return (
          <g key={idx} onMouseEnter={() => setHovIdx(idx)} onMouseLeave={() => setHovIdx(null)} style={{ cursor: 'default' }}>
            <circle cx={cx} cy={cy} r={isHov ? 6 : 4}
              fill="var(--primary)" fillOpacity={isHov ? 0.95 : 0.72}
              stroke={isHov ? 'white' : 'none'} strokeWidth={1.5} />
            <text x={cx + 8} y={cy + 4} fontSize={9}
              fill={isHov ? 'var(--ink)' : 'var(--ink-soft)'}
              fontWeight={isHov ? 600 : 400}
              style={{ pointerEvents: 'none', opacity: showLabels || isHov ? 1 : 0 }}>
              {year}
            </text>
          </g>
        );
      })}

      {/* R² annotation */}
      {fit && (
        <text x={PAD.left + PW - 4} y={PAD.top + 14}
          textAnchor="end" fontSize={12} fontWeight={700} fill="var(--secondary)">
          R² = {fit.rSquared.toFixed(3)}
        </text>
      )}

      {/* Hovered point coords */}
      {hovIdx !== null && (
        <text x={PAD.left + 4} y={PAD.top + 14} fontSize={10} fill="var(--ink-muted)">
          {pdates[hovIdx]?.slice(0, 4)}: ({px[hovIdx].toFixed(2)}, {py[hovIdx].toFixed(2)})
        </text>
      )}

      {/* X ticks */}
      {xTicks.map((v, k) => (
        <g key={k}>
          <line x1={toSX(v)} y1={PAD.top + PH} x2={toSX(v)} y2={PAD.top + PH + 4} stroke="var(--glass-border)" strokeWidth={1} />
          <text x={toSX(v)} y={PAD.top + PH + 16} textAnchor="middle" fontSize={9} fill="var(--ink-soft)">{v.toFixed(1)}</text>
        </g>
      ))}

      {/* Y ticks */}
      {yTicks.map((v, k) => (
        <g key={k}>
          <line x1={PAD.left - 4} y1={toSY(v)} x2={PAD.left} y2={toSY(v)} stroke="var(--glass-border)" strokeWidth={1} />
          <text x={PAD.left - 7} y={toSY(v) + 4} textAnchor="end" fontSize={9} fill="var(--ink-soft)">{v.toFixed(1)}</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={PAD.left + PW / 2} y={VH - 4}
        textAnchor="middle" fontSize={11} fill="var(--ink-muted)" fontWeight={500}>{xAxisLabel}</text>
      <text x={14} y={PAD.top + PH / 2}
        textAnchor="middle" fontSize={11} fill="var(--ink-muted)" fontWeight={500}
        transform={`rotate(-90, 14, ${PAD.top + PH / 2})`}>{yAxisLabel}</text>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CorrelationMatrix({ series }: { series: MatrixSeriesRaw[] }) {
  const [query, setQuery]           = useState('');
  const [lag, setLag]               = useState(0);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? series.filter((s) => s.label.toLowerCase().includes(q)) : series;
  }, [series, query]);

  const matrix = useMemo(
    () =>
      filtered.map((row) =>
        filtered.map((col) => {
          const { x, y } = alignPair(row.points, col.points);
          return lagCorrelation(x, y, lag);
        }),
      ),
    [filtered, lag],
  );

  const scatterData = useMemo(() => {
    if (!selectedPair) return null;
    const [lA, lB] = selectedPair;
    if (lA === lB) return null;
    const sA = filtered.find((s) => s.label === lA);
    const sB = filtered.find((s) => s.label === lB);
    if (!sA || !sB) return null;
    const { x, y, dates } = alignPair(sA.points, sB.points);
    const { px, py, pdates } = applyLag(x, y, dates, lag);
    const fit = ols(px, py);
    const r = lagCorrelation(x, y, lag);
    return { xLabel: lA, yLabel: lB, px, py, pdates, fit, r };
  }, [selectedPair, filtered, lag]);

  function handleCellClick(rowLabel: string, colLabel: string) {
    if (rowLabel === colLabel) return;
    setSelectedPair(
      selectedPair?.[0] === rowLabel && selectedPair?.[1] === colLabel
        ? null
        : [rowLabel, colLabel],
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Controls ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Filter indicators…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-[var(--glass-border)] bg-surface-strong px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft outline-none focus:border-[var(--primary)] transition-colors"
          aria-label="Filter indicators"
        />
        <div className="flex overflow-hidden rounded-lg border border-[var(--glass-border)] text-xs font-medium" role="group" aria-label="Lag selector">
          {([0, 1, 2] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLag(l)}
              aria-pressed={lag === l}
              className={`px-3 py-1.5 transition-colors ${
                lag === l
                  ? 'bg-primary text-white'
                  : 'text-ink-muted hover:bg-surface-strong hover:text-ink'
              }`}
            >
              {l === 0 ? 'No lag' : `+${l}y lag`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Matrix table ──────────────────────────────────────── */}
      {filtered.length >= 2 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="p-2" />
                {filtered.map((s) => (
                  <th key={s.label} className="max-w-[90px] truncate p-2 text-center font-label font-medium text-ink-muted">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.label}>
                  <th scope="row" className="whitespace-nowrap p-2 text-left font-label font-medium text-ink-muted">
                    {row.label}
                  </th>
                  {filtered.map((col, j) => {
                    const r = matrix[i]?.[j] ?? null;
                    const isDiag = i === j;
                    const isSelected = selectedPair?.[0] === row.label && selectedPair?.[1] === col.label;
                    return (
                      <td
                        key={col.label}
                        onClick={() => handleCellClick(row.label, col.label)}
                        title={
                          isDiag
                            ? row.label
                            : r === null
                              ? 'Insufficient overlapping data'
                              : `${row.label} vs. ${col.label}: r = ${r.toFixed(2)} (${correlationStrength(r)})${lag > 0 ? ` · lag +${lag}y` : ''} — click to open scatter`
                        }
                        className={[
                          'rounded-md p-2 text-center font-medium tabular-nums transition-all duration-100',
                          isDiag ? 'cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-inset hover:ring-[var(--primary)]/50',
                          isSelected ? 'ring-2 ring-inset ring-primary' : '',
                        ].join(' ')}
                        style={{ background: cellBg(r), color: cellFg(r) }}
                      >
                        {r === null ? '—' : r.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-2 text-sm text-ink-soft">
          {query.trim() ? 'No indicators match — try a shorter term.' : 'Fewer than two series available.'}
        </p>
      )}

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(73,106,104,0.55)' }} />
          Move together (positive)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(201,36,43,0.45)' }} />
          Move opposite (negative)
        </span>
        <span>
          Darker = stronger. Click any non-diagonal cell for a scatter plot.
          {lag > 0 && <> Row is year t, column is year t+{lag}.</>}
        </span>
      </div>

      {/* ── Scatter panel ─────────────────────────────────────── */}
      {scatterData && (
        <div className="rounded-xl border border-[var(--glass-border)] bg-surface-strong p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-ink">
                {scatterData.xLabel}
                <span className="mx-1.5 font-normal text-ink-soft">vs.</span>
                {scatterData.yLabel}
                {lag > 0 && (
                  <span className="ml-2 text-xs font-normal text-ink-soft">
                    (row leads column by {lag} year{lag > 1 ? 's' : ''})
                  </span>
                )}
              </p>
              {scatterData.r !== null ? (
                <p className="text-xs text-ink-muted">
                  r&nbsp;=&nbsp;<span className="font-semibold text-ink">{scatterData.r.toFixed(2)}</span>
                  {' '}({correlationStrength(scatterData.r)})
                  {scatterData.fit && (
                    <>
                      &nbsp;·&nbsp;R²&nbsp;=&nbsp;<span className="font-semibold text-ink">{scatterData.fit.rSquared.toFixed(3)}</span>
                      &nbsp;·&nbsp;slope&nbsp;=&nbsp;<span className="font-semibold text-ink">{scatterData.fit.slope.toFixed(3)}</span>
                    </>
                  )}
                  &nbsp;·&nbsp;n&nbsp;=&nbsp;{scatterData.px.length}
                </p>
              ) : (
                <p className="text-xs text-ink-soft">Insufficient overlapping data</p>
              )}
            </div>
            <button
              onClick={() => setSelectedPair(null)}
              aria-label="Close scatter plot"
              className="shrink-0 rounded-md p-1 text-ink-soft transition-colors hover:bg-[var(--glass-border)] hover:text-ink"
            >
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
          <ScatterPlot
            xLabel={scatterData.xLabel}
            yLabel={scatterData.yLabel}
            px={scatterData.px}
            py={scatterData.py}
            pdates={scatterData.pdates}
            fit={scatterData.fit}
            lag={lag}
          />
        </div>
      )}
    </div>
  );
}
