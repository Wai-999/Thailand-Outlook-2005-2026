import GlassCard from '@/components/GlassCard';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import ForecastFanChart from './ForecastFanChart';
import type { SerializableProjection } from './ForecastFanChart';
import { findSeries, latestPoint, formatValue } from '@/lib/data';
import { linearTrendForecast } from '@/lib/stats';

const HORIZON = 3;
const LOOKBACK = 10;

/**
 * Strip the non-serialisable predict() closure from an OLS result so the
 * projection can safely cross the server → client component boundary as a prop.
 */
function serializeProjection(
  raw: ReturnType<typeof linearTrendForecast> | null,
): SerializableProjection | null {
  if (!raw || !raw.forecast.length) return null;
  return {
    forecast: raw.forecast.map((f) => ({ date: f.date, value: f.value })),
    model: raw.model
      ? {
          slope: raw.model.slope,
          intercept: raw.model.intercept,
          rSquared: raw.model.rSquared,
          n: raw.model.n,
        }
      : null,
  };
}

export default function ForecastLabPage() {
  const gdp = findSeries('real_gdp_growth_pct');
  const inflation = findSeries('cpi_inflation_pct');
  const tourismShare = findSeries('tourism_receipts_share_gdp_usd_pct');
  const exportsShare = findSeries('exports_gdp_pct');
  const publicDebt = findSeries('public_debt_gdp_pct');
  const householdDebt = findSeries('household_debt_gdp_pct');

  // Raw projections (contain OLSResult with predict() — not serialisable as props)
  const gdpProjectionRaw = gdp ? linearTrendForecast(gdp.points, HORIZON, LOOKBACK) : null;
  const infProjectionRaw = inflation
    ? linearTrendForecast(inflation.points, HORIZON, LOOKBACK)
    : null;

  // Serialisable versions passed to the client component
  const gdpProjection = serializeProjection(gdpProjectionRaw);
  const infProjection = serializeProjection(infProjectionRaw);

  // Used in the "show the work" note and scenario arithmetic
  const baselineYear1 = gdpProjectionRaw?.forecast[0] ?? null;

  // ---- Scenario arithmetic: simple, named, fully shown -----------------
  // Each scenario states (1) an assumed shock, (2) a measured exposure
  // channel pulled straight from the data wherever one exists, and (3) a
  // plainly-labelled "how much of that reaches growth" assumption. The
  // result is a single back-of-envelope number, not a calibrated model --
  // exactly the kind of first-pass arithmetic an analyst sketches on a
  // notepad before reaching for something heavier.
  const tourismRatio = tourismShare ? (latestPoint(tourismShare)?.value ?? null) : null;
  const exportsRatio = exportsShare ? (latestPoint(exportsShare)?.value ?? null) : null;
  const debtRatio =
    publicDebt && householdDebt
      ? (latestPoint(publicDebt)?.value ?? 0) + (latestPoint(householdDebt)?.value ?? 0)
      : null;

  const tourismShockSize = 0.25; // a quarter of arrivals stay away in year one
  const tourismImpact = tourismRatio !== null ? tourismShockSize * tourismRatio : null;

  const exportShockSize = 0.1; // export revenue falls 10% on a global demand slump
  const exportPassthrough = 1 / 3; // roughly a third reaches domestic value-added; the rest is import content / leakage
  const exportImpact = exportsRatio !== null ? exportShockSize * exportsRatio * exportPassthrough : null;

  const energyCostBurdenPctGdp = 1.0; // stylized: a global price spike adds costs equal to ~1% of GDP (no oil-specific series in this dataset)
  const energyPassthrough = 0.5; // half lands as a direct drag; the rest is absorbed via reserves, subsidies, or substitution
  const energyImpact = energyCostBurdenPctGdp * energyPassthrough;

  const rateRisePp = 2; // borrowing costs rise by 2 percentage points
  const rolloverShare = 0.2; // a fifth of the combined debt stock refinances at the new rate within a year
  const debtPassthrough = 0.5; // half of the resulting squeeze comes directly out of growth-supporting spending
  const debtBurdenPctGdp = debtRatio !== null ? (rolloverShare * debtRatio * rateRisePp) / 100 : null;
  const debtImpact = debtBurdenPctGdp !== null ? debtBurdenPctGdp * debtPassthrough : null;

  const scenarios = [
    {
      id: 'tourism',
      title: 'Tourism shock',
      shock: 'A quarter of expected international arrivals stay away for a year',
      reasoning:
        tourismRatio !== null && tourismImpact !== null ? (
          <>
            Tourism receipts currently run at about <strong className="text-ink">{formatValue(tourismRatio, '%')}</strong> of
            GDP. Assume that revenue gap flows through to demand at roughly the same rate it arrived: a 25% drop in
            arrivals times a {formatValue(tourismRatio, '%')} channel works out to about{' '}
            <strong className="text-ink">{tourismImpact.toFixed(1)} percentage points</strong> off growth in the first
            year, fading as travel patterns normalize.
          </>
        ) : null,
      impact: tourismImpact,
      source: tourismShare,
    },
    {
      id: 'export',
      title: 'Export shock',
      shock: 'Global demand softens and goods-and-services export revenue falls 10%',
      reasoning:
        exportsRatio !== null && exportImpact !== null ? (
          <>
            Exports currently run at about <strong className="text-ink">{formatValue(exportsRatio, '%')}</strong> of GDP --
            a large channel, but one with heavy imported content. Assuming only around a third of any revenue loss
            reaches domestic value-added (the rest is leakage to imported parts and materials), a 10% fall works out to
            roughly <strong className="text-ink">{exportImpact.toFixed(1)} percentage points</strong> off growth.
          </>
        ) : null,
      impact: exportImpact,
      source: exportsShare,
    },
    {
      id: 'energy',
      title: 'Energy-price shock',
      shock: 'A global oil-price spike adds the equivalent of roughly 1% of GDP to the import bill',
      reasoning: (
        <>
          This dataset doesn&rsquo;t carry an oil-specific series, so the starting number here is a stylized,
          round-figure assumption rather than a measured one. If about half of that extra cost lands as a direct drag on
          growth -- the rest absorbed through reserves, subsidies, or switching to other energy sources -- that&rsquo;s
          roughly <strong className="text-ink">{energyImpact.toFixed(1)} percentage points</strong> off growth in the
          shock year.
        </>
      ),
      impact: energyImpact,
      source: null,
    },
    {
      id: 'debt',
      title: 'Debt-servicing shock',
      shock: 'Borrowing costs rise by 2 percentage points across the economy',
      reasoning:
        debtRatio !== null && debtBurdenPctGdp !== null && debtImpact !== null ? (
          <>
            Public and household debt together run at about <strong className="text-ink">{debtRatio.toFixed(0)}%</strong>{' '}
            of GDP. If roughly a fifth of that stock refinances at the new, higher rate within a year, the extra
            interest bill comes to about <strong className="text-ink">{debtBurdenPctGdp.toFixed(2)}%</strong> of GDP --
            and if half of that squeeze comes directly out of spending that would otherwise support growth, that&rsquo;s
            close to <strong className="text-ink">{debtImpact.toFixed(2)} percentage points</strong> off growth.
          </>
        ) : null,
      impact: debtImpact,
      source: publicDebt,
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Looking ahead, carefully</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          If nothing changes, where is Thailand&rsquo;s growth headed -- and what could knock it off course?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          A forecast is a structured guess, not a guarantee. This page starts from the simplest
          honest baseline -- where recent growth has been trending -- and then asks what a handful
          of plausible shocks would do to that path, showing every assumption along the way.
        </p>
      </header>

      <DemoDataBanner />

      {/* ---------------------------------------------------------- */}
      {/* What is the baseline forecast?                              */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Starting point</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            What&rsquo;s the baseline path, if recent trends simply continue?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            The most defensible starting forecast is often the least dramatic one: fit a line
            through the recent past and extend it forward. The shaded fan shows how far off that
            baseline a pessimistic or optimistic scenario might land &mdash; drag the sliders to
            adjust the offsets.
          </p>
        </header>

        {/* GDP fan chart */}
        {gdp && gdpProjection ? (
          <ForecastFanChart
            series={gdp}
            projection={gdpProjection}
            title="Real GDP growth &mdash; recent history and a 3-year scenario fan"
            subtitle="Trend line fit to the trailing 10 years; shaded bands show pessimistic and optimistic offsets · adjust via sliders below"
          />
        ) : (
          <p className="text-sm text-ink-soft">GDP series unavailable.</p>
        )}

        {gdpProjectionRaw?.model && baselineYear1 && (
          <ResearchNote title="Show the work">
            <p>
              The line is fit on the trailing {LOOKBACK} years of annual data:{' '}
              <span className="font-mono text-[13px] text-ink">
                growth &asymp; {gdpProjectionRaw.model.intercept.toFixed(2)}{' '}
                {gdpProjectionRaw.model.slope >= 0 ? '+' : '−'}{' '}
                {Math.abs(gdpProjectionRaw.model.slope).toFixed(3)} &times; (year index)
              </span>{' '}
              with R&sup2; of {gdpProjectionRaw.model.rSquared.toFixed(2)}. Carried forward, that
              line puts{' '}
              <strong className="text-ink">{baselineYear1.date.slice(0, 4)}</strong> growth at
              roughly{' '}
              <strong className="text-ink">{formatValue(baselineYear1.value, '%')}</strong>,
              drifting from there as the trend continues.
            </p>
            <p>
              <strong className="text-ink">Worth remembering:</strong> a straight line cannot see a
              recession coming, cannot see a boom coming, and says nothing about policy choices yet
              to be made. It is a baseline to argue with, not a prediction to bank on.
            </p>
          </ResearchNote>
        )}

        {/* Inflation fan chart */}
        {inflation && infProjection && (
          <ForecastFanChart
            series={inflation}
            projection={infProjection}
            title="CPI inflation &mdash; recent history and a 3-year scenario fan"
            subtitle="Same trailing-trend method applied to headline inflation; sliders adjust the scenario offsets independently of the GDP chart above"
          />
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* What happens under shocks?                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Stress-testing the path</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            What would a real shock do to that baseline?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Four plausible jolts, each worked out the same honest way: state the shock, name the
            channel it travels through, say plainly how much of it you&rsquo;d expect to actually
            reach growth, and show the resulting number. Treat these as back-of-envelope sketches
            -- the kind an analyst draws before reaching for a heavier model -- not forecasts in
            their own right.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {scenarios.map((s) => (
            <div key={s.id} className="glass-card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-label text-sm font-semibold text-ink">{s.title}</p>
                {s.impact !== null && (
                  <span className="shrink-0 rounded-full bg-[var(--accent-red)]/12 px-2.5 py-1 text-xs font-semibold text-danger">
                    &minus;{s.impact.toFixed(s.impact < 1 ? 2 : 1)} pp
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-ink-muted">
                <span className="font-label uppercase tracking-wide text-[10px] text-secondary">The assumed shock — </span>
                {s.shock}
              </p>
              <p className="text-sm leading-relaxed text-ink-muted">{s.reasoning}</p>
              {s.source && (
                <div className="mt-auto pt-1">
                  <SourceBadge sourceName={s.source.sourceName} sourceUrl={s.source.sourceUrl} reliability="secondary" compact />
                </div>
              )}
            </div>
          ))}
        </div>
        {baselineYear1 && (
          <ResearchNote title="Putting the numbers side by side">
            <p>
              The baseline puts next year&rsquo;s growth at roughly{' '}
              <strong className="text-ink">{formatValue(baselineYear1.value, '%')}</strong>. Layer the largest single
              shock above on top of that baseline -- arithmetically, not as a prediction -- and the figure would sit
              closer to{' '}
              <strong className="text-ink">
                {formatValue(
                  baselineYear1.value - Math.max(...scenarios.map((s) => s.impact ?? 0)),
                  '%',
                )}
              </strong>
              . Real shocks rarely arrive alone, rarely stay the size you assumed, and almost always provoke a policy
              response -- a rate cut, a stimulus package, a currency intervention -- that this simple arithmetic cannot
              see coming. The point isn&rsquo;t the precise number; it&rsquo;s having a transparent way to reason about
              direction and rough scale before the real event arrives.
            </p>
          </ResearchNote>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* How confident is the model?                                 */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The honest caveat</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How much should you trust any of this?
          </h2>
        </header>
        <GlassCard title="What this model is -- and isn't" subtitle="Read this before quoting a number from this page">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <p className="font-label text-xs font-semibold uppercase tracking-wide text-primary">What it is</p>
              <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-ink-muted">
                <li>• A trailing-trend extrapolation -- the simplest defensible baseline, fit openly with the method shown above.</li>
                <li>• A set of named, adjustable assumptions for each scenario, so you can disagree with any single number and substitute your own.</li>
                <li>• A starting point for a conversation about direction and rough scale.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-label text-xs font-semibold uppercase tracking-wide text-danger">What it isn&rsquo;t</p>
              <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-ink-muted">
                <li>• A calibrated macroeconomic model -- there is no ARIMA, VAR, or structural model running underneath it (the spec deliberately holds those for later, once this baseline has proven itself).</li>
                <li>• Trained on enough history to be statistically confident -- {gdpProjectionRaw?.model ? `${gdpProjectionRaw.model.n} annual observations` : 'roughly two decades of annual data'} is a thin foundation for any forecasting method.</li>
                <li>• Aware of policy responses, compounding shocks, or anything that hasn&rsquo;t happened yet.</li>
              </ul>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-muted">
            <strong className="text-ink">In short:</strong> use the baseline as a reference line, use the scenarios as a
            way to reason about direction and order of magnitude, and treat every number on this page as a starting
            point for your own judgment -- not a substitute for it.
          </p>
        </GlassCard>
      </section>
    </div>
  );
}
