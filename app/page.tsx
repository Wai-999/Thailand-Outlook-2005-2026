import Link from 'next/link';
import { ArrowRight, Compass, Users, FlaskConical, Briefcase, GraduationCap, Megaphone } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import MetricCard from '@/components/MetricCard';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import ThresholdDrawer from '@/components/ThresholdDrawer';
import AlertsConfigButton from '@/components/AlertsConfigButton';
import { ChartExportWrapper } from '@/components/ChartExportControls';
import { findSeries, latestPoint, formatValue } from '@/lib/data';
import { buildRiskScore } from '@/lib/stats';

// ----------------------------------------------------------------------
// Headline indicators for "What's happening in Thailand now". Each one
// is paired with a reading direction so MetricCard can color the change
// arrow correctly (a rising policy rate isn't "good" the way rising
// exports are -- the spec calls this "transparent interpretation").
// ----------------------------------------------------------------------
const HEADLINE_CODES: { code: string; label?: string; goodDirection: 'up' | 'down' | 'neutral' }[] = [
  { code: 'real_gdp_growth_pct', label: 'Real GDP growth', goodDirection: 'up' },
  { code: 'cpi_inflation_pct', label: 'Headline inflation', goodDirection: 'down' },
  { code: 'unemployment_rate_pct', label: 'Unemployment rate', goodDirection: 'down' },
  { code: 'exports_goods_usd_billion', label: 'Goods exports', goodDirection: 'up' },
  { code: 'tourism_arrivals_million', label: 'Tourist arrivals', goodDirection: 'up' },
  { code: 'exchange_rate_thb_usd', label: 'Baht per US dollar', goodDirection: 'neutral' },
];

const AUDIENCES = [
  {
    icon: Compass,
    title: 'Data analysts',
    body: 'Building models that need a clean, trustworthy Thailand baseline.',
  },
  {
    icon: Users,
    title: 'Researchers',
    body: 'Tracing how policy decisions ripple through sectors and provinces.',
  },
  {
    icon: Briefcase,
    title: 'Businesspeople',
    body: 'Assessing market entry, sector exposure, or partner risk in real time.',
  },
  {
    icon: Megaphone,
    title: 'Consultants',
    body: 'Preparing briefs where the client expects you to cite your sources.',
  },
  {
    icon: GraduationCap,
    title: 'Students',
    body: 'Learning how macro indicators connect through real data, not textbook examples.',
  },
];

