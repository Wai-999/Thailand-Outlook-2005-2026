import GlassCard from '@/components/GlassCard';
import ResearchNote from '@/components/ResearchNote';
import DemoDataBanner from '@/components/DemoDataBanner';
import SourceBadge from '@/components/SourceBadge';
import FreshnessHeatmap from './FreshnessHeatmap';
import { allSeries, sources } from '@/lib/data';
import type { Reliability } from '@/lib/types';
import { ShieldCheck, Globe, FileQuestion, FlaskConical } from 'lucide-react';

const RELIABILITY_GUIDE: { key: Reliability; icon: typeof ShieldCheck; tone: string; title: string; copy: string }[] = [
  {
    key: 'official',
    icon: ShieldCheck,
    tone: 'text-success',
    title: 'Official source',
    copy: 'Published directly by the agency that owns the number -- a central bank, a statistics office, a ministry. The closest thing to a primary source this dashboard cites.',
  },
  {
    key: 'international',
    icon: Globe,
    tone: 'text-primary',
    title: 'International body',
    copy: 'Published by an international institution (the World Bank, IMF, ADB) that gathers and standardizes national data so it can be compared across countries. Usually traces back to an official source, one step removed.',
  },
  {
    key: 'secondary',
    icon: FileQuestion,
    tone: 'text-secondary',
    title: 'Secondary / compiled',
    copy: 'Assembled or derived by someone other than the original publisher -- a research desk, an industry association, or this project itself recombining official series into a new measure (a ratio, a growth rate, an index).',
    },
  {
    key: 'demo',
    icon: FlaskConical,
    tone: 'text-accent-plum',
    title: 'Demo dataset',
    copy: 'Placeholder or synthetic figures standing in for a feed that isn\u2019t connected yet -- useful for prototyping, not for analysis. None of the numbers on this dashboard are demo data: every series below traces to a named publisher, even where it reaches you through a compiled snapshot.',
  },
];

export default function DataSourcesPage() {
  const series = allSeries();
  const total = series.length;
  const sectors = Array.from(new Set(series.map((s) => s.sector))).sort();
  const years = series.flatMap((s) => s.points.map((p) => Number(p.date.slice(0, 4))));
  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;

  // Freshness heatmap — most recent non-null year per indicator, grouped by sector
  const heatmapData = sectors.map((sector) => ({
    sector,
    indicators: series
      .filter((s) => s.sector === sector)
      .map((s) => {
        let latestYear: number | null = null;
        for (let i = s.points.length - 1; i >= 0; i--) {
          if (s.points[i].value !== null && s.points[i].value !== undefined) {
            latestYear = parseInt(s.points[i].date.slice(0, 4), 10);
            break;
          }
        }
        return { code: s.indicatorCode, name: s.indicatorName, latestYear };
      }),
  }));

  const reliabilityCounts = RELIABILITY_GUIDE.map((g) => ({
    ...g,
    count: sources.filter((s) => s.reliability === g.key).length,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 pb-16">
      <header className="max-w-3xl">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Where the numbers come from</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink md:text-[2.5rem]">
          Where does every figure on this dashboard actually come from?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted md:text-base">
          A chart is only as trustworthy as what stands behind it. This page names every
          source feeding this dashboard, explains what kind of source it is, and is honest
          about how current the numbers are -- so you can decide for yourself how much
          weight to put on any single figure.
        </p>
      </header>

      <DemoDataBanner />

      {/* ---------------------------------------------------------- */}
      {/* The sources themselves                                      */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">The paper trail</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            Five sources sit behind everything you see here
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Two are the compiled research datasets that power most of the charts; the rest
            are the original publishers those datasets draw from -- named so the chain of
            custody stays visible all the way back.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sources.map((s) => (
            <div key={s.sourceName} className="glass-card flex flex-col gap-3 p-5">
              <p className="font-label text-sm font-semibold leading-snug text-ink">{s.sourceName}</p>
              <p className="text-sm text-ink-muted">{s.publisher}</p>
              <div className="flex flex-col gap-1.5 text-xs text-ink-soft">
                <p>
                  <span className="font-medium text-ink-muted">Update cadence — </span>
                  {s.updateFrequency}
                </p>
                <p>
                  <span className="font-medium text-ink-muted">How this project obtains it — </span>
                  {s.accessMethod === 'api' && 'Pulled programmatically via a public API'}
                  {s.accessMethod === 'csv' && 'Compiled into a CSV research snapshot'}
                  {s.accessMethod === 'manual' && 'Read and transcribed from published statistical releases'}
                  {s.accessMethod === 'pdf' && 'Extracted from published PDF reports'}
                </p>
              </div>
              <div className="mt-auto pt-1">
                <SourceBadge sourceName={s.sourceName} reliability={s.reliability} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Coverage                                                    */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Scope and freshness</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            How much ground does this dashboard actually cover?
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GlassCard padded={false} className="p-5">
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">Indicators tracked</p>
            <p className="font-display mt-1 text-3xl font-bold text-ink">{total}</p>
            <p className="mt-1 text-xs text-ink-soft">individual series across {sectors.length} sectors</p>
          </GlassCard>
          <GlassCard padded={false} className="p-5">
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">Years covered</p>
            <p className="font-display mt-1 text-3xl font-bold text-ink">
              {minYear}–{maxYear}
            </p>
            <p className="mt-1 text-xs text-ink-soft">mostly annual; the latest year or two are typically forecast or preliminary</p>
          </GlassCard>
          <GlassCard padded={false} className="p-5">
            <p className="font-label text-xs font-semibold uppercase tracking-wide text-ink-soft">Reliability mix</p>
            <p className="font-display mt-1 text-3xl font-bold text-ink">{reliabilityCounts.find((r) => r.key === 'demo')?.count ?? 0}/{sources.length}</p>
            <p className="mt-1 text-xs text-ink-soft">of the named sources are this project&rsquo;s own compiled snapshots</p>
          </GlassCard>
        </div>
        <GlassCard
          title="Data freshness by indicator"
          subtitle="Each cell is one tracked indicator. Colour shows the most recent non-null year in its data — hover a cell to see the indicator name and year."
        >
          <FreshnessHeatmap data={heatmapData} />
        </GlassCard>
        <ResearchNote title="What 'covered' does and doesn't mean">
          <p>
            A sector with many tracked series isn&rsquo;t necessarily one this dashboard
            understands best -- it just means more individual numbers are available to look
            at. Some of the sectors above are original measurements; others (marked
            &ldquo;Derived&rdquo;) are ratios, growth rates, or indices this project built by
            recombining other series. Both are useful, but they answer different kinds of
            questions, and it&rsquo;s worth knowing which one you&rsquo;re looking at.
          </p>
        </ResearchNote>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Reading the labels                                          */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <header>
          <p className="font-label text-xs font-semibold uppercase tracking-wide text-secondary">Reading the badges</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-ink md:text-[2rem]">
            What does the little badge under each chart actually mean?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Every chart on this dashboard carries a small source badge. Hover it to see the
            exact source name; the icon and color tell you, at a glance, what kind of source
            you&rsquo;re looking at.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {RELIABILITY_GUIDE.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.key} className="glass-card flex gap-3 p-5">
                <Icon size={20} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${g.tone}`} />
                <div>
                  <p className="font-label text-sm font-semibold text-ink">{g.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{g.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
