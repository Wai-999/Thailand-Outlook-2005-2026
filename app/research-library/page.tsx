'use client';

import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import PageHero from '@/components/PageHero';
import PageTabs from '@/components/PageTabs';
import ResearchNote from '@/components/ResearchNote';
import SignalBoard from '@/components/SignalBoard';
import { allSeries, sources } from '@/lib/data';

// ── Static content ─────────────────────────────────────────────────────────────

const METHOD_CARDS = [
  {
    id: 'composites',
    title: 'Composite scores',
    body: 'The macro stability, debt pressure, and external vulnerability views are intentionally simple composites. They are designed to be readable and inspectable rather than optimized black-box predictors.',
  },
  {
    id: 'regression',
    title: 'Regression and correlation',
    body: 'The statistical engine aligns series on common dates, then runs descriptive statistics, Pearson correlations, lag correlations, and ordinary least squares so the relationship work stays fully exposed.',
  },
  {
    id: 'forecasting',
    title: 'Trend baseline forecasting',
    body: 'Forecast Lab starts with a trailing-history linear trend. That gives the site an honest baseline to argue with before any scenario overlay is added on top.',
  },
  {
    id: 'proxy',
    title: 'Proxy analytics',
    body: 'Where the dataset lacks provincial or bilateral detail, the upgraded routes use explicit proxy logic instead of faking granular data. Each proxy is described in plain language on the page that uses it.',
  },
];

const METHODOLOGY_DEEP_DIVE = [
  {
    title: 'How composite scores are normalized',
    body: 'Each indicator in a composite is rescaled to 0–100 relative to its own historical min-max range before being multiplied by its weight. This keeps series with different units on a common scale without losing the shape of their trends.',
  },
  {
    title: 'Handling missing data points',
    body: 'When a data point for a specific year is absent, the analytics layer skips that year for correlation and regression work rather than forward- or back-filling. This prevents phantom smoothness in sparse series.',
  },
  {
    title: 'Year-over-year change calculation',
    body: 'YoY change is always computed as ((current − previous) / |previous|) × 100. The absolute value denominator avoids sign-flip distortions in series that cross zero (e.g. current account, real GDP growth).',
  },
  {
    title: 'What "isDemo" means in the dataset',
    body: 'Series tagged isDemo = true are modelled, estimated, or illustrative values rather than official statistics. They appear in charts to support analysis but are always badged to make the distinction visible.',
  },
];

const START_HERE_LINKS = [
  { href: '/docs',               label: 'Documentation',      body: 'Read the operating rules, assumptions, and interpretation guardrails for the whole product.' },
  { href: '/data-sources',       label: 'Data Sources',       body: 'See where every major series comes from and how fresh it is.' },
  { href: '/statistical-engine', label: 'Statistical Engine', body: 'Inspect the correlation, regression, and descriptive routines used across the dashboard.' },
  { href: '/forecast-lab',       label: 'Forecast Lab',       body: 'See how the baseline projection and scenario arithmetic are built.' },
];

const FURTHER_READING = [
  {
    title: 'IMF Article IV Consultations — Thailand',
    url: 'https://www.imf.org/en/Publications/CR',
    body: "Annual IMF staff assessment of Thailand's economy covering fiscal, monetary, and external sector risks. Best starting point for a structured cross-country framing.",
  },
  {
    title: 'World Bank Thailand Economic Monitor',
    url: 'https://www.worldbank.org/en/country/thailand',
    body: 'Twice-yearly policy briefs focusing on near-term growth, social outcomes, and structural reform progress.',
  },
  {
    title: 'Bank of Thailand Economic Data',
    url: 'https://www.bot.or.th/en/statistics.html',
    body: 'Official source for monetary, financial, and balance-of-payments statistics. Monthly frequency for most financial series.',
  },
  {
    title: 'NESDC National Accounts',
    url: 'https://www.nesdc.go.th/nesdb_en/main.php?filename=national_account',
    body: 'National Economic and Social Development Council publishes quarterly GDP and the annual expenditure breakdown used across the macro pages.',
  },
];

