'use client';

import { Bell } from 'lucide-react';
import { useUIStore } from '@/lib/store';

/**
 * Thin client component: one button that opens the ThresholdDrawer.
 * Rendered inside the server-side Command Center page alongside
 * MetricCards; the drawer itself handles all its own state.
 */
export default function AlertsConfigButton() {
  const toggleAlertsDrawer = useUIStore((s) => s.toggleAlertsDrawer);

  return (
    <button
      onClick={toggleAlertsDrawer}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
      title="Configure KPI alert thresholds"
    >
      <Bell size={12} strokeWidth={2.25} />
      Configure alerts
    </button>
  );
}
