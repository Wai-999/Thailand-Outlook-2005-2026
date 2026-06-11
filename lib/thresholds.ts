/**
 * Threshold alert system — pure helpers for KPI breach detection.
 *
 * All evaluation logic is isolated here so it can be unit-tested
 * without mounting any component. Persistence uses a versioned
 * localStorage key so future schema changes don't corrupt old data.
 */

export type ThresholdDirection = 'above' | 'below';

export type ThresholdConfig = {
  code: string;
  label: string;
  threshold: number;
  direction: ThresholdDirection;
  /** Unit string shown next to the threshold input (e.g. "%"). */
  unit?: string;
};

// ── Defaults (per SPEC-07) ────────────────────────────────────────────────────
export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  {
    code: 'real_gdp_growth_pct',
    label: 'Real GDP growth',
    threshold: 2,
    direction: 'below',
    unit: '%',
  },
  {
    code: 'household_debt_gdp_pct',
    label: 'Household debt / GDP',
    threshold: 85,
    direction: 'above',
    unit: '%',
  },
  {
    code: 'cpi_inflation_pct',
    label: 'Headline inflation',
    threshold: 4,
    direction: 'above',
    unit: '%',
  },
];

// ── Versioned storage key ─────────────────────────────────────────────────────
const STORAGE_KEY = 'thresholds:v1';

// ── Pure breach evaluation (unit-testable, no DOM dependency) ─────────────────
/**
 * Returns true when `value` crosses the configured threshold in
 * the configured direction — i.e. the card should show an alert.
 */
export function isBreach(value: number | null | undefined, config: ThresholdConfig): boolean {
  if (value === null || value === undefined || !Number.isFinite(value)) return false;
  return config.direction === 'above' ? value > config.threshold : value < config.threshold;
}

// ── Persistence ───────────────────────────────────────────────────────────────
export function loadThresholds(): ThresholdConfig[] {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_THRESHOLDS);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_THRESHOLDS);
    const parsed = JSON.parse(raw) as ThresholdConfig[];
    // Validate minimal shape
    if (!Array.isArray(parsed)) return structuredClone(DEFAULT_THRESHOLDS);
    return parsed;
  } catch {
    return structuredClone(DEFAULT_THRESHOLDS);
  }
}

export function saveThresholds(configs: ThresholdConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch {
    /* localStorage unavailable — ignore */
  }
}

export function resetThresholds(): ThresholdConfig[] {
  const defaults = structuredClone(DEFAULT_THRESHOLDS);
  saveThresholds(defaults);
  return defaults;
}
