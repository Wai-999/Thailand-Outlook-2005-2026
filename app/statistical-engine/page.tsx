import GlassCard from '@/components/GlassCard';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import CorrelationMatrix from '@/components/CorrelationMatrix';
import RegressionPanel from '@/components/RegressionPanel';
import SourceBadge from '@/components/SourceBadge';
import { findSeries } from '@/lib/data';
import { lagCorrelation, ols, correlationStrength, describe } from '@/lib/stats';
import { formatValue } from '@/lib/data';
import type { IndicatorSeries } from '@/lib/types';

/** Pulls the values that two series share on the same date, in date order. */
function alignPair(a: IndicatorSeries, b: IndicatorSeries): { x: number[]; y: number[] } {
  const bMap = new Map(b.points.map((p) => [p.date, p.value]));
  const x: number[] = [];
  const y: number[] = [];
  for (const p of a.points) {
    const v = bMap.get(p.date);
    if (v !== undefined) {
      x.push(p.value);
      y.push(v);
    }
  }
  return { x, y };
}


const DESCRIPTIVE_SET: { code: string; label: string; unit: string; goodDirection: 'up' | 'down' | 'neutral' }[] = [
  { code: 'real_gdp_growth_pct',    label: 'Real GDP growth',         unit: '%',          goodDirection: 'up'      },
  { code: 'cpi_inflation_pct',       label: 'Headline inflation',      unit: '%',          goodDirection: 'neutral' },
  { code: 'exports_goods_yoy_pct',   label: 'Export growth',           unit: '%',          goodDirection: 'up'      },
  { code: 'tourism_receipts_yoy_pct',label: 'Tourism receipts growth', unit: '%',          goodDirection: 'up'      },
  { code: 'household_debt_gdp_pct',  label: 'Household debt / GDP',   unit: '%',          goodDirection: 'down'    },
  { code: 'policy_interest_rate_pct',label: 'Policy interest rate',    unit: '% Annual',   goodDirection: 'neutral' },
];

const CORRELATION_SET: { code: string; label: string }[] = [
  { code: 'real_gdp_growth_pct', label: 'GDP growth' },
  { code: 'cpi_inflation_pct', label: 'Inflation' },
  { code: 'exports_goods_yoy_pct', label: 'Export growth' },
  { code: 'tourism_arrivals_yoy_pct', label: 'Tourism growth' },
  { code: 'consumer_market_household_consumption_growth', label: 'Consumption growth' },
  { code: 'investment_capital_private_investment_growth', label: 'Investment growth' },
];

const EXPLAINER_SET: { code: string; label: string; interpretation: (slope: number) => string }[] = [
  {
    code: 'investment_capital_private_investment_growth',
    label: 'Private investment growth',
    interpretation: (s) =>
      `each extra percentage point of private investment growth lines up with about ${Math.abs(s).toFixed(2)} ${s >= 0 ? 'more' : 'fewer'} percentage points of GDP growth in the same year -- consistent with investment being one of the more direct engines of output.`,
  },
  {
    code: 'consumer_market_household_consumption_growth',
    label: 'Household consumption growth',
    interpretation: (s) =>
      `each extra percentage point of consumption growth lines up with about ${Math.abs(s).toFixed(2)} ${s >= 0 ? 'more' : 'fewer'} percentage points of GDP growth -- a reminder that Thai households' spending habits feed straight back into the headline number.`,
  },
  {
    code: 'exports_goods_yoy_pct',
    label: 'Export growth',
    interpretation: (s) =>
      `each extra percentage point of export growth lines up with about ${Math.abs(s).toFixed(2)} ${s >= 0 ? 'more' : 'fewer'} percentage points of GDP growth -- a sign of how tightly Thailand's fortunes are tied to demand from beyond its borders.`,
  },
  {
    code: 'tourism_arrivals_yoy_pct',
    label: 'Tourism arrivals growth',
    interpretation: (s) =>
      `each extra percentage point of tourism arrivals growth lines up with about ${Math.abs(s).toFixed(2)} ${s >= 0 ? 'more' : 'fewer'} percentage points of GDP growth -- visitor flows clearly matter, though evidently not as the single biggest lever.`,
  },
];

