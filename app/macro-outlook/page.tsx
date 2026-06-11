import { Suspense } from 'react';
import GlassCard from '@/components/GlassCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import MacroTrendSection from './MacroTrendSection';
import CountryCompare from './CountryCompare';
import { ChartExportWrapper } from '@/components/ChartExportControls';
import { findSeries } from '@/lib/data';

export default function MacroOutlookPage() {
  const gdpGrowth = findSeries('real_gdp_growth_pct');
  const consumption = findSeries('consumer_market_household_consumption_growth');
  const investment = findSeries('investment_capital_private_investment_growth');
  const exportsYoy = findSeries('exports_goods_yoy_pct');
  const inflation = findSeries('cpi_inflation_pct');
  const policyRate = findSeries('policy_rate_yearend_pct');

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The engine room</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          What actually drives Thailand&rsquo;s growth?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          GDP growth is a single headline built from many moving parts &mdash; how much households
          spend, how much businesses invest, how much the world buys from Thailand, and how the
          central bank steers prices in between. This page lays those parts side by side.
        </p>
      </header>

      <DemoDataBanner />

      {/* ------------------------------------------------------------------ */}
      {/* What drives GDP growth?                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Inside the headline number</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            What drives GDP growth?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Households spending and businesses investing are the two engines that run hottest, most
            of the time. Lining them up against headline growth shows how closely they move together
            &mdash; and where they diverge.
          </p>
        </header>
        <GlassCard
          title="The domestic engine: growth, spending, and investment"
          subtitle="Real GDP growth vs. household consumption growth vs. private investment growth, annual"
        >
          {gdpGrowth && consumption && investment ? (
            <ChartExportWrapper filename="macro-domestic-engine">
              <RangeChart series={[gdpGrowth, consumption, investment]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {gdpGrowth && <SourceBadge sourceName={gdpGrowth.sourceName} sourceUrl={gdpGrowth.sourceUrl} reliability="secondary" compact />}
            {consumption && <SourceBadge sourceName={consumption.sourceName} sourceUrl={consumption.sourceUrl} reliability="secondary" compact />}
          </div>
        </GlassCard>
        <ResearchNote title="A possible reading">
          <p>
            When consumption and investment swing in the same direction as headline growth &mdash;
            and usually with more amplitude &mdash; that&rsquo;s consistent with the textbook story:
            domestic demand is doing most of the work, for better or worse. Sharp investment dips
            that headline growth doesn&rsquo;t fully share can be an early tell that businesses are
            more cautious than the aggregate number suggests.
          </p>
          <p>
            <strong className="text-ink">Worth being careful about:</strong> moving together is not
            the same as one causing the other. Evidence suggests these three are tightly linked in
            Thailand&rsquo;s economy, but the direction of cause-and-effect runs both ways &mdash;
            growth fuels confidence, and confidence fuels growth.
          </p>
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How do inflation, policy rate, exports & consumption interact?      */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The feedback loop</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How do prices, policy, and demand interact?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            The Bank of Thailand sets its policy rate partly in response to inflation &mdash; and that
            rate, in turn, shapes how freely households spend and the country trades with the world.
            Three views of that loop, side by side.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GlassCard
            title="Prices and the policy response"
            subtitle="Headline CPI inflation vs. the Bank of Thailand's policy interest rate"
          >
            {inflation && policyRate ? (
              <ChartExportWrapper filename="macro-prices-policy">
                <RangeChart series={[inflation, policyRate]} variant="line" />
              </ChartExportWrapper>
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
          </GlassCard>
          <GlassCard
            title="Demand at home and abroad"
            subtitle="Household consumption growth vs. goods-export growth, year over year"
          >
            {consumption && exportsYoy ? (
              <ChartExportWrapper filename="macro-demand-home-abroad">
                <RangeChart series={[consumption, exportsYoy]} variant="line" />
              </ChartExportWrapper>
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
          </GlassCard>
        </div>
        <ResearchNote title="A possible reading">
          <p>
            When inflation runs hot, a rate increase usually follows within the same year or the
            next &mdash; a possible causal pathway, not a guarantee, since the central bank also
            weighs growth, the currency, and global conditions. Higher rates then tend to cool
            household spending by making borrowing and saving trade-offs less attractive to spend
            freely.
          </p>
          <p>
            Export growth, meanwhile, often swings on factors well outside Thailand&rsquo;s
            borders &mdash; global demand cycles, shipping costs, currency moves &mdash; which is
            part of why it doesn&rsquo;t always track domestic consumption. A widening gap between
            the two lines is usually a sign that external, not internal, forces are setting the pace.
          </p>
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Above or below trend? (interactive — stats update with selection)   */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Putting today in context</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Is current growth above or below its long-run trend?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            A single year rarely tells you much on its own. Fitting a straight line through two
            decades of growth gives a simple, visible reference point &mdash; and shows exactly how
            that line was drawn. Drag on the chart to refit the trend to any sub-period and watch
            the statistics update in real time.
          </p>
        </header>
        {gdpGrowth ? (
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/30" />}>
            <MacroTrendSection gdpGrowth={gdpGrowth} />
          </Suspense>
        ) : (
          <p className="text-sm text-ink-soft">GDP growth series unavailable.</p>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Regional peer comparison                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Regional context</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How does Thailand compare with its ASEAN neighbours?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            GDP growth, inflation, and trade integration for Vietnam, Indonesia, Malaysia, and
            the Philippines &mdash; overlaid on Thailand&rsquo;s own lines. Select one or more
            countries below to add their series to the charts.
          </p>
        </header>
        <CountryCompare
          thaGdp={gdpGrowth ?? undefined}
          thaInflation={inflation ?? undefined}
        />
      </section>
    </div>
  );
}
