import GlassCard from '@/components/GlassCard';
import MetricCard from '@/components/MetricCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import { findSeries, latestPoint, formatValue } from '@/lib/data';

export default function HouseholdDebtPage() {
  const householdDebt = findSeries('household_debt_gdp_pct');
  const householdDebtAlt = findSeries('financial_access_household_debt_gdp');
  const consumptionGrowth = findSeries('consumer_market_household_consumption_growth');
  const publicDebt = findSeries('public_debt_gdp_pct');
  const externalDebtShare = findSeries('external_debt_share_gdp_usd_pct');
  const debtPressure = findSeries('debt_pressure_index');

  const householdLatest = householdDebt ? latestPoint(householdDebt) : undefined;
  const altLatest = householdDebtAlt ? latestPoint(householdDebtAlt) : undefined;
  const showsDiscrepancy =
    householdLatest && altLatest && Math.abs(householdLatest.value - altLatest.value) >= 1;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">How households are coping</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          How exposed are Thai households to a squeeze on their finances?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          Behind every GDP figure are millions of households making their own calls about saving,
          borrowing, and spending. Thailand&rsquo;s household debt has climbed to among the
          highest in the region relative to the size of its economy &mdash; a fact that barely
          shows up in headline growth numbers but matters enormously for how much room households
          have left to absorb a shock.
        </p>
      </header>

      <DemoDataBanner />

      {/* ------------------------------------------------------------------ */}
      {/* How large has the debt load grown, and is it slowing?               */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The headline ratio</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How large has household debt grown relative to the economy &mdash; and is that climb slowing?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            The ratio below compares total household borrowing with the size of the whole economy.
            A rising line doesn&rsquo;t only mean households are borrowing more in absolute terms
            &mdash; it can also mean their debts are growing faster than their incomes, which is
            the more uncomfortable version of the story.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {householdDebt && (
            <MetricCard series={householdDebt} label="Household debt" goodDirection="down" reliability="secondary" />
          )}
          {publicDebt && <MetricCard series={publicDebt} label="Public debt" goodDirection="down" reliability="secondary" />}
          {consumptionGrowth && (
            <MetricCard series={consumptionGrowth} label="Household spending growth" goodDirection="up" reliability="secondary" />
          )}
          {debtPressure && (
            <MetricCard series={debtPressure} label="Debt pressure (composite)" goodDirection="down" reliability="secondary" />
          )}
        </div>
        <GlassCard
          title="Borrowing growth against spending growth"
          subtitle="Household debt (% of GDP) vs. household consumption growth (annual %)"
        >
          {householdDebt && consumptionGrowth ? (
            <RangeChart series={[householdDebt, consumptionGrowth]} variant="line" />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {householdDebt && (
              <SourceBadge sourceName={householdDebt.sourceName} sourceUrl={householdDebt.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>
        <ResearchNote title="A possible reading">
          <p>
            {householdLatest && householdDebt && (
              <>
                The latest reading puts household debt at roughly{' '}
                {formatValue(householdLatest.value, householdDebt.unit)} of GDP &mdash; a level that
                ranks among the highest in the region relative to the size of the economy it sits
                on top of.{' '}
              </>
            )}
            On its own, a high ratio isn&rsquo;t a crisis signal; plenty of wealthier economies
            carry similar loads. What tends to matter more is the direction of travel and how it
            compares with income growth: a ratio that keeps climbing while consumption growth
            cools is the combination worth watching most closely, since it suggests households are
            taking on more obligation just as their capacity to service it is growing more slowly.
          </p>
          {showsDiscrepancy && householdDebtAlt && altLatest && householdDebt && householdLatest && (
            <p>
              <strong className="text-ink">Worth being careful about:</strong> this compiled
              snapshot actually carries two vintages of the same underlying Bank of Thailand
              household-debt series &mdash; one reading {formatValue(householdLatest.value, householdDebt.unit)}{' '}
              for its latest year, the other {formatValue(altLatest.value, householdDebtAlt.unit)}.
              Differences like this are normal when official statistics get revised, rebased, or
              re-compiled by different sources at different times &mdash; but they&rsquo;re a good
              reminder to read the trend and the order of magnitude, not the decimal point, and to
              check the original publisher before quoting any single figure precisely.
            </p>
          )}
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Is the buildup concentrated in households, or broader?              */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Whose balance sheet</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Is the debt buildup mostly a household story, or a broader one?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Households aren&rsquo;t the only ones carrying obligations &mdash; the government and
            the country as a whole (through debt owed abroad) do too. Setting all three side by
            side, on the same scale, shows whether Thailand&rsquo;s debt story is concentrated in
            one place or spread across the economy.
          </p>
        </header>
        <GlassCard
          title="Three balance sheets, one chart"
          subtitle="Household debt, public debt, and external debt — each as a share of GDP"
        >
          {householdDebt && publicDebt && externalDebtShare ? (
            <RangeChart series={[householdDebt, publicDebt, externalDebtShare]} variant="line" />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
        </GlassCard>
        <ResearchNote title="How to read this">
          <p>
            These three ratios measure different things and respond to different pressures &mdash;
            household debt tracks consumer borrowing and property markets, public debt tracks
            fiscal choices and crisis-era spending, and external debt tracks how reliant the
            country is on foreign creditors and currency markets. When more than one line is
            climbing at the same time, it&rsquo;s a sign that financial strain isn&rsquo;t confined
            to a single corner of the economy &mdash; which is exactly the kind of pattern that
            makes a shock harder to absorb, because there&rsquo;s less spare capacity anywhere to
            cushion it.
          </p>
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How much pressure has built up overall?                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Putting it on one scale</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Add it all up: how much debt pressure has built up, and where is it headed?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            The compiled dataset includes a composite &ldquo;debt pressure&rdquo; reading &mdash; a
            way of putting several debt-related signals onto one comparable (z-score) scale, where
            zero marks roughly the historical average and positive readings mark periods running
            hotter than that average.
          </p>
        </header>
        <GlassCard title="Debt pressure index" subtitle="Composite z-score — positive values mark periods of above-average debt strain">
          {debtPressure ? (
            <RangeChart series={debtPressure} />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {debtPressure && (
              <SourceBadge sourceName={debtPressure.sourceName} sourceUrl={debtPressure.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>
        <ResearchNote title="What a composite like this is — and isn't">
          <p>
            A single blended number is convenient, but it also hides its ingredients: it can rise
            because every component nudged up a little, or because one component spiked while the
            others held steady, and the chart alone can&rsquo;t tell you which. Treat a reading
            like this as a prompt to look back at the individual debt ratios above &mdash; the
            composite is most useful for spotting <em>when</em> pressure has been building, while
            the component charts are what explain <em>why</em>.
          </p>
        </ResearchNote>
      </section>
    </div>
  );
}
