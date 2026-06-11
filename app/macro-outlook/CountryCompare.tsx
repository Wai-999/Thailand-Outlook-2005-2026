'use client';

import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import type { IndicatorSeries } from '@/lib/types';
import peersRaw from '@/public/data/peers.json';

// ── Types ────────────────────────────────────────────────────────────────────
type Point = { date: string; value: number };
type CountryMap = Record<string, Point[]>;

// Cast once at module level — JSON structure matches; only mutability differs.
const GDP_MAP   = peersRaw.gdpGrowth    as unknown as CountryMap;
const INF_MAP   = peersRaw.inflation    as unknown as CountryMap;
const TRADE_MAP = peersRaw.tradeOpenness as unknown as CountryMap;

// ── Peer metadata (fixed display order → stable colors) ──────────────────────
const PEERS = [
  { code: 'VNM', name: 'Vietnam',     flag: '🇻🇳', color: '#ef4444' },
  { code: 'IDN', name: 'Indonesia',   flag: '🇮🇩', color: '#f59e0b' },
  { code: 'MYS', name: 'Malaysia',    flag: '🇲🇾', color: '#8b5cf6' },
  { code: 'PHL', name: 'Philippines', flag: '🇵🇭', color: '#16a34a' },
] as const;

type PeerCode = (typeof PEERS)[number]['code'];

const PEER_META = Object.fromEntries(
  PEERS.map((p) => [p.code, p]),
) as Record<PeerCode, (typeof PEERS)[number]>;

/** Thailand always uses the primary blue (#2563eb = SERIES_COLORS[0]). */
const THA_COLOR = '#2563eb';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makePeerSeries(code: string, name: string, points: Point[], unit: string): IndicatorSeries {
  return {
    sector: 'Regional comparison',
    indicatorCode: `peer_${code}`,
    indicatorName: name,
    unit,
    frequency: 'annual',
    sourceName: 'World Bank WDI',
    sourceUrl: 'https://databank.worldbank.org/source/world-development-indicators',
    isDemo: false,
    points,
  };
}

/**
 * Build the `series` and `colors` arrays for one comparison chart.
 * Thailand is always first (blue); selected peers follow in fixed order.
 */
function buildChart(
  thaSeries: IndicatorSeries | undefined,
  unit: string,
  dataMap: CountryMap,
  activePeers: (typeof PEERS)[number][],
): { series: IndicatorSeries[]; colors: string[] } {
  const series: IndicatorSeries[] = [];
  const colors: string[] = [];

  if (thaSeries) {
    series.push({ ...thaSeries, indicatorName: 'Thailand', indicatorCode: 'peer_THA' });
    colors.push(THA_COLOR);
  }

  for (const peer of activePeers) {
    series.push(makePeerSeries(peer.code, peer.name, dataMap[peer.code] ?? [], unit));
    colors.push(PEER_META[peer.code].color);
  }

  return { series, colors };
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * CountryCompare — "How does Thailand stack up against ASEAN peers?"
 *
 * A self-contained client component: reads peer data from peers.json and
 * accepts Thailand's GDP growth and inflation series as server-side props
 * (so the comparison chart matches the main charts above exactly). Trade
 * openness for all five countries comes from peers.json.
 */
export default function CountryCompare({
  thaGdp,
  thaInflation,
}: {
  thaGdp?: IndicatorSeries;
  thaInflation?: IndicatorSeries;
}) {
  // Default: Vietnam selected on mount
  const [selected, setSelected] = useState<Set<PeerCode>>(new Set<PeerCode>(['VNM']));

  function toggle(code: PeerCode) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // Ordered subset of selected peers (PEERS order → stable color assignment)
  const activePeers = PEERS.filter((p) => selected.has(p.code));

  // Build chart data
  const gdpChart = buildChart(thaGdp, '% annual', GDP_MAP, activePeers);
  const infChart = buildChart(thaInflation, '% annual', INF_MAP, activePeers);

  // Trade openness: Thailand comes from peers.json (no live series in macro.json)
  const thaTrade = makePeerSeries('THA', 'Thailand', TRADE_MAP['THA'] ?? [], '% of GDP');
  const tradeChart = buildChart(thaTrade, '% of GDP', TRADE_MAP, activePeers);

  const noneSelected = selected.size === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Country selector ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-muted">Compare with:</span>
        {PEERS.map((p) => {
          const isOn = selected.has(p.code);
          return (
            <button
              key={p.code}
              onClick={() => toggle(p.code)}
              aria-pressed={isOn}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all"
              style={{
                borderColor: isOn ? PEER_META[p.code].color : 'var(--glass-border)',
                backgroundColor: isOn ? `${PEER_META[p.code].color}1a` : 'transparent',
                color: isOn ? PEER_META[p.code].color : 'var(--text-soft)',
              }}
            >
              <span aria-hidden>{p.flag}</span>
              {p.name}
            </button>
          );
        })}
        {noneSelected && (
          <span className="text-xs text-ink-soft italic">
            Select a country to overlay its line on the charts
          </span>
        )}
      </div>

      {/* ── GDP growth comparison ─────────────────────────────────────────── */}
      <GlassCard
        title="GDP growth compared"
        subtitle="Real GDP growth (% annual) — Thailand vs. selected peers · drag to zoom"
      >
        <RangeChart
          series={gdpChart.series.length > 0 ? gdpChart.series : (thaGdp ? [{ ...thaGdp, indicatorName: 'Thailand', indicatorCode: 'peer_THA' }] : [])}
          variant="line"
          colors={gdpChart.series.length > 0 ? gdpChart.colors : [THA_COLOR]}
        />
      </GlassCard>

      {/* ── Inflation and Trade openness side by side ─────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard
          title="Inflation compared"
          subtitle="Headline CPI inflation (% annual)"
        >
          <RangeChart
            series={infChart.series.length > 0 ? infChart.series : (thaInflation ? [{ ...thaInflation, indicatorName: 'Thailand', indicatorCode: 'peer_THA' }] : [])}
            variant="line"
            colors={infChart.series.length > 0 ? infChart.colors : [THA_COLOR]}
          />
        </GlassCard>

        <GlassCard
          title="Trade openness compared"
          subtitle="(Exports + Imports) ÷ GDP × 100 — % of GDP"
        >
          <RangeChart
            series={tradeChart.series.length > 0 ? tradeChart.series : [thaTrade]}
            variant="line"
            colors={tradeChart.series.length > 0 ? tradeChart.colors : [THA_COLOR]}
          />
        </GlassCard>
      </div>

      {/* ── Research note ─────────────────────────────────────────────────── */}
      <ResearchNote title="About this comparison">
        <p>
          Figures are World Bank WDI approximations compiled for research purposes &mdash; verify
          against official national statistical offices before citing. Trade openness (exports +
          imports as a share of GDP) exceeds 100% for Vietnam and Malaysia because both economies
          trade a larger value of goods than their total domestic output &mdash; a hallmark of
          deeply integrated export platforms. Thailand&rsquo;s GDP growth and inflation in these
          charts use the same World Bank WDI vintage, which may differ by ±0.1&ndash;0.2 pp from
          the main charts above due to dataset revision cycles.
        </p>
      </ResearchNote>
    </div>
  );
}
