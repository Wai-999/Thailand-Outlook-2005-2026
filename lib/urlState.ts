/**
 * Centralized URL search-param helpers (SPEC-10).
 *
 * All param key names live here. Components import from this module
 * rather than hardcoding strings, so renaming a key is a one-line change.
 */

// ── Key names ────────────────────────────────────────────────────────────────
export const PARAM = {
  /** ISO date string for the start of a zoomed range (e.g. "2010"). */
  rangeStart: 'from',
  /** ISO date string for the end of a zoomed range (e.g. "2020"). */
  rangeEnd: 'to',
  /** Active tab slug within a page. */
  tab: 'tab',
  /** Active sector slug on the sector-intelligence page. */
  sector: 'sector',
} as const;

// ── Range helpers ─────────────────────────────────────────────────────────────

/**
 * Read `from` and `to` from a URLSearchParams (or ReadonlyURLSearchParams)
 * instance and return them as typed values.
 */
export function decodeRange(params: URLSearchParams | { get(k: string): string | null }): {
  start: string | null;
  end: string | null;
} {
  return {
    start: params.get(PARAM.rangeStart) ?? null,
    end: params.get(PARAM.rangeEnd) ?? null,
  };
}

/**
 * Writes range values into a mutable URLSearchParams object in-place.
 * Pass `null` to clear either param.
 */
export function encodeRange(
  params: URLSearchParams,
  start: string | null,
  end: string | null,
): void {
  if (start) {
    params.set(PARAM.rangeStart, start);
  } else {
    params.delete(PARAM.rangeStart);
  }
  if (end) {
    params.set(PARAM.rangeEnd, end);
  } else {
    params.delete(PARAM.rangeEnd);
  }
}

// ── Share URL ─────────────────────────────────────────────────────────────────

/**
 * Returns the current page URL as a string for use in the clipboard.
 * Safe to call only on the client (requires `window`).
 */
export function buildShareUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

/**
 * Returns the URL with the given search params merged in, without
 * performing any navigation. Useful for generating a canonical link.
 */
export function buildUrlWithParams(params: URLSearchParams): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  params.forEach((v, k) => url.searchParams.set(k, v));
  return url.toString();
}
