'use client';

import DemoDataBanner from '@/components/DemoDataBanner';
import GlassCard from '@/components/GlassCard';
import PageHero from '@/components/PageHero';
import PageTabs from '@/components/PageTabs';
import ResearchNote from '@/components/ResearchNote';
import ScoreBars from '@/components/ScoreBars';
import SignalBoard from '@/components/SignalBoard';
import SourceBadge from '@/components/SourceBadge';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import { averageScores, latestValue, latestYear, percentChange } from '@/lib/analytics';
import { findSeries, formatValue } from '@/lib/data';

export default function TradeNetworkPage() {
  // ── Series ────────────────────────────────────────────────────────────────
  const exportsShare      = findSeries('exports_gdp_pct');
  const importsShare      = findSeries('imports_gdp_pct');
  const tradeOpenness     = findSeries('trade_openness_pct');
  const currentAccount    = findSeries('current_account_gdp_pct');
  const reservesShare     = findSeries('reserves_share_gdp_usd_pct');
  const externalDebtShare = findSeries('external_debt_share_gdp_usd_pct');
  const exportImportRatio = findSeries('export_import_ratio');
  const exchangeRate      = findSeries('exchange_rate_thb_usd');
  const tourismExports    = findSeries('tourism_receipts_exports_pct');
  const fdiShare          = findSeries('fdi_net_inflows_gdp_pct');

  // ── Composite scores ──────────────────────────────────────────────────────
  const demandDependence = averageScores([
    { series: exportsShare,   weight: 1.1 },
    { series: tradeOpenness,  weight: 1.2 },
    { series: tourismExports, weight: 0.9 },
  ]);
  const balanceSheetBuffer = averageScores([
    { series: reservesShare,     weight: 1.2 },
    { series: currentAccount,    weight: 1   },
    { series: externalDebtShare, invert: true, weight: 1.1 },
  ]);
  const currencySensitivity = averageScores([
    { series: externalDebtShare, weight: 1.1 },
    { series: importsShare,      weight: 1   },
    { series: exchangeRate,      weight: 0.8 },
  ]);
  const capitalPull = averageScores([
    { series: fdiShare,          weight: 1.2 },
    { series: reservesShare,     weight: 0.8 },
    { series: exportImportRatio, weight: 1   },
  ]);

  // ── Signal items ──────────────────────────────────────────────────────────
  const signalItems = [
    {
      label: 'Trade openness',
      value: tradeOpenness ? formatValue(latestValue(tradeOpenness) ?? 0, tradeOpenness.unit) : '—',
      change: tradeOpenness && percentChange(tradeOpenness, 3) !== null
        ? `${percentChange(tradeOpenness, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'The cleanest single read on how much of the economy is directly exposed to cross-border demand and supply conditions.',
      tone: 'primary' as const,
    },
    {
      label: 'Current account',
      value: currentAccount ? formatValue(latestValue(currentAccount) ?? 0, currentAccount.unit) : '—',
      change: currentAccount && percentChange(currentAccount, 3) !== null
        ? `${percentChange(currentAccount, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'A surplus gives Thailand more room to absorb shocks; a deficit means leaning more on outside financing.',
      tone: 'secondary' as const,
    },
    {
      label: 'Reserves buffer',
      value: reservesShare ? formatValue(latestValue(reservesShare) ?? 0, reservesShare.unit) : '—',
      change: reservesShare && percentChange(reservesShare, 3) !== null
        ? `${percentChange(reservesShare, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'International reserves are the first line of defense when a currency move or capital-flow reversal hits.',
      tone: 'success' as const,
    },
    {
      label: 'External debt load',
      value: externalDebtShare ? formatValue(latestValue(externalDebtShare) ?? 0, externalDebtShare.unit) : '—',
      change: externalDebtShare && percentChange(externalDebtShare, 3) !== null
        ? `${percentChange(externalDebtShare, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'Higher foreign-currency debt increases the amount of trade or capital stress that can transmit into the domestic economy.',
      tone: 'warning' as const,
    },
  ];

  // ── Score items ───────────────────────────────────────────────────────────
  const scoreItems = [
    {
      label: 'External demand dependence',
      score: demandDependence ?? 0,
      note: 'Higher means Thailand is closer to the top of its own historical range for trade and tourism dependence.',
      tone: 'primary' as const,
    },
    {
      label: 'Balance-sheet buffer',
      score: balanceSheetBuffer ?? 0,
      note: 'Higher means reserves and current-account support are doing more work relative to external debt pressure.',
      tone: 'success' as const,
    },
    {
      label: 'Currency sensitivity',
      score: currencySensitivity ?? 0,
      note: 'Higher means imports, debt, and exchange-rate exposure are aligned in a way that would make a currency shock more visible.',
      tone: 'warning' as const,
    },
    {
      label: 'Capital pull',
      score: capitalPull ?? 0,
      note: 'Higher means Thailand is attracting a healthier mix of FDI, export earnings, and reserve backing than in weaker historical periods.',
      tone: 'secondary' as const,
    },
  ];

  // ── Shared header ─────────────────────────────────────────────────────────
  const hero = (
    <>
      <PageHero
        eyebrow="Who Thailand trades with, and how those ties are shifting"
        title="How exposed is Thailand's trade network right now?"
        description={
          <p>
            This page reads the external economy as a working system: demand dependence, buffer strength, currency
            sensitivity, and capital attraction. It does not claim partner-level granularity the dataset does not have,
            but it gives a real macro trade brief instead of a coming-soon card.
          </p>
        }
        metrics={[
          {
            label: 'Demand dependence',
            value: demandDependence !== null ? `${demandDependence}/100` : '—',
            detail: 'Trade and tourism intensity versus the rest of the sample.',
            tone: 'primary',
          },
          {
            label: 'Balance-sheet buffer',
            value: balanceSheetBuffer !== null ? `${balanceSheetBuffer}/100` : '—',
            detail: 'Reserves and current account offsetting debt pressure.',
            tone: 'success',
          },
          {
            label: 'Currency sensitivity',
            value: currencySensitivity !== null ? `${currencySensitivity}/100` : '—',
            detail: 'How much a sharp FX move would likely transmit.',
            tone: 'warning',
          },
        ]}
      />
      <DemoDataBanner />
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Tab definitions
  // ─────────────────────────────────────────────────────────────────────────
  const tabs = [
    // ── Overview ────────────────────────────────────────────────────────────
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <>
          <SignalBoard
            title="What to check before making any call on Thailand's external position"
            subtitle="These are the channels that determine whether a global shock lands as a manageable slowdown or a broader balance-of-payments problem."
            items={signalItems}
          />

          <ScoreBars
            title="Exposure framework"
            subtitle="Each score is a transparent weighted blend of live series already in the dashboard."
            items={scoreItems}
            footer="These are relative-history scores — they compare regimes inside this dataset, not market-implied stress models."
          />

          <ResearchNote title="How to use this route well">
            <p>
              Start with the scorecard: it tells you whether the risk is primarily about demand dependence, thin buffers,
              FX sensitivity, or a weakening capital account. Then use the charts in the other tabs to see whether that
              is a long-running regime or a recent turn.
            </p>
            <p>
              If you specifically need partner exposure, product mix, or supply-chain concentration, that requires
              customs or UN Comtrade-style partner-level data rather than annual national accounts alone.
            </p>
          </ResearchNote>
        </>
      ),
    },

    // ── Trade Flows ──────────────────────────────────────────────────────────
    {
      id: 'flows',
      label: 'Trade Flows',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              Trade flows
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              How much of GDP flows through cross-border trade?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Thailand's trade openness sits at a level that makes the economy highly sensitive to global demand
              cycles — particularly in electronics, auto parts, and petrochemicals. Understanding whether exports
              and imports are moving together or diverging tells you something about domestic demand vs. external demand.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard
              title="Thailand still lives through trade intensity"
              subtitle={`Exports, imports, and trade openness as shares of GDP — through ${latestYear(exportsShare) ?? 'the sample'}`}
            >
              {exportsShare && importsShare && tradeOpenness ? (
                <TimeSeriesChart series={[exportsShare, importsShare, tradeOpenness]} variant="line" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {exportsShare && (
                  <SourceBadge sourceName={exportsShare.sourceName} sourceUrl={exportsShare.sourceUrl} reliability="secondary" compact />
                )}
              </div>
            </GlassCard>

            <GlassCard
              title="Export-import ratio and exchange rate"
              subtitle={`Export cover of imports and THB/USD exchange rate — through ${latestYear(exportImportRatio) ?? 'the sample'}`}
            >
              {exportImportRatio && exchangeRate ? (
                <TimeSeriesChart series={[exportImportRatio, exchangeRate]} variant="line" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                A ratio above 1 means exports cover imports — a basic structural surplus in trade. The exchange rate
                matters because a weaker baht helps export competitiveness but also inflates the local cost of imported
                inputs and foreign-currency debt.
              </p>
            </GlassCard>
          </section>

          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/40 p-5 lg:grid-cols-4">
            {[
              { label: 'Exports / GDP', s: exportsShare, tone: 'text-[var(--primary)]' },
              { label: 'Imports / GDP', s: importsShare, tone: 'text-[var(--secondary)]' },
              { label: 'Trade openness', s: tradeOpenness, tone: 'text-[var(--success)]' },
              { label: 'THB / USD', s: exchangeRate, tone: 'text-[var(--warning)]' },
            ].map(({ label, s, tone }) => (
              <div key={label}>
                <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">{label}</p>
                <p className={`mt-2 font-display text-3xl font-bold ${tone}`}>
                  {s ? formatValue(latestValue(s) ?? 0, s.unit) : '—'}
                </p>
                <p className="mt-1 text-xs text-ink-soft">latest year</p>
              </div>
            ))}
          </div>
        </>
      ),
    },

    // ── External Position ────────────────────────────────────────────────────
    {
      id: 'external',
      label: 'External Position',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--success)]">
              External position
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              Buffers matter as much as flows
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              It is easy to over-focus on exports alone. What actually determines resilience is whether reserves
              and the current account give the country room to absorb a hit before external debt becomes the
              binding constraint.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard
              title="The three pillars of external resilience"
              subtitle={`Current account, reserves, and external debt as shares of GDP — through ${latestYear(currentAccount) ?? 'the sample'}`}
            >
              {currentAccount && reservesShare && externalDebtShare ? (
                <TimeSeriesChart series={[currentAccount, reservesShare, externalDebtShare]} variant="line" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {currentAccount && (
                  <SourceBadge sourceName={currentAccount.sourceName} sourceUrl={currentAccount.sourceUrl} reliability="secondary" compact />
                )}
              </div>
            </GlassCard>

            <GlassCard
              title="Three channels that transmit a shock fastest"
              subtitle="A plain-language operating model of Thailand's external system"
            >
              <div className="flex flex-col gap-3">
                <div className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
                  <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
                    Demand channel
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    When global demand softens, the first hit lands in goods exports, tourism, and manufacturing-linked
                    services. The latest openness reading of{' '}
                    <strong className="text-ink">
                      {tradeOpenness ? formatValue(latestValue(tradeOpenness) ?? 0, tradeOpenness.unit) : '—'}
                    </strong>{' '}
                    says that channel is still large.
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
                  <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                    Currency channel
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    A weaker baht helps exporters at the margin, but also raises the local burden of imported inputs
                    and foreign-currency debt — the trade-off makes sense only when read beside reserves and debt.
                  </p>
                  {exchangeRate && (
                    <p className="mt-2 text-xs text-ink-soft">
                      Latest annual average: {formatValue(latestValue(exchangeRate) ?? 0, exchangeRate.unit)}.
                    </p>
                  )}
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
                  <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--warning)]">
                    Financing channel
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    If FDI and export receipts stay healthy, Thailand can fund growth without much visible strain.
                    If both soften together, the external debt stock matters more and policy flexibility narrows faster.
                  </p>
                </div>
              </div>
            </GlassCard>
          </section>

          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/40 p-5 lg:grid-cols-3">
            {[
              { label: 'Current account / GDP', s: currentAccount, tone: 'text-[var(--secondary)]' },
              { label: 'Reserves / GDP', s: reservesShare, tone: 'text-[var(--success)]' },
              { label: 'External debt / GDP', s: externalDebtShare, tone: 'text-[var(--warning)]' },
            ].map(({ label, s, tone }) => (
              <div key={label}>
                <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">{label}</p>
                <p className={`mt-2 font-display text-3xl font-bold ${tone}`}>
                  {s ? formatValue(latestValue(s) ?? 0, s.unit) : '—'}
                </p>
                <p className="mt-1 text-xs text-ink-soft">latest year</p>
              </div>
            ))}
          </div>
        </>
      ),
    },

    // ── Capital & FDI ────────────────────────────────────────────────────────
    {
      id: 'capital',
      label: 'Capital & FDI',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
              Capital &amp; FDI
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              Is Thailand still attracting productive capital?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              FDI flows tell you whether Thailand remains an attractive destination for long-term productive investment
              — factories, supply-chain nodes, and technology transfer — versus portfolio capital that can reverse quickly.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard
              title="FDI net inflows as share of GDP"
              subtitle={`Foreign direct investment — through ${latestYear(fdiShare) ?? 'the sample'}`}
            >
              {fdiShare ? (
                <TimeSeriesChart series={fdiShare} variant="area" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              {fdiShare && (
                <div className="mt-4">
                  <SourceBadge sourceName={fdiShare.sourceName} sourceUrl={fdiShare.sourceUrl} reliability="secondary" compact />
                </div>
              )}
            </GlassCard>

            <GlassCard
              title="Tourism receipts as share of exports"
              subtitle={`Tourism's role in export earnings — through ${latestYear(tourismExports) ?? 'the sample'}`}
            >
              {tourismExports ? (
                <TimeSeriesChart series={tourismExports} variant="area" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                Tourism acts as both an export earner and a capital attractor. Its share of total export receipts
                shows whether Thailand is still leaning heavily on travel services or whether goods exports are
                providing more diversification.
              </p>
            </GlassCard>
          </section>

          <GlassCard
            title="What the next version needs for a literal network view"
            subtitle={`Current page is updated through ${latestYear(exportsShare) ?? 'the sample'} with macro network signals, not partner microdata.`}
          >
            <p className="text-sm leading-relaxed text-ink-muted">
              To draw an actual trade network, this project needs bilateral partner shares, product-category
              concentration, and ideally a time series showing how the China, US, ASEAN, Japan, and EU links change
              year by year. Until those exist, the honest move is to show the system-level picture clearly instead
              of simulating a node-link map with made-up partner weights.
            </p>
          </GlassCard>

          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/40 p-5 lg:grid-cols-2">
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">FDI net inflows / GDP</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--secondary)]">
                {fdiShare ? formatValue(latestValue(fdiShare) ?? 0, fdiShare.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">latest year</p>
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Tourism receipts / exports</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--primary)]">
                {tourismExports ? formatValue(latestValue(tourismExports) ?? 0, tourismExports.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">share of total export earnings</p>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 pb-16">
      {hero}
      <PageTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