const LAGS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

export default function StatisticalEnginePage() {
  const correlationSeries = CORRELATION_SET.map(({ code, label }) => ({ label, series: findSeries(code) })).filter(
    (e): e is { label: string; series: IndicatorSeries } => Boolean(e.series),
  );
  const rawMatrixSeries = correlationSeries.map(({ label, series }) => ({
    label,
    points: series.points,
  }));

  const gdp = findSeries('real_gdp_growth_pct');
  const investment = findSeries('investment_capital_private_investment_growth');

  const lagResults =
    gdp && investment
      ? LAGS.map((lag) => {
          const { x, y } = alignPair(investment, gdp);
          return { lag, r: lagCorrelation(x, y, lag) };
        })
      : [];
  const bestLag = lagResults.reduce<{ lag: number; r: number } | null>((best, cur) => {
    if (cur.r === null) return best;
    if (!best || Math.abs(cur.r) > Math.abs(best.r)) return { lag: cur.lag, r: cur.r };
    return best;
  }, null);

  const fits = gdp
    ? EXPLAINER_SET.map(({ code, label, interpretation }) => {
        const predictor = findSeries(code);
        if (!predictor) return null;
        const { x, y } = alignPair(predictor, gdp);
        const fit = ols(x, y);
        if (!fit) return null;
        return { code, label, fit, interpretation: interpretation(fit.slope) };
      }).filter((e): e is { code: string; label: string; fit: NonNullable<ReturnType<typeof ols>>; interpretation: string } => Boolean(e))
    : [];
  const ranked = [...fits].sort((a, b) => b.fit.rSquared - a.fit.rSquared);
  const top = ranked[0];

  const descriptiveRows = DESCRIPTIVE_SET.map(({ code, label, unit, goodDirection }) => {
    const series = findSeries(code);
    if (!series) return null;
    const stats = describe(series.points.map((p) => p.value));
    if (!stats) return null;
    return { label, unit, goodDirection, stats, series };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Show your work</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          What does the data actually say about how things connect?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          Every chart on this site invites a follow-up question: is that real, or a coincidence?
          This page runs the numbers in the open &mdash; the same correlation, lag, and regression
          methods an analyst would reach for &mdash; so you can see exactly how the conclusions
          were reached, and judge them for yourself.
        </p>
      </header>

      <DemoDataBanner />

      {/* ---------------------------------------------------------- */}
      {/* Descriptive statistics: what each series looks like         */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The basics, first</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            What does each series actually look like, across its full history?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Before testing relationships between indicators, it helps to know what each one looks
            like on its own &mdash; its typical level, how much it swings, and how its latest
            reading compares with the historical average.
          </p>
        </header>
        <GlassCard>
          {descriptiveRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    <th className="pb-2 pr-4 text-left font-label text-xs font-semibold uppercase tracking-wide text-ink-muted">Indicator</th>
                    <th className="pb-2 pr-4 text-right font-label text-xs font-semibold uppercase tracking-wide text-ink-muted">Latest</th>
                    <th className="pb-2 pr-4 text-right font-label text-xs font-semibold uppercase tracking-wide text-ink-muted">Mean</th>
                    <th className="pb-2 pr-4 text-right font-label text-xs font-semibold uppercase tracking-wide text-ink-muted">Median</th>
                    <th className="pb-2 pr-4 text-right font-label text-xs font-semibold uppercase tracking-wide text-ink-muted">Std dev</th>
                    <th className="pb-2 pr-4 text-right font-label text-xs font-semibold uppercase tracking-wide text-ink-muted">Min</th>
                    <th className="pb-2 text-right font-label text-xs font-semibold uppercase tracking-wide text-ink-muted">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {descriptiveRows.map(({ label, unit, goodDirection, stats }) => {
                    const latestVsMean = stats.latest - stats.mean;
                    const latestIsHigh = goodDirection === 'up' ? latestVsMean > 0 : goodDirection === 'down' ? latestVsMean < 0 : null;
                    const latestColor = latestIsHigh === true ? 'text-success' : latestIsHigh === false ? 'text-danger' : 'text-ink';
                    return (
                      <tr key={label} className="border-b border-[var(--glass-border)]/50 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-ink">{label}</td>
                        <td className={`py-2.5 pr-4 text-right tabular-nums font-semibold ${latestColor}`}>
                          {formatValue(stats.latest, unit)}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-ink-muted">{formatValue(stats.mean, unit)}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-ink-muted">{formatValue(stats.median, unit)}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-ink-soft">{formatValue(stats.stdDev, unit)}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-ink-soft">{formatValue(stats.min, unit)}</td>
                        <td className="py-2.5 text-right tabular-nums text-ink-soft">{formatValue(stats.max, unit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-ink-soft">
                n = full dataset length per series (varies by indicator). All values in the series&rsquo; native unit.
                Latest reading compared with historical mean &mdash; green if favorable direction, red if unfavorable.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
        </GlassCard>
        <ResearchNote title="What these numbers do and don&rsquo;t tell you">
          <p>
            The <strong className="text-ink">mean</strong> is the arithmetic average across all
            years in the dataset &mdash; a useful anchor, but one that the pandemic years and
            other one-off shocks can pull noticeably. The <strong className="text-ink">median</strong>{' '}
            is less sensitive to those outliers: it&rsquo;s simply the value at the midpoint when
            all years are ranked from smallest to largest. When mean and median diverge, it&rsquo;s
            usually a sign that a few unusual years are pulling the average away from where the
            series spends most of its time.
          </p>
          <p>
            The <strong className="text-ink">standard deviation</strong> measures how much the
            series swings around its mean &mdash; a high standard deviation means the indicator
            is volatile and harder to forecast; a low one means it tends to move slowly and
            predictably. The colored &ldquo;latest&rdquo; reading shows whether the most recent
            observation is above or below the historical average in a direction that&rsquo;s
            either favorable or worth watching (based on whether higher values are generally
            good or concerning for that indicator). It is not a forecast, and one year above the
            mean is not an alarm &mdash; just a reference point.
          </p>
        </ResearchNote>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Which indicators are correlated?                            */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Reading the grid</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Which parts of the economy move together?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Six year-over-year growth measures, compared pair by pair. Each cell is a Pearson
            correlation coefficient &mdash; a single number from &minus;1 to +1 describing how
            closely two series have moved together across the same years.
          </p>
        </header>
        <GlassCard>
          {correlationSeries.length === CORRELATION_SET.length ? (
            <CorrelationMatrix series={rawMatrixSeries} />
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
        </GlassCard>
        <ResearchNote title="How to read this -- and where to be careful">
          <p>
            A coefficient near +1 means the two series tend to rise and fall together; near
            &minus;1, they tend to move in opposite directions; near 0, no clear straight-line
            relationship shows up in the years we have. {correlationSeries[5] && correlationSeries[1] ? (
              <>
                Consumption growth and investment growth, for instance, often shade toward the
                stronger end of the grid &mdash; both tend to rise when domestic demand firms up and
                soften in the same downturns.
              </>
            ) : null}
          </p>
          <p>
            <strong className="text-ink">A correlation is not a cause.</strong> Two series can move
            together because one drives the other, because both respond to a third factor (a global
            trade cycle, a policy shift, a shock like a pandemic), or simply by chance over a short
            run of years. What the grid offers is a place to start asking sharper questions &mdash;
            evidence worth weighing, not a verdict.
          </p>
        </ResearchNote>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Does one indicator lead another with lag?                   */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Timing matters</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Does private investment move ahead of GDP, or behind it?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            A relationship can be real but poorly timed in a simple same-year comparison. Lag
            correlation slides one series forward or backward in time against the other, year by
            year, to see where the strongest echo shows up.
          </p>
        </header>
        <GlassCard
          title="Correlation between private investment growth and GDP growth, by offset"
          subtitle="Negative offsets test whether investment follows GDP; positive offsets test whether investment leads it"
        >
          {lagResults.length ? (
            <div className="flex flex-col gap-2.5">
              {lagResults.map(({ lag, r }) => {
                const isBest = bestLag !== null && lag === bestLag.lag;
                const width = r === null ? 0 : Math.min(100, Math.abs(r) * 100);
                return (
                  <div key={lag} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 font-label text-xs font-medium text-ink-muted">
                      {lag === 0 ? 'Same year' : lag > 0 ? `Investment +${lag}y` : `GDP +${Math.abs(lag)}y`}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--glass-border)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          background: r !== null && r >= 0 ? 'var(--primary)' : 'var(--accent-red)',
                          opacity: isBest ? 1 : 0.55,
                        }}
                      />
                    </div>
                    <span className={`w-14 shrink-0 text-right text-xs tabular-nums ${isBest ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                      {r !== null ? r.toFixed(2) : '—'}
                    </span>
                    {isBest && (
                      <span className="shrink-0 rounded-full bg-[var(--primary)]/12 px-2 py-0.5 text-[10px] font-medium text-primary">
                        strongest
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
        </GlassCard>
        <ResearchNote title="How to read the offsets">
          <p>
            &ldquo;Same year&rdquo; is the plain correlation with no shift applied. Move right (
            &ldquo;Investment +1y&rdquo;, &ldquo;+2y&rdquo;&hellip;) and the test becomes: does this
            year&rsquo;s investment growth line up with <em>next</em> year&rsquo;s GDP growth?
            Move left (&ldquo;GDP +1y&rdquo;&hellip;) and it flips: does this year&rsquo;s GDP growth
            line up with <em>next</em> year&rsquo;s investment growth?
          </p>
          {bestLag && (
            <p>
              In this dataset, the strongest echo (r&nbsp;=&nbsp;{bestLag.r.toFixed(2)},{' '}
              {correlationStrength(bestLag.r)}) sits at{' '}
              <strong className="text-ink">
                {bestLag.lag === 0
                  ? 'no offset at all'
                  : bestLag.lag > 0
                    ? `investment leading GDP by about ${bestLag.lag} year${bestLag.lag === 1 ? '' : 's'}`
                    : `GDP leading investment by about ${Math.abs(bestLag.lag)} year${Math.abs(bestLag.lag) === 1 ? '' : 's'}`}
              </strong>
              . With only two decades of annual data, treat this as a hint about timing rather than
              a settled finding -- a few additional years of data could shift it.
            </p>
          )}
        </ResearchNote>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Which variables explain GDP growth best?                    */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Putting it to the test</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            What actually explains GDP growth, year to year?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Four candidate explanations, each tested the same way: a simple one-variable regression
            against GDP growth. The ranking below is by R&sup2; &mdash; the share of year-to-year
            movement in GDP growth that each variable accounts for on its own.
          </p>
        </header>
        <GlassCard title="Ranked by explanatory power (R²)" subtitle="Single-variable OLS regressions against real GDP growth, same-year">
          {ranked.length ? (
            <div className="flex flex-col gap-2.5">
              {ranked.map(({ code, label, fit }, i) => (
                <div key={code} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 font-display text-sm font-bold text-ink-soft">{i + 1}</span>
                  <span className="w-48 shrink-0 font-label text-xs font-medium text-ink-muted">{label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--glass-border)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, fit.rSquared * 100)}%`, background: i === 0 ? 'var(--secondary)' : 'var(--primary)', opacity: i === 0 ? 1 : 0.55 }}
                    />
                  </div>
                  <span className={`w-14 shrink-0 text-right text-xs tabular-nums ${i === 0 ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                    {fit.rSquared.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Series unavailable.</p>
          )}
        </GlassCard>
        {top && (
          <GlassCard
            title={`Closer look: ${top.label}`}
            subtitle="The strongest single-variable fit in this set, shown with its full working"
          >
            <RegressionPanel
              outcomeLabel="GDP growth (%)"
              predictorLabel={top.label}
              fit={top.fit}
              interpretation={top.interpretation}
            />
          </GlassCard>
        )}
        <ResearchNote title="Why only one variable at a time">
          <p>
            Real economies move on many forces at once, and a fuller model would weigh them
            together. We start with one-variable regressions because they&rsquo;re transparent end
            to end &mdash; every coefficient and every assumption fits in view, with nothing buried
            in a black box. The ranking above is a map of where a richer, multi-variable model
            would likely find its strongest threads, not a final word on what &ldquo;causes&rdquo;
            growth.
          </p>
        </ResearchNote>
      </section>
    </div>
  );
}
