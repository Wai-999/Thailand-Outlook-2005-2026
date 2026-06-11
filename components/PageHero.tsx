import type { ReactNode } from 'react';
import clsx from 'clsx';

type HeroMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'neutral';
};

const TONE_CLASS: Record<NonNullable<HeroMetric['tone']>, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  neutral: 'text-ink',
};

export default function PageHero({
  eyebrow,
  title,
  description,
  metrics = [],
  action,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  metrics?: HeroMetric[];
  action?: ReactNode;
}) {
  return (
    <section className="hero-shell overflow-hidden rounded-[var(--radius-xl)] px-6 py-7 md:px-8 md:py-8">
      <div aria-hidden className="hero-orb hero-orb-a" />
      <div aria-hidden className="hero-orb hero-orb-b" />
      <div className="relative z-[1] grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="max-w-3xl">
          <p className="font-label text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-ink md:text-[3rem]">{title}</h1>
          <div className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">{description}</div>
          {action && <div className="mt-5">{action}</div>}
        </div>

        {metrics.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {metrics.map((metric) => (
              <div key={metric.label} className="hero-metric-card">
                <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  {metric.label}
                </p>
                <p className={clsx('mt-2 font-display text-3xl font-bold', TONE_CLASS[metric.tone ?? 'neutral'])}>
                  {metric.value}
                </p>
                {metric.detail && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{metric.detail}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
