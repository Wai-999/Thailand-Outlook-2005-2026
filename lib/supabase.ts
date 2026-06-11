/**
 * Supabase client factory (SPEC-09).
 *
 * This module exports:
 *  - Typed database row shapes (no `any`).
 *  - A lazy `getSupabaseClient()` that returns null when the env vars are absent,
 *    so the app falls back to static JSON rather than crashing at startup.
 *  - `isSupabaseConfigured()` — cheap boolean gate used in data.ts.
 *
 * Usage pattern (Server Component):
 * ```ts
 * import { fetchSeriesFromSupabase } from '@/lib/data';
 * const series = await fetchSeriesFromSupabase();
 * ```
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Typed row shapes ──────────────────────────────────────────────────────────
// These mirror the SQL schema in supabase/migrations/001_initial.sql.

/** Row in the `indicators` table. */
export type DbIndicator = {
  code: string;
  name: string;
  unit: string;
  sector: string;
  frequency: 'daily' | 'monthly' | 'quarterly' | 'annual';
  source_name: string;
  source_url: string | null;
  is_demo: boolean;
};

/** Row in the `data_points` table. */
export type DbDataPoint = {
  indicator_code: string;
  date: string; // ISO date string, e.g. "2023-01-01"
  value: number;
};

/** Joined shape returned by the Supabase query (indicator + its points). */
export type DbIndicatorWithPoints = DbIndicator & {
  data_points: Pick<DbDataPoint, 'date' | 'value'>[];
};

// ── Client factory ────────────────────────────────────────────────────────────

/**
 * Returns a typed Supabase client, or `null` when the required environment
 * variables are not present. The null path is the "static fallback" branch.
 *
 * The client is a module-level singleton — safe to call on every request in
 * a Next.js Server Component because Next.js caches module-level state across
 * requests within the same process.
 */
let _client: SupabaseClient | null | undefined = undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    _client = null;
    return null;
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _client;
}

/** Fast boolean check — avoids the full client construction overhead. */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