export default function CommandCenterPage() {
  const gdpGrowth = findSeries('real_gdp_growth_pct');
  const inflation = findSeries('cpi_inflation_pct');
  const currentAccount = findSeries('current_account_gdp_pct');
  const publicDebt = findSeries('public_debt_gdp_pct');
  const reserves = findSeries('intl_reserves_usd_billion');
  const macroStability = findSeries('macro_stability_score');
  const tradeOpenness = findSeries('trade_openness_pct');
  const urbanPopulation = findSeries('real_estate_urban_urban_population_total');
  const digitalPayments = findSeries('technology_digital_digital_payment_transactions_billion_thb');
  const externalDebtShare = findSeries('external_debt_share_gdp_usd_pct');

  // ----------------------------------------------------------------
  // "What risks are rising?" -- a small, transparent additive score.
  // Every contribution below is a named, inspectable rule (not a
  // black-box model). This is a screening heuristic, not a forecast.
  // ----------------------------------------------------------------
  const driversInput: { label: string; contribution: number; note: string }[] = [];
  const cabValue = currentAccount ? latestPoint(currentAccount)?.value : undefined;
  if (cabValue !== undefined) {
    driversInput.push({
      label: 'External balance',
      contribution: cabValue < 0 ? Math.min(20, Math.abs(cabValue) * 6) : 0,
      note:
        cabValue < 0
          ? `Current account is in deficit at ${formatValue(cabValue, '% of GDP')} of GDP -- the country is a net borrower from the rest of the world this year.`
          : `Current account is in surplus at ${formatValue(cabValue, '% of GDP')} of GDP -- a buffer against external shocks, not a source of pressure.`,
    });
  }
  const debtValue = publicDebt ? latestPoint(publicDebt)?.value : undefined;
  if (debtValue !== undefined) {
    driversInput.push({
      label: 'Public debt load',
      contribution: Math.max(0, (debtValue - 50) * 0.6),
      note: `Public debt sits at ${formatValue(debtValue, '% of GDP')} of GDP. Levels meaningfully above the 50–60% range used in regional debt-sustainability discussions add slow-building pressure on future budgets.`,
    });
  }
  const inflValue = inflation ? latestPoint(inflation)?.value : undefined;
  if (inflValue !== undefined) {
    driversInput.push({
      label: 'Price stability',
      contribution: Math.min(15, Math.abs(inflValue - 2) * 4),
      note: `Headline inflation is running at ${formatValue(inflValue, '% Annual')}, versus a rough 2% reference point many central banks treat as "comfortable." The further from that line -- in either direction -- the more it complicates planning.`,
    });
  }
  const reservesValue = reserves ? latestPoint(reserves)?.value : undefined;
  if (reservesValue !== undefined) {
    driversInput.push({
      label: 'External reserves cushion',
      contribution: reservesValue < 150 ? 12 : reservesValue < 220 ? 5 : 0,
      note: `International reserves stand near ${formatValue(reservesValue, 'USD Billion')}. Larger reserve buffers generally mean more room to absorb a sudden swing in capital flows or the exchange rate.`,
    });
  }
  const risk = buildRiskScore(driversInput);
  const riskToneClass =
    risk.level === 'high'
      ? 'text-danger'
      : risk.level === 'elevated'
        ? 'text-secondary'
        : risk.level === 'moderate'
          ? 'text-ink-muted'
          : 'text-success';
  const riskLevelCopy: Record<typeof risk.level, string> = {
    low: 'Low — the indicators we track here look broadly steady.',
    moderate: 'Moderate — a few pressure points are worth watching, not panicking over.',
    elevated: 'Elevated — more than one pressure point is moving in the wrong direction at once.',
    high: 'High — several stress signals are flashing together; this deserves a closer look.',
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      {/* Threshold drawer — client-only, open/close controlled by Zustand */}
      <ThresholdDrawer />
      {/* ---------------------------------------------------------- */}
      {/* Hero                                                        */}
      {/* ---------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-glass-border bg-gradient-to-br from-[var(--accent-indigo)] via-[#0d3a5c] to-[var(--primary)] px-6 py-12 text-white shadow-[var(--shadow-glass-lg)] md:px-12 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--secondary)]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[var(--primary-soft)]/10 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="font-label mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80">
            Southeast Asia&rsquo;s second-largest economy, watched closely
          </p>
          <h1 className="font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight md:text-[3.5rem]">
            Thailand is at a turning point. Here&rsquo;s the data that shows you where it&rsquo;s heading.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
            Whether you&rsquo;re evaluating an investment, tracking a policy shift, or simply trying to
            understand what&rsquo;s really happening in Southeast Asia&rsquo;s fifth-largest economy
            &mdash; this is where you start.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/macro-outlook"
              className="font-label inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#312e81] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Explore the macro outlook
              <ArrowRight size={16} strokeWidth={2.25} />
            </Link>
            <Link
              href="/statistical-engine"
              className="font-label inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
            >
              See how the numbers connect
            </Link>
          </div>
        </div>
      </section>

      <DemoDataBanner />

      {/* ---------------------------------------------------------- */}
      {/* Headline metrics                                            */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Right now</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              What&rsquo;s happening in Thailand now
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
              A snapshot of the indicators that move first when Thailand&rsquo;s economy shifts &mdash;
              growth, prices, jobs, trade, tourism, and the currency that ties them together.
            </p>
          </div>
          {/* Client component: opens the threshold settings drawer */}
          <AlertsConfigButton />
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HEADLINE_CODES.map(({ code, label, goodDirection }) => {
            const series = findSeries(code);
            if (!series) return null;
            return (
              <MetricCard
                key={code}
                series={series}
                label={label}
                goodDirection={goodDirection}
                reliability="secondary"
              />
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* The bigger picture -- improving, weakening, or mixed?      */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The bigger picture</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Is the economy improving, weakening, or mixed?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            No single number answers that question. Looking at growth and prices side by side over
            two decades gives a fuller, fairer picture than either one alone.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GlassCard
            title="Growth vs. inflation, side by side"
            subtitle="Real GDP growth and headline inflation, annual"
          >
            {gdpGrowth && inflation ? (
              <ChartExportWrapper filename="command-center-gdp-vs-inflation">
                <TimeSeriesChart series={[gdpGrowth, inflation]} variant="line" />
              </ChartExportWrapper>
            ) : (
              <p className="text-sm text-ink-soft">Series unavailable.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {gdpGrowth && <SourceBadge sourceName={gdpGrowth.sourceName} sourceUrl={gdpGrowth.sourceUrl} reliability="secondary" compact />}
            </div>
          </GlassCard>
          <ResearchNote title="Reading this chart">
            <p>
              When the teal growth line sits comfortably above the gold inflation line, the economy
              is generally expanding faster than prices are rising &mdash; a combination most
              households and businesses experience as &ldquo;things feel okay.&rdquo; When the lines
              converge or cross, that&rsquo;s usually the moment commentary shifts from &ldquo;steady
              growth&rdquo; to &ldquo;cost-of-living pressure&rdquo; or &ldquo;slowdown.&rdquo;
            </p>
            <p>
              <strong className="text-ink">Worth remembering:</strong> both series are annual averages
              compiled from a research snapshot, not live releases. Use them to spot the shape of the
              story over time, not to time a decision around a single year.
            </p>
          </ResearchNote>
        </div>
        {macroStability && (
          <GlassCard
            title="A composite read: the Macro Stability Score"
            subtitle="A z-score blend of growth, inflation, fiscal, and external indicators -- above zero reads steadier than the sample average, below zero reads more strained"
          >
            <ChartExportWrapper filename="command-center-macro-stability">
              <TimeSeriesChart series={macroStability} variant="area" yDomain={['auto', 'auto']} />
            </ChartExportWrapper>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              This composite is a transparent average of standardized indicators, not an official
              statistic &mdash; evidence suggests it tracks the broad mood of the economy reasonably
              well, but it should be read as one lens among several, not a verdict.
            </p>
          </GlassCard>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* What risks are rising                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Looking ahead</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            What risks are rising?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            We total up a handful of named, visible pressure points into a single screening score.
            Every point on the scale traces back to a specific number below &mdash; nothing is hidden
            inside a model.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
          <GlassCard className="items-center text-center" title={undefined}>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">Composite screening score</p>
            <p className={`font-display mt-2 text-6xl font-bold ${riskToneClass}`}>{risk.score}</p>
            <p className="text-xs text-ink-soft">out of 100 &mdash; higher means more pressure points active at once</p>
            <p className={`font-label mt-3 text-sm font-semibold capitalize ${riskToneClass}`}>{risk.level}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{riskLevelCopy[risk.level]}</p>
          </GlassCard>
          <GlassCard title="Where each point comes from" subtitle="Named drivers, plain-language reasoning -- this is a heuristic screening tool, not a prediction">
            <ul className="flex flex-col gap-3">
              {risk.drivers.map((d) => (
                <li key={d.label} className="flex gap-3 rounded-[var(--radius-md)] border border-glass-border bg-surface/60 px-4 py-3">
                  <span className="font-display mt-0.5 w-12 shrink-0 text-right text-lg font-bold text-primary">
                    +{d.contribution.toFixed(0)}
                  </span>
                  <div>
                    <p className="font-label text-sm font-semibold text-ink">{d.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{d.note}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              <strong className="text-ink-muted">Assumptions &amp; limitations:</strong> contributions are
              simple, named rules calibrated to commonly cited reference ranges (not official thresholds);
              the score reflects only the four indicators above, is recalculated from the latest year in
              this snapshot, and should be treated as a conversation-starter for &ldquo;what to watch,&rdquo;
              not a forecast of what will happen.
            </p>
          </GlassCard>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">New analytical lenses</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Four ways to read Thailand beyond the headline dashboard
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            The site now goes deeper on geography, external exposure, research methods, and scenario framing.
            These aren&rsquo;t dead-end pages anymore; they&rsquo;re working analytical routes built from the same dataset underneath the core dashboard.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlassCard
            title="Province Map"
            subtitle="Structural geography without pretending we have province-level accounts"
            footer={
              <Link href="/province-map" className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Open the geographic briefing
              </Link>
            }
          >
            <p className="font-display text-3xl font-bold text-primary">
              {urbanPopulation ? formatValue(latestPoint(urbanPopulation)?.value ?? 0, urbanPopulation.unit) : '—'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Urban population share is one of the clearest proxies for where demand, jobs, and housing pressure are concentrating.
            </p>
          </GlassCard>
          <GlassCard
            title="Trade Network"
            subtitle="Demand dependence, buffers, and currency sensitivity in one frame"
            footer={
              <Link href="/trade-network" className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Open the external system view
              </Link>
            }
          >
            <p className="font-display text-3xl font-bold text-secondary">
              {tradeOpenness ? formatValue(latestPoint(tradeOpenness)?.value ?? 0, tradeOpenness.unit) : '—'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Trade openness tells you how quickly a global demand shock is likely to show up at home.
            </p>
          </GlassCard>
          <GlassCard
            title="Research Library"
            subtitle="Method notes, source classes, and where to go for the full explanation"
            footer={
              <Link href="/research-library" className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Open the library
              </Link>
            }
          >
            <p className="font-display text-3xl font-bold text-[var(--accent-indigo)]">Methods first</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Every important modeled or proxy view now has an obvious explanatory home rather than living only inside chart captions.
            </p>
          </GlassCard>
          <GlassCard
            title="Digital & external cross-currents"
            subtitle="A quick sense of how structural change and exposure can coexist"
            footer={
              <Link href="/forecast-lab" className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Stress-test the path
              </Link>
            }
          >
            <div className="flex flex-wrap items-end gap-5">
              <div>
                <p className="font-display text-3xl font-bold text-success">
                  {digitalPayments ? formatValue(latestPoint(digitalPayments)?.value ?? 0, digitalPayments.unit) : '—'}
                </p>
                <p className="mt-1 text-xs text-ink-soft">digital payments</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-warning">
                  {externalDebtShare ? formatValue(latestPoint(externalDebtShare)?.value ?? 0, externalDebtShare.unit) : '—'}
                </p>
                <p className="mt-1 text-xs text-ink-soft">external debt / GDP</p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Thailand can deepen digitally while still carrying meaningful exposure to the outside world; both stories matter at the same time.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Who this is for                                             */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Built for the way you work</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">Who comes here, and why</h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass-card flex flex-col gap-3 p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <p className="font-label text-base font-semibold text-ink">{title}</p>
              <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
          <div className="flex flex-col justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-glass-border bg-surface/40 p-5">
            <FlaskConical size={20} strokeWidth={1.75} className="text-secondary" />
            <p className="text-sm leading-relaxed text-ink-muted">
              Not seeing your situation here? The data underneath is the same for everyone &mdash;
              start with whichever question feels closest to yours.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Closing CTA                                                 */}
      {/* ---------------------------------------------------------- */}
      <section className="glass-strong flex flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-glass-border px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">
            Thailand&rsquo;s story is made of many layers &mdash; growth, policy, trade, geography, risk.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted md:text-base">
            Pick your starting point, and follow the thread that matters to you.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sector-intelligence"
            className="font-label inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Walk through the sectors
            <ArrowRight size={16} strokeWidth={2.25} />
          </Link>
          <Link
            href="/forecast-lab"
            className="font-label inline-flex items-center gap-2 rounded-full border border-glass-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-primary/40 hover:text-primary"
          >
            Look toward the forecast lab
          </Link>
        </div>
      </section>
    </div>
  );
}
