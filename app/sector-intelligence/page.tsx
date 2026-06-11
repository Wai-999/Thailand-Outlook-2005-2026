import GlassCard from '@/components/GlassCard';
import MetricCard from '@/components/MetricCard';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import { ChartExportWrapper } from '@/components/ChartExportControls';
import { findSeries, latestPoint, formatValue } from '@/lib/data';

const LEAD_LAG_CODES: { code: string; label: string }[] = [
  { code: 'industrial_production_manufacturing_production_index_growth', label: 'Manufacturing output growth' },
  { code: 'consumer_market_retail_sales_growth', label: 'Retail sales growth' },
  { code: 'investment_capital_private_investment_growth', label: 'Private investment growth' },
  { code: 'consumer_market_household_consumption_growth', label: 'Household consumption growth' },
];

const EXPOSURE_CHANNELS: { code: string; title: string; framing: string }[] = [
  {
    code: 'trade_openness_pct',
    title: 'Trade exposure',
    framing:
      'Thailand trades roughly this share of GDP with the rest of the world each year. The higher this runs, the more a slowdown in global demand -- or a shipping disruption -- shows up directly in domestic growth.',
  },
  {
    code: 'tourism_receipts_share_gdp_usd_pct',
    title: 'Tourism exposure',
    framing:
      'Visitor spending feeds directly into hotels, transport, retail, and the jobs around them. A shock that keeps travelers away -- a health scare, a regional conflict, a currency swing -- ripples through all of them at once.',
  },
  {
    code: 'external_debt_share_gdp_usd_pct',
    title: 'External financing exposure',
    framing:
      "Debt owed in foreign currency has to be repaid regardless of how the baht moves. A sharp depreciation makes this slice of the economy's obligations heavier overnight, even if nothing else changes.",
  },
];

