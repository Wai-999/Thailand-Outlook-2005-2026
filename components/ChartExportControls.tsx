'use client';

import { useState, useCallback, type RefObject } from 'react';
import { Download, Link2, Check, Loader2 } from 'lucide-react';
import { useChartExport } from '@/hooks/useChartExport';
import { buildShareUrl } from '@/lib/urlState';

/**
 * ChartExportControls — a small row of buttons that floats in the top-right
 * corner of a chart card. Provides:
 *   - "Export PNG": serialises the chart SVG and downloads a 2× PNG.
 *   - "Copy link": copies the current page URL (including any state encoded
 *     in the search params) to the clipboard and shows a brief tick.
 *
 * @example
 * ```tsx
 * const { containerRef, exportPng, exporting } = useChartExport('gdp-growth');
 * return (
 *   <GlassCard title="GDP Growth">
 *     <div ref={containerRef} className="relative">
 *       <ChartExportControls
 *         exportPng={exportPng}
 *         exporting={exporting}
 *       />
 *       <RangeChart series={gdpGrowth} />
 *     </div>
 *   </GlassCard>
 * );
 * ```
 */
export default function ChartExportControls({
  exportPng,
  exporting,
}: {
  exportPng: () => Promise<void>;
  exporting: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    const url = buildShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard without interaction
      prompt('Copy this link:', url);
    }
  }, []);

  return (
    <div
      className="absolute right-0 top-0 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/chart:opacity-100"
      aria-label="Chart actions"
    >
      {/* Export PNG */}
      <button
        onClick={exportPng}
        disabled={exporting}
        title="Export chart as PNG"
        aria-label="Export chart as PNG"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/90 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:border-[var(--primary)]/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting ? (
          <Loader2 size={13} strokeWidth={2} className="animate-spin" />
        ) : (
          <Download size={13} strokeWidth={2} />
        )}
      </button>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        title="Copy link to this chart"
        aria-label="Copy link to this chart"
        className="flex h-7 items-center gap-1 rounded-lg border border-[var(--glass-border)] bg-white/90 px-2 text-[11px] font-medium text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:border-[var(--primary)]/40 hover:text-primary"
      >
        {copied ? (
          <>
            <Check size={11} strokeWidth={2.5} className="text-success" />
            <span className="text-success">Copied!</span>
          </>
        ) : (
          <>
            <Link2 size={11} strokeWidth={2} />
            <span>Copy link</span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Convenience wrapper: renders a `<div>` with the group class and `ref`,
 * the export controls, and the chart as children. Handles the boilerplate
 * so call sites just need to supply a filename and the chart JSX.
 *
 * @example
 * ```tsx
 * <ChartExportWrapper filename="gdp-growth">
 *   <RangeChart series={gdpGrowth} />
 * </ChartExportWrapper>
 * ```
 */
export function ChartExportWrapper({
  filename,
  children,
}: {
  filename: string;
  children: React.ReactNode;
}) {
  const { containerRef, exportPng, exporting } = useChartExport(filename);

  return (
    <div ref={containerRef} className="group/chart relative">
      <ChartExportControls exportPng={exportPng} exporting={exporting} />
      {children}
    </div>
  );
}
