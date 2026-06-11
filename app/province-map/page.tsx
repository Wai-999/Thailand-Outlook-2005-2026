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

export default function ProvinceMapPage() {
  // ── Series ────────────────────────────────────────────────────────────────
  const urbanPopulation    = findSeries('real_estate_urban_urban_population_total');
  const servicesEmployment = findSeries('labor_market_employment_in_services_total');
  const agricultureEmployment = findSeries('labor_market_employment_in_agriculture_total');
  const bangkokHousing     = findSeries('real_estate_urban_new_housing_units_launched_bangkok_thousands');
  const propertyPrice      = findSeries('real_estate_urban_residential_property_price_index_2015100');
  const internetUsers      = findSeries('technology_digital_internet_users_population');
  const digitalPayments    = findSeries('technology_digital_digital_payment_transactions_billion_thb');
  const mobileSubscriptions = findSeries('technology_digital_mobile_subscriptions_per_100_people');
  const poverty            = findSeries('poverty_headcount_natl_pct');
  const gini               = findSeries('gini_index');

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

  // ── Signal items ──────────────────────────────────────────────────────────
  const signalItems = [
    {
      label: 'Urban population share',
      value: urbanPopulation ? formatValue(latestValue(urbanPopulation) ?? 0, urbanPopulation.unit) : '—',
      change: urbanPopulation && percentChange(urbanPopulation, 3) !== null
        ? `${percentChange(urbanPopulation, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'A higher urban share means activity is concentrating around large service and logistics hubs rather than diffusing evenly across provinces.',
      tone: 'primary' as const,
    },
    {
      label: 'Services employment',
      value: servicesEmployment ? formatValue(latestValue(servicesEmployment) ?? 0, servicesEmployment.unit) : '—',
      change: servicesEmployment && percentChange(servicesEmployment, 3) !== null
        ? `${percentChange(servicesEmployment, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'Service-heavy employment mixes usually favor Bangkok and other major urban corridors.',
      tone: 'secondary' as const,
    },
    {
      label: 'Bangkok housing launches',
      value: bangkokHousing ? formatValue(latestValue(bangkokHousing) ?? 0, bangkokHousing.unit) : '—',
      change: bangkokHousing && percentChange(bangkokHousing, 3) !== null
        ? `${percentChange(bangkokHousing, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'Housing supply in Bangkok is a clean read on where developers still expect demand, credit formation, and migration pressure to hold up.',
      tone: 'warning' as const,
    },
    {
      label: 'Digital payments',
      value: digitalPayments ? formatValue(latestValue(digitalPayments) ?? 0, digitalPayments.unit) : '—',
      change: digitalPayments && percentChange(digitalPayments, 3) !== null
        ? `${percentChange(digitalPayments, 3)!.toFixed(1)}% vs 3y ago` : undefined,
      note: 'Payments adoption signals whether commerce and formalization are broadening beyond legacy cores.',
      tone: 'success' as const,
    },
  ];

  // ── Score items ───────────────────────────────────────────────────────────
  const scoreItems = [
    {
      label: 'Urban concentration pulse',
      score: urbanConcentration ?? 0,
      note: 'Blend of urban population share, service-sector employment, and Bangkok housing launches. Higher means growth still appears to be pulling toward core urban corridors.',
      tone: 'primary' as const,
    },
    {
      label: 'Inclusion readiness',
      score: inclusionReadiness ?? 0,
      note: 'Blend of internet access, mobile density, and digital payments. Higher means the infrastructure for broader provincial participation looks stronger than earlier in the sample.',
      tone: 'secondary' as const,
    },
    {
      label: 'Rural strain',
      score: ruralStrain ?? 0,
      note: 'Blend of agriculture employment, poverty, and inequality. Higher means the national backdrop still points to a meaningful rural-urban development gap.',
      tone: 'warning' as const,
    },
  ];

  // ── Shared header (shown above all tabs) ─────────────────────────────────
  const hero = (
    <>
      <PageHero
        eyebrow="A geographic lens on growth, investment, and disparity"
        title="Where is Thailand's economic gravity pulling?"
        description={
          <p>
            The dataset is national, not provincial, so this page focuses on the structural signals
            that drive regional divergence: urbanization, labor mix, housing pressure, digital reach,
            poverty, and inequality.
          </p>
        }
        metrics={[
          {
            label: 'Urban concentration pulse',
            value: urbanConcentration !== null ? `${urbanConcentration}/100` : '—',
            detail: "Relative to the dataset’s own history, not a national benchmark.",
            tone: 'primary',
          },
          {
            label: 'Inclusion readiness',
            value: inclusionReadiness !== null ? `${inclusionReadiness}/100` : '—',
            detail: 'Connectivity and payment rails that shape whether growth spreads outward.',
            tone: 'secondary',
          },
          {
            label: 'Rural strain',
            value: ruralStrain !== null ? `${ruralStrain}/100` : '—',
            detail: 'A higher reading means the rural-urban gap still looks materially present.',
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
            title="Four signals that shape the map before you ever draw one"
            subtitle="Each card is a national proxy for how concentrated or diffuse activity is likely to feel on the ground."
            items={signalItems}
          />

          <ScoreBars
            title="Proxy scorecard for regional divergence"
            subtitle="Transparent blends of the latest reading in each series relative to its own historical range."
            items={scoreItems}
            footer="Higher scores do not mean 'good' or 'bad' by themselves — they indicate which structural story is closest to the top of its own historical range."
          />

          <ResearchNote title="What this page can and cannot claim">
            <p>
              The page does not know which province is outperforming which other because this project does not yet
              contain provincial accounts, regional wages, or provincial investment series. What it can do is show
              whether the national structure is becoming more urban, more connected, and more unequal in ways that
              usually matter for geography.
            </p>
            <p>
              The next step for a true map is clear: provincial GDP, provincial poverty, Bangkok-versus-upcountry
              price and wage data, and BOI or DBD activity at the regional level.
            </p>
          </ResearchNote>
        </>
      ),
    },

    // ── Urban Concentration ─────────────────────────────────────────────────
    {
      id: 'urban',
      label: 'Urban Concentration',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
              Urban concentration
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              Bangkok and the pull toward city corridors
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Thailand's urbanization story is fundamentally a Bangkok story. Housing launches, services employment,
              and rising urban population share all point to activity continuing to cluster around the capital and
              its surrounding industrial zones.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard
              title="Center of gravity keeps shifting toward cities"
              subtitle={`Urban population share, services, and agriculture employment — through ${latestYear(urbanPopulation) ?? 'the sample'}`}
            >
              {urbanPopulation && servicesEmployment && agricultureEmployment ? (
                <TimeSeriesChart series={[urbanPopulation, servicesEmployment, agricultureEmployment]} variant="line" />
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
                <TimeSeriesChart series={[bangkokHousing, propertyPrice]} variant="line" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                When price momentum stays firm while housing launches remain active, demand is still clustering
                around the capital rather than dispersing evenly — a persistent signal that spatial concentration
                is not yet unwinding.
              </p>
            </GlassCard>
          </section>

          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/40 p-5 lg:grid-cols-3">
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Urban population share</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--primary)]">
                {urbanPopulation ? formatValue(latestValue(urbanPopulation) ?? 0, urbanPopulation.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">latest reading</p>
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Bangkok property price index</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--warning)]">
                {propertyPrice ? formatValue(latestValue(propertyPrice) ?? 0, propertyPrice.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">2015 = 100</p>
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Services employment share</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--secondary)]">
                {servicesEmployment ? formatValue(latestValue(servicesEmployment) ?? 0, servicesEmployment.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">of total employment</p>
            </div>
          </div>
        </>
      ),
    },

    // ── Digital Inclusion ───────────────────────────────────────────────────
    {
      id: 'digital',
      label: 'Digital Inclusion',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
              Digital inclusion
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              Is digital adoption narrowing the geographic divide?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Connectivity is one of the clearest prerequisites for growth spreading beyond the Bangkok core into
              secondary cities and provincial firms. Internet penetration, mobile density, and digital payments
              adoption show whether that infrastructure is materializing broadly.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard
              title="Digital payment transactions (proxy for commerce digitization)"
              subtitle={`Total transaction value — through ${latestYear(digitalPayments) ?? 'the sample'}`}
            >
              {digitalPayments ? (
                <TimeSeriesChart series={digitalPayments} variant="area" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                In a dataset without provincial breakdowns, digital payments act as a practical bridge variable.
                They capture whether households and small firms are moving deeper into formal, trackable commerce —
                often a precondition for growth spreading outside the main metropolitan core.
              </p>
              {digitalPayments && (
                <div className="mt-4">
                  <SourceBadge sourceName={digitalPayments.sourceName} sourceUrl={digitalPayments.sourceUrl} reliability="secondary" compact />
                </div>
              )}
            </GlassCard>

            <GlassCard
              title="Connectivity infrastructure"
              subtitle={`Internet users (% of population) and mobile subscriptions (per 100 people) — through ${latestYear(internetUsers) ?? 'the sample'}`}
            >
              {internetUsers && mobileSubscriptions ? (
                <TimeSeriesChart series={[internetUsers, mobileSubscriptions]} variant="line" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                Mobile subscriptions exceeding 100 per 100 people indicate near-universal basic access. The more
                interesting question is whether internet adoption is deep enough for economic participation —
                payments, credit, supply chains — beyond the urban core.
              </p>
            </GlassCard>
          </section>

          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/40 p-5 lg:grid-cols-3">
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Internet users</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--secondary)]">
                {internetUsers ? formatValue(latestValue(internetUsers) ?? 0, internetUsers.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">of population</p>
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Mobile subscriptions</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--primary)]">
                {mobileSubscriptions ? formatValue(latestValue(mobileSubscriptions) ?? 0, mobileSubscriptions.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">per 100 people</p>
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Digital payments</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--success)]">
                {digitalPayments ? formatValue(latestValue(digitalPayments) ?? 0, digitalPayments.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">transaction value (latest year)</p>
            </div>
          </div>

          <ResearchNote title="What 'inclusion readiness' can and cannot tell you">
            <p>
              Inclusion readiness (score: {inclusionReadiness !== null ? `${inclusionReadiness}/100` : '—'}) captures
              whether the national infrastructure for broader participation is in place, not whether it is actually
              being used equally across provinces. High national internet penetration does not guarantee equal
              provincial access — it means the preconditions are largely present.
            </p>
          </ResearchNote>
        </>
      ),
    },

    // ── Inequality & Rural ──────────────────────────────────────────────────
    {
      id: 'rural',
      label: 'Inequality & Rural',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--warning)]">
              Inequality &amp; rural strain
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              How wide is the rural-urban development gap?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              National poverty and inequality numbers do not tell you which province is strained, but they do tell you
              whether the macro backdrop is likely to amplify regional disparity instead of absorbing it.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard
              title="Poverty and inequality trends"
              subtitle={`Poverty headcount (% national) and Gini index — through ${latestYear(poverty) ?? 'the sample'}`}
            >
              {poverty && gini ? (
                <TimeSeriesChart series={[poverty, gini]} variant="line" />
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
                <TimeSeriesChart series={agricultureEmployment} variant="area" />
              ) : (
                <p className="text-sm text-ink-soft">Series unavailable.</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                A declining agriculture share reflects Thailand's structural shift away from rural livelihoods.
                When the decline happens faster than non-farm jobs grow in provincial areas, it tends to push
                migration toward Bangkok rather than broadening growth across regions.
              </p>
            </GlassCard>
          </section>

          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/40 p-5 lg:grid-cols-3">
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Poverty headcount</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--warning)]">
                {poverty ? formatValue(latestValue(poverty) ?? 0, poverty.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">national rate (latest)</p>
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Gini index</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--primary)]">
                {gini ? formatValue(latestValue(gini) ?? 0, gini.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">0 = perfect equality · 100 = maximum inequality</p>
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Agriculture employment</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--success)]">
                {agricultureEmployment ? formatValue(latestValue(agricultureEmployment) ?? 0, agricultureEmployment.unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">share of total employment</p>
            </div>
          </div>

          <ResearchNote title="Rural strain score interpretation">
            <p>
              Rural strain (score: {ruralStrain !== null ? `${ruralStrain}/100` : '—'}) blends agriculture
              employment share, poverty headcount, and the Gini coefficient relative to their own historical ranges.
              A higher score does not mean conditions are worsening right now — it means the level of these variables
              is currently near the high end of what this dataset has seen.
            </p>
          </ResearchNote>
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
