import GlassCard from '@/components/GlassCard';
import MetricCard from '@/components/MetricCard';
import RangeChart from '@/components/RangeChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import { findSeries, latestPoint, formatValue } from '@/lib/data';

export default function InvestmentTrackerPage() {
  const capitalFormation = findSeries('gross_capital_formation_gdp_pct');
  const fixedCapitalFormation = findSeries('gross_fixed_capital_formation_gdp_pct');
  const privateInvestmentGrowth = findSeries('investment_capital_private_investment_growth');
  const fdiShareGdp = findSeries('investment_capital_fdi_net_inflows_gdp');
  const fdiUsdBn = findSeries('investment_capital_fdi_net_inflows_usd_bn');
  const fdiUsdBnAlt = findSeries('fdi_net_inflows_usd_billion');
  const boiApproved = findSeries('investment_capital_boi_approved_investments_usd_bn');

  const formationLatest = capitalFormation ? latestPoint(capitalFormation) : undefined;
  const formationFirst = capitalFormation?.points[0];
  const fdiLatest = fdiUsdBn ? latestPoint(fdiUsdBn) : undefined;
  const fdiAltLatest = fdiUsdBnAlt ? latestPoint(fdiUsdBnAlt) : undefined;
  const showsDiscrepancy = fdiLatest && fdiAltLatest && Math.abs(fdiLatest.value - fdiAltLatest.value) >= 1;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Where confidence is building</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          Where is investment actually flowing, and where is confidence still missing?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          Investment is a vote of confidence in the future &mdash; a business or a foreign investor
          putting money into machinery, buildings, or new operations is betting that the payoff is
          still years away but worth waiting for. Watching where that vote lands, and how it
          compares with the plans that were announced, is one of the more honest ways to gauge
          how the economy&rsquo;s outlook actually looks to the people deciding where to put their money.
        </p>
      </header>

      <DemoDataBanner />

      {/* ------------------------------------------------------------------ */}
      {/* Is investment accelerating, holding, or losing ground?              */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The big picture</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Is investment accelerating, holding steady, or slowly losing ground?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            The cleanest way to track investment over the long run is as a share of the whole
            economy &mdash; that strips out the effect of the economy simply growing larger, and
            isolates whether Thailand is actually devoting more or less of itself to building for
            the future.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capitalFormation && (
            <MetricCard series={capitalFormation} label="Gross capital formation" goodDirection="up" reliability="secondary" />
          )}
          {privateInvestmentGrowth && (
            <MetricCard series={privateInvestmentGrowth} label="Private investment growth" goodDirection="up" reliability="secondary" />
          )}
          {fdiShareGdp && (
            <MetricCard series={fdiShareGdp} label="FDI net inflows" goodDirection="up" reliability="secondary" />
          )}
          {boiApproved && (
            <MetricCard series={boiApproved} label="BOI-approved investment plans" goodDirection="up" reliability="secondary" />
          )}
        </div>
        <GlassCard
          title="How much of the economy goes into building for the future"
          subtitle="Gross capital formation vs. gross fixed capital formation, both as % of GDP"
        >
          {capitalFormation && fixedCapitalFormation ? (
            <RangeChart series={[capitalFormation, fixedCapitalFormation]} variant="line" />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {capitalFormation && (
              <SourceBadge sourceName={capitalFormation.sourceName} sourceUrl={capitalFormation.sourceUrl} reliability="secondary" compact />
            )}
          </div>
        </GlassCard>
        <ResearchNote title="A possible reading">
          <p>
            {capitalFormation && formationFirst && formationLatest && (
              <>
                Across this dataset&rsquo;s span, the investment share of the economy has drifted
                down &mdash; from roughly {formatValue(formationFirst.value, capitalFormation.unit)} in{' '}
                {formationFirst.date.slice(0, 4)} to about {formatValue(formationLatest.value, capitalFormation.unit)}{' '}
                more recently.{' '}
              </>
            )}
            A gentle, gradual decline like that is common as economies mature &mdash; there&rsquo;s
            simply less catching-up infrastructure left to build. A sharper or more sustained drop
            is the more interesting case to watch, since it can also signal that businesses see
            fewer attractive opportunities, or that financing for new projects has become harder
            to come by.
          </p>
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Plans vs. capital that actually arrives                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Intentions vs. reality</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Where&rsquo;s the gap between announced investment plans and the capital that actually shows up?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Approved investment applications are a forward-looking signal &mdash; they show what
            businesses <em>say</em> they intend to build. Net foreign direct investment inflows are
            the harder, after-the-fact number: capital that has actually crossed the border and
            landed. Comparing the two is one way to see whether stated confidence is converting
            into real commitments, or stalling somewhere between the announcement and the wire transfer.
          </p>
        </header>
        <GlassCard
          title="Announced plans alongside capital that lands"
          subtitle="BOI-approved investment applications vs. FDI net inflows, both in USD billion"
        >
          {boiApproved && fdiUsdBn ? (
            <RangeChart series={[boiApproved, fdiUsdBn]} variant="line" />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
        </GlassCard>
        <ResearchNote title="How to read this">
          <p>
            These two series measure genuinely different things, so they won&rsquo;t move in
            lockstep &mdash; approvals can run well ahead of inflows (projects take years to break
            ground), and a single large foreign acquisition can make inflows spike in a year with
            no matching jump in approvals. What&rsquo;s worth watching is less the gap in any one
            year and more whether the two trend in the same direction over several years. When
            they diverge for a long stretch &mdash; plans climbing while realized capital stalls,
            say &mdash; that&rsquo;s usually a prompt to ask what&rsquo;s getting in the way between
            the announcement and the ribbon-cutting: financing, permitting, politics, or simply
            patience running out.
          </p>
        </ResearchNote>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Domestic appetite vs. the foreign vote of confidence               */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Two kinds of confidence</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Are domestic businesses and foreign investors reading the outlook the same way?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Domestic firms expanding their own operations and foreign investors choosing to commit
            capital are two distinct votes of confidence &mdash; one local, one international. They
            don&rsquo;t always agree, and when they don&rsquo;t, the disagreement itself is often
            the more interesting story.
          </p>
        </header>
        <GlassCard
          title="Two confidence signals, side by side"
          subtitle="Private investment growth (annual %) vs. FDI net inflows (% of GDP)"
        >
          {privateInvestmentGrowth && fdiShareGdp ? (
            <RangeChart series={[privateInvestmentGrowth, fdiShareGdp]} variant="line" />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
        </GlassCard>
        <ResearchNote title="Worth being careful about">
          <p>
            {showsDiscrepancy && fdiUsdBn && fdiUsdBnAlt && fdiLatest && fdiAltLatest ? (
              <>
                This compiled snapshot actually carries two vintages of Thailand&rsquo;s FDI
                inflow data &mdash; one putting the latest reading at roughly{' '}
                {formatValue(fdiLatest.value, fdiUsdBn.unit)}, the other at roughly{' '}
                {formatValue(fdiAltLatest.value, fdiUsdBnAlt.unit)}. That&rsquo;s a reminder that
                even a single, seemingly factual number like &ldquo;FDI inflows&rdquo; depends on
                methodology choices &mdash; what counts as direct investment, how reinvested
                earnings are treated, which balance-of-payments revision is used &mdash; that can
                shift the figure meaningfully. Treat any cross-country FDI comparison with the
                same caution: different statistical agencies make different calls, and a like-for-like
                comparison takes more digging than lining up two headline numbers.
              </>
            ) : (
              <>
                Investment figures are some of the more methodology-sensitive numbers in any
                compiled dataset &mdash; what counts as &ldquo;direct&rdquo; investment, how
                reinvested earnings are treated, and which balance-of-payments revision is used
                can all shift a headline figure noticeably. Treat any single year&rsquo;s reading as
                an estimate worth checking against the original publisher before drawing firm conclusions from it.
              </>
            )}
          </p>
        </ResearchNote>
      </section>
    </div>
  );
}
