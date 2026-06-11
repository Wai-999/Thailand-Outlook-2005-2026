import GlassCard from '@/components/GlassCard';
import MetricCard from '@/components/MetricCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import { findSeries, latestPoint, formatValue } from '@/lib/data';

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
      {/* Are arrivals and receipts recovering at the same pace?              */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Volume vs. spending</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Are visitor numbers and visitor spending recovering at the same pace?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            A rebound can show up two different ways &mdash; more people walking through the
            gates, or the same number of people spending more once they&rsquo;re here. Comparing
            the year-over-year growth of arrivals and receipts is one way to see which is doing
            more of the work in a given year.
          </p>
        </header>
        <GlassCard
          title="Two growth rates, side by side"
          subtitle="Year-over-year change in visitor arrivals vs. year-over-year change in tourism receipts"
        >
          {arrivalsYoy && receiptsYoy ? (
            <RangeChart
              series={[arrivalsYoy, receiptsYoy]}
              variant="line"
              yDomain={[-100, 120]}
            />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <p className="mt-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            <strong>Chart note:</strong> The 2022 bar registers ~2,500 % YoY because arrivals collapsed to near-zero in 2021 (COVID lock-down) — a single visitor returning would look like infinite growth from that base.
            The Y-axis is capped at 120 % to keep other years readable. The spike is real, but comparing any 2022 reading to the surrounding years is misleading; treat 2022–2023 as a rebound period rather than a growth signal.
          </p>
        </GlassCard>
        <ResearchNote title="How to read this">
          <p>
            When the receipts line runs above the arrivals line, spending is growing faster than
            visitor numbers &mdash; a sign that, on average, each visitor is contributing more
            (longer stays, pricier itineraries, or simply currency effects on receipts measured in
            dollars). When arrivals run ahead of receipts, the rebound looks more like a story of
            volume than value. Neither pattern is inherently better &mdash; they just point a
            researcher toward different follow-up questions: one toward marketing reach and flight
            connectivity, the other toward what&rsquo;s happening to prices and the baht.
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
