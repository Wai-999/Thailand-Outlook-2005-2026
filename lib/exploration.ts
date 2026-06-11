/**
 * Visited-pages tracker — purely presentational, no data or stats logic.
 * Uses localStorage to remember which of the 12 primary sections the user
 * has visited, and exposes a progress count for the "Explored X of 12"
 * indicator in the Sidebar.
 *
 * All functions are SSR-safe: they no-op when window is undefined.
 */

/** The 12 primary sections that count toward the exploration progress. */
export const SECTION_HREFS = [
  '/',
  '/macro-outlook',
  '/sector-intelligence',
  '/province-map',
  '/trade-network',
  '/tourism-monitor',
  '/household-debt',
  '/investment-tracker',
  '/statistical-engine',
  '/forecast-lab',
  '/research-library',
  '/data-sources',
] as const;

export const TOTAL_SECTIONS = SECTION_HREFS.length; // 12

const STORAGE_KEY = 'thailand-outlook:visited';

/** Returns the set of hrefs the user has already visited. */
export function getVisited(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/** Marks a page as visited. Silently ignores pages not in SECTION_HREFS. */
export function markVisited(href: string): void {
  if (typeof window === 'undefined') return;
  if (!(SECTION_HREFS as readonly string[]).includes(href)) return;
  try {
    const visited = getVisited();
    if (visited.has(href)) return; // no write needed
    visited.add(href);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
    // Notify other components (e.g. Sidebar) in the same tab
    window.dispatchEvent(new Event('thailand-outlook:visited-updated'));
  } catch {
    // ignore quota errors
  }
}

/** Returns how many of the 12 sections the user has visited. */
export function getProgress(): { count: number; total: number } {
  const visited = getVisited();
  const count = SECTION_HREFS.filter((h) => visited.has(h)).length;
  return { count, total: TOTAL_SECTIONS };
}
