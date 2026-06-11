'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import {
  loadThresholds,
  saveThresholds,
  resetThresholds,
  isBreach,
  type ThresholdConfig,
} from '@/lib/thresholds';

/**
 * ThresholdDrawer — slide-in panel from the right where each KPI's
 * alert threshold can be viewed, edited, or reset to default.
 *
 * State is managed through the existing Zustand store (open/close).
 * Threshold values persist in localStorage under `thresholds:v1`.
 */
export default function ThresholdDrawer({
  currentValues,
}: {
  /** Map of indicator code → latest value for live breach preview. */
  currentValues?: Record<string, number | null>;
}) {
  const { alertsDrawerOpen, setAlertsDrawerOpen } = useUIStore();
  const [configs, setConfigs] = useState<ThresholdConfig[]>([]);

  // Hydrate from localStorage on first open
  useEffect(() => {
    if (alertsDrawerOpen) {
      setConfigs(loadThresholds());
    }
  }, [alertsDrawerOpen]);

  function handleThresholdChange(code: string, raw: string) {
    const val = parseFloat(raw);
    if (!Number.isFinite(val)) return;
    setConfigs((prev) =>
      prev.map((c) => (c.code === code ? { ...c, threshold: val } : c)),
    );
  }

  function handleDirectionChange(code: string, direction: 'above' | 'below') {
    setConfigs((prev) =>
      prev.map((c) => (c.code === code ? { ...c, direction } : c)),
    );
  }

  function handleSave() {
    saveThresholds(configs);
    setAlertsDrawerOpen(false);
    // Trigger a storage event so MetricCards pick up the change immediately
    window.dispatchEvent(new Event('storage'));
  }

  function handleReset() {
    setConfigs(resetThresholds());
    window.dispatchEvent(new Event('storage'));
  }

  if (!alertsDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:bg-black/20"
        onClick={() => setAlertsDrawerOpen(false)}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal
        aria-label="KPI alert thresholds"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--glass-border)] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
          <div>
            <p className="font-label text-[10px] font-semibold uppercase tracking-wide text-secondary">
              Alert configuration
            </p>
            <h2 className="mt-0.5 text-sm font-semibold text-ink">KPI thresholds</h2>
          </div>
          <button
            onClick={() => setAlertsDrawerOpen(false)}
            aria-label="Close alert settings"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-[var(--surface)] hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 text-xs leading-relaxed text-ink-muted">
            When a KPI crosses its threshold, its card shows an amber border and a warning icon.
            Changes take effect immediately and persist across page reloads.
          </p>

          <div className="flex flex-col gap-4">
            {configs.map((cfg) => {
              const current = currentValues?.[cfg.code] ?? null;
              const breached = isBreach(current, cfg);

              return (
                <div
                  key={cfg.code}
                  className={`rounded-xl border p-4 transition-colors ${
                    breached
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-[var(--glass-border)] bg-[var(--surface)]'
                  }`}
                >
                  {/* Label + breach indicator */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{cfg.label}</p>
                    {breached && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <AlertTriangle size={10} strokeWidth={2.5} />
                        Breached
                      </span>
                    )}
                  </div>

                  {/* Current value */}
                  {current !== null && (
                    <p className="mb-3 text-xs text-ink-muted">
                      Current value:{' '}
                      <span className={`font-semibold ${breached ? 'text-amber-700' : 'text-ink'}`}>
                        {current.toFixed(1)}{cfg.unit}
                      </span>
                    </p>
                  )}

                  {/* Direction selector */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-ink-soft">Alert when</span>
                    <div className="flex overflow-hidden rounded-lg border border-[var(--glass-border)] text-[11px] font-medium">
                      {(['above', 'below'] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => handleDirectionChange(cfg.code, dir)}
                          className={`px-3 py-1 transition-colors ${
                            cfg.direction === dir
                              ? 'bg-primary text-white'
                              : 'text-ink-muted hover:text-ink'
                          }`}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Threshold input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-soft">threshold:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={cfg.threshold}
                      onChange={(e) => handleThresholdChange(cfg.code, e.target.value)}
                      className="w-24 rounded-lg border border-[var(--glass-border)] bg-white px-2.5 py-1.5 text-sm tabular-nums text-ink focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
                    />
                    {cfg.unit && <span className="text-xs text-ink-soft">{cfg.unit}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-[var(--glass-border)] px-5 py-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <RotateCcw size={13} strokeWidth={2} />
            Reset to defaults
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Save &amp; apply
          </button>
        </div>
      </aside>
    </>
  );
}
