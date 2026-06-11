type ScoreItem = {
  label: string;
  score: number;
  note: string;
  tone?: 'primary' | 'secondary' | 'success' | 'warning';
};

const BAR_CLASSES: Record<NonNullable<ScoreItem['tone']>, string> = {
  primary: 'from-primary to-sky-400',
  secondary: 'from-secondary to-cyan-400',
  success: 'from-success to-emerald-400',
  warning: 'from-[var(--accent-amber)] to-orange-400',
};

export default function ScoreBars({
  title,
  subtitle,
  items,
  footer,
}: {
  title: string;
  subtitle?: string;
  items: ScoreItem[];
  footer?: string;
}) {
  return (
    <section className="glass-card p-5 md:p-6">
      <header className="mb-5 max-w-2xl">
        <h2 className="text-sm font-semibold text-ink md:text-base">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </header>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[var(--radius-md)] border border-glass-border bg-white/45 px-4 py-3">
            <div className="mb-2 flex items-end justify-between gap-3">
              <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                {item.label}
              </p>
              <p className="font-mono text-sm font-semibold text-ink">{item.score}/100</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(15,23,42,0.08)]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${BAR_CLASSES[item.tone ?? 'primary']}`}
                style={{ width: `${Math.max(4, Math.min(100, item.score))}%` }}
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.note}</p>
          </div>
        ))}
      </div>
      {footer && <p className="mt-4 text-xs leading-relaxed text-ink-soft">{footer}</p>}
    </section>
  );
}
