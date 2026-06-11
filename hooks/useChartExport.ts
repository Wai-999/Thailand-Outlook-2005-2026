'use client';

import { useRef, useState, useCallback } from 'react';

const SCALE = 2; // 2× for HiDPI / Retina

/**
 * Grabs the first `<svg>` element inside `container`, renders it to a
 * 2× canvas, and triggers a PNG download.
 *
 * @param container  — The wrapping `<div>` that holds the Recharts SVG.
 * @param filename   — Download filename without extension (e.g. "gdp-growth-2026-06-10").
 */
async function svgTopng(container: HTMLElement, filename: string): Promise<void> {
  const svg = container.querySelector<SVGSVGElement>('svg');
  if (!svg) throw new Error('No <svg> found in container');

  // Snapshot bounding rect for dimensions
  const { width, height } = svg.getBoundingClientRect();
  if (!width || !height) throw new Error('SVG has zero dimensions');

  // Clone so we can safely mutate (add white background)
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Prepend white background rect so the PNG isn't transparent
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  // Resolve CSS custom properties used in the chart strokes/fills
  // by inlining computed styles of the clone's children.
  // (Simple approach: set stroke/fill explicitly for common vars)
  const style = clone.querySelector('style') ?? clone.insertBefore(
    document.createElementNS('http://www.w3.org/2000/svg', 'style'),
    clone.firstChild,
  );
  style.textContent = `
    * { --primary: #2563eb; --secondary: #14b8a6; --glass-border: #e2e8f0;
        --text-soft: #64748b; }
  `;

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * SCALE);
      canvas.height = Math.round(height * SCALE);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas 2d unavailable')); return; }
      ctx.scale(SCALE, SCALE);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('toBlob failed')); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = `${filename}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load error')); };
    img.src = url;
  });
}

// ── Public hook ───────────────────────────────────────────────────────────────

/**
 * Returns a `containerRef` to attach to the wrapping div of a chart, plus
 * an `exportPng` trigger and an `exporting` boolean for loading state.
 *
 * @example
 * ```tsx
 * const { containerRef, exportPng, exporting } = useChartExport('gdp-growth');
 * return (
 *   <div ref={containerRef} className="relative">
 *     <button onClick={exportPng} disabled={exporting}>Export PNG</button>
 *     <RangeChart series={gdpSeries} />
 *   </div>
 * );
 * ```
 */
export function useChartExport(baseFilename: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportPng = useCallback(async () => {
    const el = containerRef.current;
    if (!el || exporting) return;
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await svgTopng(el, `${baseFilename}-${today}`);
    } catch (err) {
      console.error('[useChartExport]', err);
    } finally {
      setExporting(false);
    }
  }, [baseFilename, exporting]);

  return { containerRef, exportPng, exporting };
}