export default function SectorIntelligencePage() {
  const agriculture = findSeries('agri_value_added_gdp_pct');
  const industry = findSeries('industry_value_added_gdp_pct');
  const manufacturing = findSeries('mfg_value_added_gdp_pct');
  const services = findSeries('services_value_added_gdp_pct');

  const tourismRecovery = findSeries('tourism_recovery_index_2019_100');
  const gdpGrowth = findSeries('real_gdp_growth_pct');
  const tourismReceiptsShare = findSeries('tourism_receipts_share_gdp_usd_pct');
  const tourismArrivals = findSeries('tourism_arrivals_million');

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Under the surface</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          How is each part of the economy actually doing?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          A national growth number can hide a lot &mdash; one sector roaring ahead while another
          quietly stalls. This page breaks Thailand&rsquo;s economy into its working parts: who&rsquo;s
          leading, who&rsquo;s lagging, and where a shock would land hardest.
        </p>
      </header>

      <DemoDataBanner />

      {/* ---------------------------------------------------------- */}
      {/* Which sectors are leading or lagging?                       */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The scoreboard</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Which sectors are leading or lagging?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Four pulse-checks on the parts of the economy that move fastest from one year to the
            next &mdash; factories, shops, builders, and households.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEAD_LAG_CODES.map(({ code, label }) => {
            const series = findSeries(code);
            if (!series) return null;
            return <MetricCard key={code} series={series} label={label} goodDirection="up" reliability="secondary" />;
          })}
        </div>
        <GlassCard
          title="How the economy is divided up"
          subtitle="Value added by broad sector, as a share of GDP -- the slow-moving structure underneath the year-to-year noise"
        >
          {industry && manufacturing && services ? (
            <ChartExportWrapper filename="sector-gdp-shares">
              <TimeSeriesChart series={[services, industry, manufacturing]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {services && <SourceBadge sourceName={services.sourceName} sourceUrl={services.sourceUrl} reliability="secondary" compact />}
          </div>
        </GlassCard>
        <ResearchNote title="A possible reading">
          <p>
            Services have made up roughly six of every ten baht of output for most of the past two
            decades &mdash; that steady share is the backdrop against which the faster-moving growth
            figures above should be read. A sector &ldquo;leading&rdquo; in a given year (fast growth)
            isn&rsquo;t necessarily the sector that matters most to the structure of the economy
            (large share); both lenses are useful, and they answer different questions.
          </p>
          {agriculture && (
            <p>
              Agriculture&rsquo;s share has drifted down to around{' '}
              {formatValue(latestPoint(agriculture)?.value ?? 0, agriculture.unit)} of GDP even though it
              still employs a much larger share of the workforce &mdash; a gap that, evidence suggests,
              is closely tied to the income differences between rural and urban Thailand.
            </p>
          )}
        </ResearchNote>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Is tourism recovery supporting broader growth?              */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Watching the comeback</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Is tourism&rsquo;s recovery lifting the broader economy?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Few sectors took a harder hit than travel and hospitality, and few are watched more
            closely on the way back. The recovery index below is rebased so 2019 &mdash; the last
            full year before the shock &mdash; equals 100.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GlassCard
            title="Tourism's road back to its pre-shock level"
            subtitle="Tourism recovery index (2019 = 100) vs. real GDP growth, annual"
          >
            {tourismRecovery && gdpGrowth ? (
              <ChartExportWrapper filename="sector-tourism-recovery">
                <TimeSeriesChart series={[tourismRecovery, gdpGrowth]} variant="line" />
              </ChartExportWrapper>
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
          </GlassCard>
          <GlassCard
            title="How big a slice tourism really is"
            subtitle="Visitor arrivals (millions) vs. tourism receipts as a share of GDP"
          >
            {tourismArrivals && tourismReceiptsShare ? (
              <ChartExportWrapper filename="sector-tourism-size">
                <TimeSeriesChart series={[tourismArrivals, tourismReceiptsShare]} variant="line" />
              </ChartExportWrapper>
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
          </GlassCard>
        </div>
        <ResearchNote title="A possible reading">
          <p>
            A recovery index above 100 means tourism activity has not just bounced back but pushed
            past its pre-shock baseline; a reading still below 100 means the comeback is real but
            incomplete. Either way, watching it move alongside headline GDP growth is one way to
            gauge how much of the national story tourism is currently writing.
          </p>
          <p>
            <strong className="text-ink">Worth being careful about:</strong> tourism receipts flow
            mostly through services, hospitality, and transport -- so a strong tourism year can
            flatter the &ldquo;services&rdquo; share of GDP shown above without necessarily lifting
            manufacturing or agriculture. Evidence suggests the recovery supports broader growth,
            but unevenly across sectors.
          </p>
        </ResearchNote>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Which sectors are most exposed to shocks?                   */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Where the cracks would show first</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Which channels carry the most shock exposure?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Not every part of the economy is equally exposed to events outside Thailand&rsquo;s
            control. These three channels are where an external shock would be felt fastest and
            hardest &mdash; each measured by how large a share of the economy currently runs through it.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {EXPOSURE_CHANNELS.map(({ code, title, framing }) => {
            const series = findSeries(code);
            if (!series) return null;
            const latest = latestPoint(series);
            return (
              <div key={code} className="glass-card flex flex-col gap-3 p-5">
                <p className="font-label text-sm font-semibold text-ink">{title}</p>
                <p className="font-display text-3xl font-bold text-primary">
                  {latest ? formatValue(latest.value, series.unit) : '—'}
                </p>
                <p className="text-sm leading-relaxed text-ink-muted">{framing}</p>
                <div className="mt-auto pt-1">
                  <SourceBadge sourceName={series.sourceName} sourceUrl={series.sourceUrl} reliability="secondary" compact />
                </div>
              </div>
            );
          })}
        </div>
        <ResearchNote title="How to use this">
          <p>
            None of these numbers are warnings on their own &mdash; an open, trading economy is
            usually a richer one. They&rsquo;re a map of where to look first when global headlines
            turn unsettled: a trade dispute would be felt through the first channel, a travel
            slowdown through the second, and a sharp currency move through the third.
          </p>
        </ResearchNote>
      </section>
    </div>
  );
}
