import GlassCard from '@/components/GlassCard';
import MetricCard from '@/components/MetricCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import { findSeries, latestPoint, formatValue, pointAtYear } from '@/lib/data';

export default function TourismMonitorPage() {
  const recoveryIndex = findSeries('tourism_recovery_index_2019_100');
  const arrivalsIndex = findSeries('tourism_arrivals_index_2015_100');
  const arrivals = findSeries('tourism_arrivals_million');
  const receipts = findSeries('tourism_receipts_usd_billion');
  const arrivalsYoy = findSeries('tourism_arrivals_yoy_pct');
  const receiptsYoy = findSeries('tourism_receipts_yoy_pct');
  const receiptsShareGdp = findSeries('tourism_receipts_share_gdp_usd_pct');
  const receiptsShareExports = findSeries('tourism_receipts_exports_pct');

  const recoveryLatest = recoveryIndex ? latestPoint(recoveryIndex) : undefined;

  // ── Recovery ratio: current vs. 2019 pre-pandemic peak ───────────────────
  const arrivalsLatest   = arrivals ? latestPoint(arrivals)          : undefined;
  const arrivals2019     = arrivals ? pointAtYear(arrivals, 2019)    : undefined;
  const receiptsLatest   = receipts ? latestPoint(receipts)          : undefined;
  const receipts2019     = receipts ? pointAtYear(receipts, 2019)    : undefined;
  const arrivalRatio     = arrivalsLatest && arrivals2019 && arrivals2019.value > 0
    ? ((arrivalsLatest.value / arrivals2019.value) * 100) : null;
  const receiptRatio     = receiptsLatest && receipts2019 && receipts2019.value > 0
    ? ((receiptsLatest.value / receipts2019.value) * 100) : null;
  const arrivalGap       = arrivalsLatest && arrivals2019
    ? (arrivalsLatest.value - arrivals2019.value) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Watching the recovery</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          How fully has tourism recovered, and how much is the economy still leaning on it?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          Tourism is one of the clearest swing factors in the Thai economy &mdash; it collapsed
          sharply during the pandemic and has been clawing its way back since. The series below
          track that comeback from a few angles: how close it is to its old footing, whether
          visitor numbers and visitor spending are recovering at the same pace, and how large a
          slice of the economy still rides on it.
        </p>
      </header>

      <DemoDataBanner />

      {/* ------------------------------------------------------------------ */}
      {/* How close is the recovery, and is the pace holding up?              */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The headline gauge</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How close is tourism to a full recovery &mdash; and is the pace holding up?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Both indices below are rebased so a past year equals 100, which makes the shape of
            the recovery easier to read than the raw visitor counts on their own.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recoveryIndex && (
            <MetricCard series={recoveryIndex} label="Recovery index (2019 = 100)" goodDirection="up" reliability="secondary" />
          )}
          {arrivals && <MetricCard series={arrivals} label="Visitor arrivals" goodDirection="up" reliability="secondary" />}
          {receipts && <MetricCard series={receipts} label="Tourism receipts" goodDirection="up" reliability="secondary" />}
          {arrivalsYoy && (
            <MetricCard series={arrivalsYoy} label="Arrivals growth, year over year" goodDirection="up" reliability="secondary" />
          )}
        </div>
        <GlassCard
          title="The road back to the pre-shock baseline"
          subtitle="Tourism recovery index (2019 = 100) vs. visitor-arrivals index (2015 = 100)"
        >
          {recoveryIndex && arrivalsIndex ? (
            <RangeChart series={[recoveryIndex, arrivalsIndex]} variant="line" />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {recoveryIndex && (
              <SourceBadge sourceName={recoveryIndex.sourceName} sourceUrl={recoveryIndex.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>
        <ResearchNote title="A possible reading">
          <p>
            A reading below 100 on the recovery index means the industry is still short of its
            pre-pandemic footing; a reading above it means the rebound has overshot.
            {recoveryLatest && (
              <>
                {' '}
                The latest reading sits at {formatValue(recoveryLatest.value, recoveryIndex?.unit ?? '')}
                {' '}&mdash; {recoveryLatest.value < 100 ? 'still short of that 2019 baseline' : 'above that 2019 baseline'}.
              </>
            )}{' '}
            Watching it move alongside the arrivals index helps separate two different stories: a
            rebound led mostly by raw visitor numbers, versus one shaped by longer stays,
            higher-spending travelers, or currency effects on dollar-denominated receipts &mdash; a
            distinction the next section looks at directly.
          </p>
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Volume, recovery ratio, and growth drivers (3-part framework)       */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Volume vs. spending</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Absolute volume, recovery gap, and what&rsquo;s driving both
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Year-over-year percentage growth is distorted by the pandemic base effect. The more
            useful questions are: how large is the market right now in real terms, how far is it
            from the 2019 ceiling, and what factors are shaping the current slope?
          </p>
        </header>

        {/* Part 1 — Absolute volume ---------------------------------------- */}
        <div className="flex flex-col gap-1">
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Part 1 &nbsp;·&nbsp; Absolute volume
          </p>
          <GlassCard
            title="Visitor arrivals — actual headcount, not percentage change"
            subtitle={`Total international visitor arrivals (millions) · annual series`}
          >
            {arrivals ? (
              <RangeChart series={arrivals} variant="area" />
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              The shape here tells you what percentage growth cannot: you can see the actual floor
              (2021, near-zero), the steepness of the rebound, and where the slope is currently
              flattening &mdash; which signals a transition from post-pandemic rebound growth
              into market-share competition.
            </p>
          </GlassCard>
        </div>

        {/* Part 2 — Pre-pandemic baseline / recovery ratio -------------------- */}
        <div className="flex flex-col gap-3">
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Part 2 &nbsp;·&nbsp; Pre-pandemic baseline (2019 = 100%)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Arrivals recovery ratio */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/50 p-5">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Arrivals recovery ratio
              </p>
              <p className={`mt-3 font-display text-4xl font-bold ${arrivalRatio !== null && arrivalRatio >= 95 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                {arrivalRatio !== null ? `${arrivalRatio.toFixed(1)}%` : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                of 2019&nbsp;peak&nbsp;({arrivals2019 ? formatValue(arrivals2019.value, arrivals2019 ? 'M visitors' : '') : '—'}&nbsp;M)
              </p>
              {arrivalGap !== null && (
                <p className="mt-2 text-sm text-ink-muted">
                  {arrivalGap < 0
                    ? `Still ${Math.abs(arrivalGap).toFixed(1)} M visitors short of the 2019 ceiling.`
                    : `Has cleared the 2019 ceiling by ${arrivalGap.toFixed(1)} M visitors.`}
                </p>
              )}
            </div>

            {/* Receipts recovery ratio */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/50 p-5">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Receipts recovery ratio
              </p>
              <p className={`mt-3 font-display text-4xl font-bold ${receiptRatio !== null && receiptRatio >= 95 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                {receiptRatio !== null ? `${receiptRatio.toFixed(1)}%` : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                of 2019 receipts ({receipts2019 ? formatValue(receipts2019.value, receipts2019 ? 'USD B' : '') : '—'} B)
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {receiptRatio !== null && arrivalRatio !== null
                  ? receiptRatio > arrivalRatio
                    ? 'Spending is recovering faster than headcount — each visitor is spending more on average.'
                    : 'Headcount is recovering faster than spending — volume-led rather than value-led rebound.'
                  : ''}
              </p>
            </div>

            {/* Slope interpretation */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/50 p-5">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Slope signal
              </p>
              <p className="mt-3 font-display text-xl font-bold text-ink">
                {arrivalRatio !== null && arrivalRatio >= 95
                  ? 'Flattening'
                  : arrivalRatio !== null && arrivalRatio >= 70
                  ? 'Recovering'
                  : 'Rebuilding'}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {arrivalRatio !== null && arrivalRatio >= 85
                  ? 'The curve is approaching its pre-shock ceiling. Growth will increasingly come from market share competition, not post-pandemic rebound math.'
                  : 'Still meaningfully below 2019. Rebound growth remains structurally available, though the pace depends on visa policy and regional competition.'}
              </p>
            </div>
          </div>
        </div>

        {/* Part 3 — Growth drivers ----------------------------------------- */}
        <div className="flex flex-col gap-3">
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Part 3 &nbsp;·&nbsp; Growth drivers currently influencing this volume
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                Visa &amp; access policy
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Thailand&rsquo;s visa-free and visa-on-arrival expansions (India, China, Gulf markets)
                directly shape which source markets can reactivate. Policy changes here have faster
                arrival effects than any other single lever.
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
                Baht strength &amp; price competitiveness
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                A stronger baht raises the USD cost of a Thai holiday relative to competing
                destinations (Vietnam, Malaysia, Bali). When receipts recovery lags arrivals
                recovery, currency effects and pricing mix are often the explanation.
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--warning)]">
                Regional competition &amp; airlift
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Vietnam, Indonesia, and Malaysia have all expanded low-cost carrier capacity since
                2022. As the rebound matures, Thailand increasingly competes for the same traveler
                pool rather than simply receiving returning visitors.
              </p>
            </div>
          </div>
        </div>

        {/* Supplementary: YoY rates (clearly labeled as context only) ---------- */}
        <details className="group">
          <summary className="cursor-pointer select-none font-label text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink">
            ▸ &nbsp;Supplementary: year-over-year growth rates (use with caution)
          </summary>
          <div className="mt-3">
            <GlassCard
              title="YoY change in arrivals vs. receipts"
              subtitle="Useful only for 2018–2019 and 2024 onward — 2020–2023 are base-effect distortions"
            >
              {arrivalsYoy && receiptsYoy ? (
                <RangeChart series={[arrivalsYoy, receiptsYoy]} variant="line" yDomain={[-100, 120]} />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <p className="mt-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                <strong>Base-effect warning:</strong> The 2022 bar would read ~2,500 % YoY (arrivals from near-zero in 2021). Y-axis capped at 120 % to prevent that spike from making all other years unreadable. Treat 2020–2023 as a distorted rebound window, not meaningful trend data.
              </p>
            </GlassCard>
          </div>
        </details>

        <ResearchNote title="When to stop expecting rebound growth">
          <p>
            Watch the slope of the absolute arrivals line. A flattening curve after the recovery
            ratio clears ~90 % of the 2019 ceiling is the clearest signal that post-pandemic
            &ldquo;catch-up&rdquo; growth is exhausted. From that point forward, incremental arrival
            gains come from market share competition &mdash; which requires a different playbook
            than simply re-opening routes and reinstating visas.
          </p>
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How much does the economy still lean on tourism?                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The exposure question</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How much does the broader economy still lean on tourism &mdash; and what would a setback cost?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            The more of the economy that runs through tourism, the further a shock to travel
            &mdash; a health scare, a regional disruption, a strong baht that makes Thailand a
            pricier destination &mdash; would ripple beyond hotels and airlines into the wider
            economy.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GlassCard title="Tourism receipts as a share of the whole economy" subtitle="Tourism receipts, % of GDP (USD terms)">
            {receiptsShareGdp ? (
              <RangeChart series={receiptsShareGdp} />
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
          </GlassCard>
          <GlassCard title="Tourism's weight in Thailand's export earnings" subtitle="Tourism receipts, % of total exports">
            {receiptsShareExports ? (
              <RangeChart series={receiptsShareExports} />
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
          </GlassCard>
        </div>
        <ResearchNote title="Worth being careful about">
          <p>
            Both ratios above swung sharply through the pandemic years &mdash; not because
            Thailand&rsquo;s underlying trade structure changed that fast, but because the
            denominator (GDP, exports) and the numerator (tourism receipts) moved at once, in the
            same direction, for a few unusual years. Reading the trend across many years, rather
            than leaning on any single year, is the steadier way to gauge how exposed the economy
            genuinely is to a travel shock.
          </p>
        </ResearchNote>
      </section>
    </div>
  );
}
