import type { IndicatorSeries } from './types';

export function latestValue(series?: IndicatorSeries): number | null {
  if (!series?.points.length) return null;
  return series.points[series.points.length - 1]?.value ?? null;
}

export function previousValue(series?: IndicatorSeries, periodsBack = 1): number | null {
  if (!series?.points.length || series.points.length <= periodsBack) return null;
  return series.points[series.points.length - 1 - periodsBack]?.value ?? null;
}

export function absoluteChange(series?: IndicatorSeries, periodsBack = 1): number | null {
  const latest = latestValue(series);
  const previous = previousValue(series, periodsBack);
  if (latest === null || previous === null) return null;
  return latest - previous;
}

export function percentChange(series?: IndicatorSeries, periodsBack = 1): number | null {
  const latest = latestValue(series);
  const previous = previousValue(series, periodsBack);
  if (latest === null || previous === null || previous === 0) return null;
  return ((latest - previous) / Math.abs(previous)) * 100;
}

export function normalizedLatestScore(series?: IndicatorSeries, invert = false): number | null {
  if (!series?.points.length) return null;
  const values = series.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (max === min) return 50;

  const latest = values[values.length - 1]!;
  const ratio = (latest - min) / (max - min);
  const score = invert ? 1 - ratio : ratio;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function averageScores(
  inputs: { series?: IndicatorSeries; invert?: boolean; weight?: number }[],
): number | null {
  const scored = inputs
    .map(({ series, invert = false, weight = 1 }) => {
      const score = normalizedLatestScore(series, invert);
      if (score === null) return null;
      return { score, weight };
    })
    .filter((entry): entry is { score: number; weight: number } => entry !== null);

  if (!scored.length) return null;

  const totalWeight = scored.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return null;

  const weighted = scored.reduce((sum, entry) => sum + entry.score * entry.weight, 0);
  return Math.round(weighted / totalWeight);
}

export function latestYear(series?: IndicatorSeries): string | null {
  if (!series?.points.length) return null;
  return series.points[series.points.length - 1]?.date.slice(0, 4) ?? null;
}