const RELIABILITY_LABEL: Record<string, string> = {
  official:      'Official government sources',
  international: 'International institutions',
  secondary:     'Compiled research bundles',
  demo:          'Modelled or illustrative',
};

const RELIABILITY_DESC: Record<string, string> = {
  official:      'Direct from Thai government agencies (BOT, NESDC, MOF, NSO). Highest provenance confidence.',
  international: 'Published by the World Bank, IMF, Asian Development Bank, or UN bodies. Widely used as benchmark.',
  secondary:     'Compiled and cross-referenced by this project from multiple named sources. Methodology documented.',
  demo:          'Modelled, estimated, or illustrative values. Used to support analysis; not primary statistics.',
};

export default function ResearchLibraryPage() {
  const sourceKinds   = new Set(sources.map((s) => s.reliability));
  const accessMethods = new Set(sources.map((s) => s.accessMethod));
  const groupedSources = sources.reduce<Record<string, typeof sources>>((acc, s) => {
    acc[s.reliability] = [...(acc[s.reliability] ?? []), s];
    return acc;
  }, {});

  // ── Shared header ─────────────────────────────────────────────────────────
  const hero = (
    <PageHero
      eyebrow="Methods, sources, and further reading"
      title="A working library for how this dashboard thinks"
      description={
        <p>
          The research library pulls together dataset coverage, source registry, analytical conventions,
          and the routes you should read when you want to understand not just what the dashboard says,
          but how it reached that view.
        </p>
      }
      metrics={[
        {
          label: 'Tracked series',
          value: String(allSeries().length),
          detail: 'Across the macro and micro bundles already compiled into the app.',
          tone: 'primary',
        },
        {
          label: 'Source records',
          value: String(sources.length),
          detail: 'Named registries with reliability and access-method metadata.',
          tone: 'secondary',
        },
        {
          label: 'Access methods',
          value: String(accessMethods.size),
          detail: 'API, CSV, manual, and other ingestion paths captured in metadata.',
          tone: 'success',
        },
      ]}
    />
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
            title="How the evidence base is structured"
            subtitle="This is the minimum context you want in your head before citing a chart from the site."
            items={[
              {
                label: 'Indicator coverage',
                value: `${allSeries().length} series`,
                note: 'The site works from a finite compiled snapshot, not an open-ended live warehouse. That makes scope visible and tractable.',
                tone: 'primary',
              },
              {
                label: 'Reliability classes',
                value: `${sourceKinds.size} classes`,
                note: 'Each source record declares whether it is official, international, secondary, or modeled so provenance is never hidden.',
                tone: 'secondary',
              },
              {
                label: 'Primary workflow',
                value: 'Transparent',
                note: 'The site prefers readable arithmetic, documented composites, and disclosed assumptions over high-complexity models with low explainability.',
                tone: 'success',
              },
              {
                label: 'Snapshot character',
                value: 'Annual',
                note: 'Most routes use annual series. That is strong for regime reading, weaker for event timing, and the content is written accordingly.',
                tone: 'warning',
              },
            ]}
          />

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard title="Method notes that matter most" subtitle="The conceptual tools reused across the dashboard">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {METHOD_CARDS.map((card) => (
                  <div key={card.id} className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
                    <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                      {card.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{card.body}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard title="Start here when you need the full story" subtitle="Best routes for methodology, provenance, and interpretation">
              <div className="flex flex-col gap-3">
                {START_HERE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4 transition hover:border-[var(--primary)]/30 hover:bg-white/60 hover:text-inherit"
                  >
                    <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </section>
        </>
      ),
    },

    // ── Methodology ──────────────────────────────────────────────────────────
    {
      id: 'methodology',
      label: 'Methodology',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
              Methodology
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              How the numbers are built
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Every composite score, growth rate, and proxy metric on this site uses one of a small number of
              reusable techniques. Understanding them once makes every chart on every page easier to read correctly.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {METHOD_CARDS.map((card) => (
              <div key={card.id} className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-5">
                <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                  {card.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{card.body}</p>
              </div>
            ))}
          </section>

          <GlassCard title="Deeper technical notes" subtitle="Implementation details for the most common calculations">
            <div className="flex flex-col gap-4">
              {METHODOLOGY_DEEP_DIVE.map((item) => (
                <div key={item.title} className="border-b border-[var(--glass-border)] pb-4 last:border-none last:pb-0">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <ResearchNote title="What belongs here next">
            <p>
              The next layer should be route-by-route notes: one methodology memo for each composite, one
              limitations memo for each proxy page, and a lightweight release log whenever the compiled datasets
              change materially. That would turn the library into a real research operations surface.
            </p>
          </ResearchNote>
        </>
      ),
    },

    // ── Source Registry ──────────────────────────────────────────────────────
    {
      id: 'sources',
      label: 'Source Registry',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
              Source registry
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              Where every number comes from
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Each source record declares its publisher, update frequency, access method, and reliability class.
              Provenance is never hidden — if a number is estimated or compiled rather than official, it is labeled
              as such.
            </p>
          </header>

          {/* Reliability key */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(RELIABILITY_LABEL).map(([key, label]) => (
              <div key={key} className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4">
                <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
                  {label}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  {RELIABILITY_DESC[key]}
                </p>
                <p className="mt-3 font-display text-2xl font-bold text-ink">
                  {groupedSources[key]?.length ?? 0}
                </p>
                <p className="text-xs text-ink-soft">sources in this class</p>
              </div>
            ))}
          </section>

          {/* Full registry grouped by reliability */}
          {Object.entries(groupedSources).map(([reliability, entries]) => (
            <GlassCard
              key={reliability}
              title={RELIABILITY_LABEL[reliability] ?? reliability}
              subtitle={`${entries.length} source${entries.length !== 1 ? 's' : ''} · ${RELIABILITY_DESC[reliability] ?? ''}`}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => (
                  <div
                    key={entry.sourceName}
                    className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4"
                  >
                    <p className="text-sm font-semibold text-ink">{entry.sourceName}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      {entry.publisher}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[var(--glass-border)] px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                        {entry.updateFrequency}
                      </span>
                      <span className="rounded-full bg-[var(--glass-border)] px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                        via {entry.accessMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </>
      ),
    },

    // ── Further Reading ──────────────────────────────────────────────────────
    {
      id: 'reading',
      label: 'Further Reading',
      content: (
        <>
          <header>
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              Further reading
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
              Primary sources and research pathways
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              These are the best external resources for each of the core thematic areas covered by the dashboard.
              The list is short and curated — each entry points to an institution that regularly publishes rigorous,
              publicly-available analysis on the Thai economy.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {FURTHER_READING.map((item) => (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-white/45 p-5 transition hover:border-[var(--primary)]/30 hover:bg-white/60"
              >
                <p className="font-semibold text-ink group-hover:text-[var(--primary)]">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                <p className="mt-3 font-label text-[11px] text-ink-soft">
                  {item.url}
                </p>
              </a>
            ))}
          </section>

          <GlassCard title="Internal reading paths" subtitle="Best routes inside the dashboard for methodology, provenance, and interpretation">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {START_HERE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-white/45 p-4 transition hover:border-[var(--primary)]/30 hover:bg-white/60 hover:text-inherit"
                >
                  <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                </Link>
              ))}
            </div>
          </GlassCard>

          <ResearchNote title="How to cite data from this dashboard">
            <p>
              The compiled dataset in this project is derived from the named sources above. When citing specific
              numbers, cite the original source (e.g. "World Bank WDI, 2024") rather than this dashboard, and
              note that some series have been rebased, derived, or interpolated as documented in the methodology tab.
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
