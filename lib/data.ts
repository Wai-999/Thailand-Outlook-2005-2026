import macroBundle from '@/public/data/macro.json';
import microBundle from '@/public/data/micro.json';
import sourceRegistry from '@/public/data/sources.json';
import type { DatasetBundle, IndicatorSeries, SourceMeta } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import type { DbIndicatorWithPoints } from './supabase';

// Cast the static JSON imports to our schema once, at the edge.
export const macro = macroBundle as unknown as DatasetBundle;
export const micro = microBundle as unknown as DatasetBundle;
export const sources = sourceRegistry as unknown as SourceMeta[];

export const allBundles: DatasetBundle[] = [macro, micro];

export function allSeries(): IndicatorSeries[] {
  return [...macro.series, ...micro.series];
}

export function findSeries(indicatorCode: string): IndicatorSeries | undefined {
  return allSeries().find((s) => s.indicatorCode === indicatorCode);
}

export function seriesBySector(sector: string): IndicatorSeries[] {
  return allSeries().filter((s) => s.sector === sector);
}

export function latestPoint(series: IndicatorSeries) {
  return series.points[series.points.length - 1];
}

export function pointAtYear(series: IndicatorSeries, year: number) {
  return series.points.find((p) => p.date.startsWith(String(year)));
}

export function yoyChange(series: IndicatorSeries): number | null {
  const n = series.points.length;
  if (n < 2) return null;
  const last = series.points[n - 1].value;
  const prev = series.points[n - 2].value;
  if (prev === 0) return null;
  return ((last - prev) / Math.abs(prev)) * 100;
}

/** Format a value with its unit in a compact, research-readable way. */
export function formatValue(value: number, unit: string): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1000) formatted = value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  else if (abs >= 100) formatted = value.toFixed(1);
  else formatted = value.toFixed(2);

  if (/^%/.test(unit) || /percent/i.test(unit)) return `${formatted}%`;
  if (/usd billion/i.test(unit)) return `$${formatted}B`;
  if (/thousand/i.test(unit)) return `${formatted}K`;
  return `${formatted} ${unit}`;
}

export function freshnessLabel(series: IndicatorSeries): string {
  const last = latestPoint(series);
  if (!last) return 'No data';
  const year = last.date.slice(0, 4);
  return `Latest: ${year}`;
}

// ── Supabase async fetch (SPEC-09) ─────────────────────────────────────────────

/**
 * Converts a Supabase indicator row (with nested data_points) into the
 * application's `IndicatorSeries` shape. No `any` casts.
 */
function dbRowToSeries(row: DbIndicatorWithPoints): IndicatorSeries {
  return {
    sector: row.sector,
    indicatorCode: row.code,
    indicatorName: row.name,
    unit: row.unit,
    frequency: row.frequency,
    sourceName: row.source_name,
    sourceUrl: row.source_url ?? undefined,
    isDemo: row.is_demo,
    points: row.data_points
      .map((p) => ({ date: p.date, value: p.value }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Fetches all indicator series from Supabase when configured, or silently
 * returns the bundled static data when the env vars are absent.
 *
 * Designed for use in Next.js Server Components:
 * ```ts
 * // app/macro-outlook/page.tsx (Server Component)
 * import { fetchSeriesData } from '@/lib/data';
 * export default async function Page() {
 *   const series = await fetchSeriesData();
 *   const gdpGrowth = series.find(s => s.indicatorCode === 'real_gdp_growth_pct');
 *   return <ClientChart series={gdpGrowth} />;
 * }
 * ```
 *
 * The static fallback keeps every page functional without any database
 * credentials — just omit / leave blank the NEXT_PUBLIC_SUPABASE_* vars.
 */
export async function fetchSeriesData(): Promise<IndicatorSeries[]> {
  if (!isSupabaseConfigured()) {
    // Static fallback — identical to allSeries()
    return allSeries();
  }

  const client = getSupabaseClient();
  if (!client) return allSeries();

  const { data, error } = await client
    .from('indicators')
    .select(`
      code,
      name,
      unit,
      sector,
      frequency,
      source_name,
      source_url,
      is_demo,
      data_points ( date, value )
    `)
    .order('code');

  if (error) {
    console.error('[fetchSeriesData] Supabase error — falling back to static data:', error.message);
    return allSeries();
  }

  if (!data || data.length === 0) {
    console.warn('[fetchSeriesData] Supabase returned no rows — falling back to static data.');
    return allSeries();
  }

  return (data as DbIndicatorWithPoints[]).map(dbRowToSeries);
}
