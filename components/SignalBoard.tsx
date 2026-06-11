import clsx from 'clsx';

type SignalItem = {
  label: string;
  value: string;
  note: string;
  change?: string;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
};

const BOARD_TONE_CLASS: Record<NonNullable<SignalItem['tone']>, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-ink',
};

export default function SignalBoard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: SignalItem[];
}) {
  return (
    <section className="glass-card p-5 md:p-6">
      <header className="mb-5 max-w-2xl">
        <h2 className="text-sm font-semibold text-ink md:text-base">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="signal-tile">
            <div className="flex items-start justify-between gap-3">
              <p className="font-label max-w-[12rem] text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                {item.label}
              </p>
              {item.change && (
                <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium text-ink-soft">
                  {item.change}
                </span>
              )}
            </div>
            <p className={clsx('mt-4 font-display text-3xl font-bold', BOARD_TONE_CLASS[item.tone ?? 'neutral'])}>
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
