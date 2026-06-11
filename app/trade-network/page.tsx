import GlassCard from '@/components/GlassCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import ScoreBars from '@/components/ScoreBars';
import SourceBadge from '@/components/SourceBadge';
import { ChartExportWrapper } from '@/components/ChartExportControls';
import { averageScores, latestValue, latestYear } from '@/lib/analytics';
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

  const scoreItems = [
    {
      label: 'External demand dependence',
      score: demandDependence ?? 0,
      note: 'Exports (×1.1) + trade openness (×1.2) + tourism receipts share (×0.9). Higher means Thailand is closer to the top of its own historical range for trade and tourism exposure.',
      tone: 'primary' as const,
    },
    {
      label: 'Balance-sheet buffer',
      score: balanceSheetBuffer ?? 0,
      note: 'Reserves (×1.2) + current account (×1.0) + inverted external debt (×1.1). Higher means reserves and current-account support are doing more work relative to external debt pressure.',
      tone: 'success' as const,
    },
    {
      label: 'Currency sensitivity',
      score: currencySensitivity ?? 0,
      note: 'External debt (×1.1) + imports share (×1.0) + exchange rate (×0.8). Higher means imports, debt, and FX exposure are aligned in a way that would make a currency shock more visible.',
      tone: 'warning' as const,
    },
    {
      label: 'Capital pull',
      score: capitalPull ?? 0,
      note: 'FDI inflows (×1.2) + reserves (×0.8) + export-import ratio (×1.0). Higher means Thailand is attracting a healthier mix of FDI, export earnings, and reserve backing than in weaker historical periods.',
      tone: 'secondary' as const,
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
          Thailand&rsquo;s external position
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          How exposed is Thailand to the world right now?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          This page reads the external economy as a working system: demand dependence, buffer strength,
          currency sensitivity, and capital attraction. The dataset contains national aggregates rather
          than bilateral partner detail, so the honest framing is an external-sector brief &mdash; not
          a partner-network map.
        </p>
      </header>

      <DemoDataBanner />

      {/* ── Trade flows ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            Trade flows
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How much of GDP flows through cross-border trade?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Thailand&rsquo;s trade openness sits at a level that makes the economy highly sensitive to
            global demand cycles &mdash; particularly in electronics, auto parts, and petrochemicals.
            Whether exports and imports are moving together or diverging tells you something about
            domestic demand versus external demand.
          </p>
        </header>

        <GlassCard
          title="Thailand still lives through trade intensity"
          subtitle={`Exports, imports, and trade openness as shares of GDP — through ${latestYear(exportsShare) ?? 'the sample'}`}
        >
          {exportsShare && importsShare && tradeOpenness ? (
            <ChartExportWrapper filename="external-trade-flows">
              <RangeChart series={[exportsShare, importsShare, tradeOpenness]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {exportsShare && (
              <SourceBadge sourceName={exportsShare.sourceName} sourceUrl={exportsShare.sourceUrl} reliability="secondary" compact />
            )}
            {importsShare && (
              <SourceBadge sourceName={importsShare.sourceName} sourceUrl={importsShare.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <GlassCard
          title="Export-import ratio and exchange rate"
          subtitle={`Export cover of imports and THB/USD exchange rate — through ${latestYear(exportImportRatio) ?? 'the sample'}`}
        >
          {exportImportRatio && exchangeRate ? (
            <ChartExportWrapper filename="external-ratio-fx">
              <RangeChart series={[exportImportRatio, exchangeRate]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {exchangeRate && (
              <SourceBadge sourceName={exchangeRate.sourceName} sourceUrl={exchangeRate.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <ResearchNote title="A possible reading">
          <p>
            A ratio above 1 means exports cover imports &mdash; a basic structural surplus in trade.
            The exchange rate matters because a weaker baht helps export competitiveness but also
            inflates the local cost of imported inputs and foreign-currency debt.
          </p>
          <p>
            Trade openness (latest:{' '}
            <strong className="text-ink">
              {tradeOpenness ? formatValue(latestValue(tradeOpenness) ?? 0, tradeOpenness.unit) : '—'}
            </strong>
            ) says how large the cross-border channel is. Whether that channel is a source of strength or
            vulnerability depends on the readings in the next two sections.
          </p>
        </ResearchNote>
      </section>

      {/* ── External position ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            External position
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Buffers matter as much as flows
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            It is easy to over-focus on exports alone. What actually determines resilience is whether
            reserves and the current account give the country room to absorb a hit before external debt
            becomes the binding constraint.
          </p>
        </header>

        <GlassCard
          title="The three pillars of external resilience"
          subtitle={`Current account, reserves, and external debt as shares of GDP — through ${latestYear(currentAccount) ?? 'the sample'}`}
        >
          {currentAccount && reservesShare && externalDebtShare ? (
            <ChartExportWrapper filename="external-resilience-pillars">
              <RangeChart series={[currentAccount, reservesShare, externalDebtShare]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {currentAccount && (
              <SourceBadge sourceName={currentAccount.sourceName} sourceUrl={currentAccount.sourceUrl} reliability="secondary" compact />
            )}
            {reservesShare && (
              <SourceBadge sourceName={reservesShare.sourceName} sourceUrl={reservesShare.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <GlassCard
          title="Three channels that transmit a shock fastest"
          subtitle="How demand, currency, and financing shocks move through Thailand's external system"
        >
          <div className="flex flex-col gap-3">
            <div className="rounded-[var(--radius-md)] border border-glass-border bg-white/45 p-4">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
                Demand channel
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                When global demand softens, the first hit lands in goods exports, tourism, and
                manufacturing-linked services. Trade openness (latest:{' '}
                <strong className="text-ink">
                  {tradeOpenness ? formatValue(latestValue(tradeOpenness) ?? 0, tradeOpenness.unit) : '—'}
                </strong>
                ) says how large that channel is.
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-glass-border bg-white/45 p-4">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Currency channel
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                A weaker baht helps exporters at the margin, but also raises the local burden of imported
                inputs and foreign-currency debt. The trade-off makes sense only when read beside reserves
                and debt levels.
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-glass-border bg-white/45 p-4">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary" style={{ color: 'var(--accent-amber)' }}>
                Financing channel
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                If FDI and export receipts stay healthy, Thailand can fund growth without much visible
                strain. If both soften together, the external debt stock (latest:{' '}
                <strong className="text-ink">
                  {externalDebtShare ? formatValue(latestValue(externalDebtShare) ?? 0, externalDebtShare.unit) : '—'}
                </strong>
                ) matters more and policy flexibility narrows faster.
              </p>
            </div>
          </div>
        </GlassCard>

        <ResearchNote title="A possible reading">
          <p>
            A surplus current account gives Thailand more room to absorb shocks; a deficit means leaning
            more on outside financing. International reserves (latest:{' '}
            <strong className="text-ink">
              {reservesShare ? formatValue(latestValue(reservesShare) ?? 0, reservesShare.unit) : '—'}
            </strong>
            ) are the first line of defense when a currency move or capital-flow reversal hits.
          </p>
        </ResearchNote>
      </section>

      {/* ── Capital & FDI ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            Capital &amp; FDI
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Is Thailand still attracting productive capital?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            FDI flows tell you whether Thailand remains an attractive destination for long-term productive
            investment &mdash; factories, supply-chain nodes, and technology transfer &mdash; versus
            portfolio capital that can reverse quickly.
          </p>
        </header>

        <GlassCard
          title="FDI net inflows as share of GDP"
          subtitle={`Foreign direct investment — through ${latestYear(fdiShare) ?? 'the sample'}`}
        >
          {fdiShare ? (
            <ChartExportWrapper filename="external-fdi-inflows">
              <RangeChart series={fdiShare} variant="area" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {fdiShare && (
              <SourceBadge sourceName={fdiShare.sourceName} sourceUrl={fdiShare.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <GlassCard
          title="Tourism receipts as share of exports"
          subtitle={`Tourism's role in export earnings — through ${latestYear(tourismExports) ?? 'the sample'}`}
        >
          {tourismExports ? (
            <ChartExportWrapper filename="external-tourism-exports">
              <RangeChart series={tourismExports} variant="area" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {tourismExports && (
              <SourceBadge sourceName={tourismExports.sourceName} sourceUrl={tourismExports.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <ResearchNote title="A possible reading">
          <p>
            Tourism acts as both an export earner and a capital attractor. Its share of total export
            receipts shows whether Thailand is still leaning heavily on travel services or whether goods
            exports are providing more diversification.
          </p>
          <p>
            To draw an actual trade network by partner, this project would need bilateral partner shares,
            product-category concentration, and a time series for China, US, ASEAN, Japan, and EU links
            changing year by year. Until those exist, the honest move is to show the system-level picture
            clearly rather than simulate a node-link map with unsupported partner weights.
          </p>
        </ResearchNote>
      </section>

      {/* ── Composite scorecard ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            Exposure framework
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            External risk at a glance
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Four composite scores synthesize the page&rsquo;s series into a single read on demand
            dependence, buffer strength, currency sensitivity, and capital attraction &mdash; all
            relative to this dataset&rsquo;s own historical range.
          </p>
        </header>

        <ScoreBars
          title="Exposure framework"
          subtitle="Each score is a transparent weighted blend of live series already in the dashboard."
          items={scoreItems}
          footer="These are relative-history scores — they compare regimes inside this dataset, not market-implied stress models."
        />

        <ResearchNote title="Composite weighting — how each score is built">
          <p>
            Each indicator is rescaled to 0–100 relative to its own historical min-max range before
            weighting. A series marked &ldquo;invert&rdquo; (external debt in the buffer score) is
            flipped so that a lower debt reading contributes a higher score.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-primary hover:underline">
              Show individual weights ▸
            </summary>
            <div className="mt-3 space-y-3 text-xs leading-relaxed">
              <div>
                <p className="font-semibold text-ink">External demand dependence</p>
                <p className="text-ink-muted">Exports / GDP (×1.1) + Trade openness (×1.2) + Tourism receipts / exports (×0.9)</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Balance-sheet buffer</p>
                <p className="text-ink-muted">Reserves / GDP (×1.2) + Current account / GDP (×1.0) + External debt / GDP inverted (×1.1)</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Currency sensitivity</p>
                <p className="text-ink-muted">External debt / GDP (×1.1) + Imports / GDP (×1.0) + Exchange rate THB/USD (×0.8)</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Capital pull</p>
                <p className="text-ink-muted">FDI net inflows / GDP (×1.2) + Reserves / GDP (×0.8) + Export-import ratio (×1.0)</p>
              </div>
            </div>
          </details>
        </ResearchNote>

        <ResearchNote title="How to use this page well">
          <p>
            Start with the scorecard: it tells you whether the risk is primarily about demand dependence,
            thin buffers, FX sensitivity, or a weakening capital account. Then use the charts in the
            sections above to see whether that is a long-running regime or a recent turn.
          </p>
          <p>
            If you specifically need partner exposure, product mix, or supply-chain concentration, that
            requires customs or UN Comtrade-style partner-level data rather than annual national accounts alone.
          </p>
        </ResearchNote>
      </section>

    </div>
  );
}
