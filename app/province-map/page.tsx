import GlassCard from '@/components/GlassCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import ScoreBars from '@/components/ScoreBars';
import SourceBadge from '@/components/SourceBadge';
import { ChartExportWrapper } from '@/components/ChartExportControls';
import { averageScores, latestValue, latestYear } from '@/lib/analytics';
import { findSeries, formatValue } from '@/lib/data';

export default function ProvinceMapPage() {
  // ── Series ────────────────────────────────────────────────────────────────
  const urbanPopulation       = findSeries('real_estate_urban_urban_population_total');
  const servicesEmployment    = findSeries('labor_market_employment_in_services_total');
  const agricultureEmployment = findSeries('labor_market_employment_in_agriculture_total');
  const bangkokHousing        = findSeries('real_estate_urban_new_housing_units_launched_bangkok_thousands');
  const propertyPrice         = findSeries('real_estate_urban_residential_property_price_index_2015100');
  const internetUsers         = findSeries('technology_digital_internet_users_population');
  const digitalPayments       = findSeries('technology_digital_digital_payment_transactions_billion_thb');
  const mobileSubscriptions   = findSeries('technology_digital_mobile_subscriptions_per_100_people');
  const poverty               = findSeries('poverty_headcount_natl_pct');
  const gini                  = findSeries('gini_index');

  // ── Composite scores ──────────────────────────────────────────────────────
  const urbanConcentration = averageScores([
    { series: urbanPopulation,    weight: 1.2 },
    { series: servicesEmployment, weight: 1   },
    { series: bangkokHousing,     weight: 1   },
  ]);
  const inclusionReadiness = averageScores([
    { series: internetUsers,       weight: 1   },
    { series: mobileSubscriptions, weight: 0.8 },
    { series: digitalPayments,     weight: 1.2 },
  ]);
  const ruralStrain = averageScores([
    { series: agricultureEmployment, weight: 1   },
    { series: poverty,               weight: 1.1 },
    { series: gini,                  weight: 0.9 },
  ]);

  const scoreItems = [
    {
      label: 'Urban concentration pulse',
      score: urbanConcentration ?? 0,
      note: 'Blend of urban population share (×1.2), services employment (×1.0), and Bangkok housing launches (×1.0). Higher means growth still appears to be pulling toward core urban corridors.',
      tone: 'primary' as const,
    },
    {
      label: 'Inclusion readiness',
      score: inclusionReadiness ?? 0,
      note: 'Blend of internet access (×1.0), mobile density (×0.8), and digital payments (×1.2). Higher means the infrastructure for broader provincial participation looks stronger than earlier in the sample.',
      tone: 'secondary' as const,
    },
    {
      label: 'Rural strain',
      score: ruralStrain ?? 0,
      note: 'Blend of agriculture employment (×1.0), poverty headcount (×1.1), and Gini coefficient (×0.9). Higher means the national backdrop still points to a meaningful rural-urban development gap.',
      tone: 'warning' as const,
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
          A geographic lens on growth
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          Where is Thailand&rsquo;s economic gravity pulling?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          The dataset is national rather than provincial, so this page focuses on the structural signals
          that drive regional divergence: urbanization, labor mix, housing pressure, digital reach,
          poverty, and inequality. Think of it as a geographic lens on a national picture — not a
          province-by-province breakdown.
        </p>
      </header>

      <DemoDataBanner />

      {/* ── Urban concentration ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            Urban concentration
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Bangkok and the pull toward city corridors
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Thailand&rsquo;s urbanization story is fundamentally a Bangkok story. Housing launches,
            services employment, and rising urban population share all point to activity continuing to
            cluster around the capital and its surrounding industrial zones.
          </p>
        </header>

        <GlassCard
          title="Center of gravity keeps shifting toward cities"
          subtitle={`Urban population share, services, and agriculture employment — through ${latestYear(urbanPopulation) ?? 'the sample'}`}
        >
          {urbanPopulation && servicesEmployment && agricultureEmployment ? (
            <ChartExportWrapper filename="regional-urban-concentration">
              <RangeChart series={[urbanPopulation, servicesEmployment, agricultureEmployment]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {urbanPopulation && (
              <SourceBadge sourceName={urbanPopulation.sourceName} sourceUrl={urbanPopulation.sourceUrl} reliability="secondary" compact />
            )}
            {servicesEmployment && (
              <SourceBadge sourceName={servicesEmployment.sourceName} sourceUrl={servicesEmployment.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <GlassCard
          title="Bangkok housing market pressure"
          subtitle={`New housing launches and residential property price index — through ${latestYear(bangkokHousing) ?? 'the sample'}`}
        >
          {bangkokHousing && propertyPrice ? (
            <ChartExportWrapper filename="regional-bangkok-housing">
              <RangeChart series={[bangkokHousing, propertyPrice]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {bangkokHousing && (
              <SourceBadge sourceName={bangkokHousing.sourceName} sourceUrl={bangkokHousing.sourceUrl} reliability="secondary" compact />
            )}
            {propertyPrice && (
              <SourceBadge sourceName={propertyPrice.sourceName} sourceUrl={propertyPrice.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <ResearchNote title="A possible reading">
          <p>
            When price momentum stays firm while housing launches remain active, demand is still clustering
            around the capital rather than dispersing evenly &mdash; a persistent signal that spatial
            concentration is not yet unwinding.
          </p>
          <p>
            Urban population share (latest:{' '}
            <strong className="text-ink">
              {urbanPopulation ? formatValue(latestValue(urbanPopulation) ?? 0, urbanPopulation.unit) : '—'}
            </strong>
            ) and services employment (
            <strong className="text-ink">
              {servicesEmployment ? formatValue(latestValue(servicesEmployment) ?? 0, servicesEmployment.unit) : '—'}
            </strong>
            ) move closely together, which is consistent with urbanization driving sector-mix change rather than
            either series leading the other independently.
          </p>
        </ResearchNote>
      </section>

      {/* ── Digital inclusion ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            Digital inclusion
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Is digital adoption narrowing the geographic divide?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Connectivity is one of the clearest prerequisites for growth spreading beyond the Bangkok
            core into secondary cities and provincial firms. Internet penetration, mobile density, and
            digital payments adoption show whether that infrastructure is materializing broadly.
          </p>
        </header>

        <GlassCard
          title="Digital payment transactions — proxy for commerce digitization"
          subtitle={`Total transaction value — through ${latestYear(digitalPayments) ?? 'the sample'}`}
        >
          {digitalPayments ? (
            <ChartExportWrapper filename="regional-digital-payments">
              <RangeChart series={digitalPayments} variant="area" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {digitalPayments && (
              <SourceBadge sourceName={digitalPayments.sourceName} sourceUrl={digitalPayments.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <GlassCard
          title="Connectivity infrastructure"
          subtitle={`Internet users (% of population) and mobile subscriptions (per 100 people) — through ${latestYear(internetUsers) ?? 'the sample'}`}
        >
          {internetUsers && mobileSubscriptions ? (
            <ChartExportWrapper filename="regional-connectivity">
              <RangeChart series={[internetUsers, mobileSubscriptions]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {internetUsers && (
              <SourceBadge sourceName={internetUsers.sourceName} sourceUrl={internetUsers.sourceUrl} reliability="secondary" compact />
            )}
            {mobileSubscriptions && (
              <SourceBadge sourceName={mobileSubscriptions.sourceName} sourceUrl={mobileSubscriptions.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <ResearchNote title="What &lsquo;inclusion readiness&rsquo; can and cannot tell you">
          <p>
            The inclusion readiness score ({inclusionReadiness !== null ? `${inclusionReadiness}/100` : '—'})
            captures whether the national infrastructure for broader participation is in place, not whether it
            is actually being used equally across provinces. High national internet penetration does not guarantee
            equal provincial access &mdash; it means the preconditions are largely present.
          </p>
          <p>
            In a dataset without provincial breakdowns, digital payments act as a practical bridge variable.
            They capture whether households and small firms are moving deeper into formal, trackable commerce &mdash;
            often a precondition for growth spreading outside the main metropolitan core.
          </p>
        </ResearchNote>
      </section>

      {/* ── Inequality & rural gap ──────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            Inequality &amp; rural strain
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How wide is the rural-urban development gap?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            National poverty and inequality numbers do not tell you which province is strained, but
            they do tell you whether the macro backdrop is likely to amplify regional disparity instead
            of absorbing it.
          </p>
        </header>

        <GlassCard
          title="Poverty and inequality trends"
          subtitle={`Poverty headcount (% national) and Gini index — through ${latestYear(poverty) ?? 'the sample'}`}
        >
          {poverty && gini ? (
            <ChartExportWrapper filename="regional-poverty-gini">
              <RangeChart series={[poverty, gini]} variant="line" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {poverty && (
              <SourceBadge sourceName={poverty.sourceName} sourceUrl={poverty.sourceUrl} reliability="secondary" compact />
            )}
            {gini && (
              <SourceBadge sourceName={gini.sourceName} sourceUrl={gini.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <GlassCard
          title="Agriculture employment share"
          subtitle={`Share of total employment in agriculture — through ${latestYear(agricultureEmployment) ?? 'the sample'}`}
        >
          {agricultureEmployment ? (
            <ChartExportWrapper filename="regional-agriculture-employment">
              <RangeChart series={agricultureEmployment} variant="area" />
            </ChartExportWrapper>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {agricultureEmployment && (
              <SourceBadge sourceName={agricultureEmployment.sourceName} sourceUrl={agricultureEmployment.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>

        <ResearchNote title="Rural strain score interpretation">
          <p>
            Rural strain ({ruralStrain !== null ? `${ruralStrain}/100` : '—'}) blends agriculture
            employment share, poverty headcount, and the Gini coefficient relative to their own historical
            ranges. A higher score does not mean conditions are worsening right now &mdash; it means the
            level of these variables is currently near the high end of what this dataset has seen.
          </p>
          <p>
            A declining agriculture share reflects Thailand&rsquo;s structural shift away from rural
            livelihoods. When the decline happens faster than non-farm jobs grow in provincial areas,
            it tends to push migration toward Bangkok rather than broadening growth across regions.
          </p>
        </ResearchNote>
      </section>

      {/* ── Composite scorecard ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">
            Proxy scorecard
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Regional divergence at a glance
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Three composite scores synthesize the page&rsquo;s series into a single read on urban pull,
            digital inclusion, and rural pressure &mdash; all relative to their own historical ranges,
            not to any external benchmark.
          </p>
        </header>

        <ScoreBars
          title="Proxy scorecard for regional divergence"
          subtitle="Transparent blends of the latest reading in each series relative to its own historical range."
          items={scoreItems}
          footer="Higher scores do not mean 'good' or 'bad' — they indicate which structural story is closest to the top of its own historical range."
        />

        <ResearchNote title="Composite weighting — how each score is built">
          <p>
            Each indicator is rescaled to 0–100 relative to its own historical min-max range before
            weighting. This keeps series with different units on a common scale without losing the
            shape of their trends.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-primary hover:underline">
              Show individual weights ▸
            </summary>
            <div className="mt-3 space-y-3 text-xs leading-relaxed">
              <div>
                <p className="font-semibold text-ink">Urban concentration pulse</p>
                <p className="text-ink-muted">Urban population share (×1.2) + Services employment (×1.0) + Bangkok housing launches (×1.0)</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Inclusion readiness</p>
                <p className="text-ink-muted">Internet users (×1.0) + Mobile subscriptions (×0.8) + Digital payments (×1.2)</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Rural strain</p>
                <p className="text-ink-muted">Agriculture employment share (×1.0) + Poverty headcount (×1.1) + Gini index (×0.9)</p>
              </div>
            </div>
          </details>
        </ResearchNote>

        <ResearchNote title="What this page can and cannot claim">
          <p>
            The page does not know which province is outperforming which other because this project does
            not yet contain provincial accounts, regional wages, or provincial investment series. What
            it can do is show whether the national structure is becoming more urban, more connected, and
            more unequal in ways that usually matter for geography.
          </p>
          <p>
            The next step for a true map is clear: provincial GDP, provincial poverty,
            Bangkok-versus-upcountry price and wage data, and BOI or DBD activity at the regional level.
          </p>
        </ResearchNote>
      </section>

    </div>
  );
}
