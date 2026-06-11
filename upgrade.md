# Thailand Outlook Dashboard — Feature Specification Pack (Items 6–10)

**Project:** Thailand Outlook Dashboard (Next.js + TypeScript + Tailwind + Zustand + Recharts)
**Document type:** Copy-paste-ready engineering prompts, structured as professional feature specifications
**Usage:** Each spec is self-contained. Paste the entire block (Objective → Definition of Done) as a single prompt.

---

## SPEC-06 — Interactive Indicator Correlation Explorer

**Priority:** High | **Module:** Statistical Engine | **Type:** Feature Enhancement

### Objective
Convert the static correlation matrix in the Statistical Engine into a fully interactive exploration tool that supports drill-down analysis, indicator filtering, and lagged correlation computation.

### Business Value
A static heatmap only reports *that* two indicators correlate. Analysts must be able to inspect *why*: identify outlier years, detect crisis-period-driven correlations, and evaluate whether a coefficient such as r = 0.7 is economically meaningful or a statistical artifact. This feature converts a display component into a diagnostic instrument suitable for professional macroeconomic review.

### Functional Requirements
1. **Cell drill-down scatter plot**
   - Clicking any matrix cell renders a scatter plot directly below the matrix showing the two selected indicators.
   - The scatter plot must include: an OLS trend line, the R² value displayed on-chart, axis labels with indicator names and units, and per-point year labels on hover.
   - Clicking a different cell replaces the current scatter plot; clicking the active cell again dismisses it.
2. **Indicator search filter**
   - A search input above the matrix filters which indicators appear (rows and columns simultaneously).
   - Filtering must be case-insensitive, match on indicator name or code, and update the matrix in real time.
3. **Lag selector**
   - A segmented control offering lag values of 0, 1, and 2 years.
   - Changing the lag recomputes the entire matrix using the existing `lagCorrelation` function in `lib/stats.ts` — do not reimplement the math.
   - The active lag must be visually indicated, and the scatter plot (if open) must recompute with the same lag applied.

### Technical Constraints
- All interaction state (selected cell, search term, lag value) lives in local React state. No global store changes.
- No new third-party libraries. Use existing Recharts components for the scatter plot.
- Matrix recomputation must not block the UI; memoize derived values with `useMemo`.

### Out of Scope
- Persisting state to URL or localStorage.
- Statistical significance testing (p-values).

### Definition of Done
- Clicking any cell opens an accurate scatter with OLS line and R².
- Search filters the matrix without layout breakage at any subset size.
- Lag 0/1/2 produces correct values verified against `lagCorrelation` output.
- No console errors; no new dependencies in `package.json`.

---

## SPEC-07 — KPI Threshold Alert System

**Priority:** High | **Module:** Command Center | **Type:** Feature Enhancement

### Objective
Add a configurable threshold alert layer to all Command Center KPI cards so the dashboard functions as an active monitoring tool rather than a passive display.

### Business Value
Without alerts, risk assessment requires manually scanning every card on every visit. Threshold-based visual warnings surface deteriorating signals immediately, reducing review time and ensuring critical movements (growth slowdown, debt accumulation, inflation breach) are never missed. This is the difference between a reporting dashboard and a monitoring system.

### Functional Requirements
1. **Threshold evaluation per KPI card**
   - When the latest value of a KPI crosses its configured threshold, the card displays a small warning icon and its border is highlighted in amber.
   - Cards within normal range render with no visual change.
2. **Settings drawer**
   - A slide-in drawer from the right side of the screen where each KPI's threshold can be viewed and edited.
   - Each row shows: indicator name, current value, threshold input, direction of breach (above / below), and a reset-to-default action.
   - Drawer open/close state is managed through the existing Zustand store.
3. **Persistence**
   - All threshold configurations persist in `localStorage` and survive page reloads.
   - On first load (no stored config), apply these defaults:
     - GDP growth **< 2%** → warn
     - Household debt-to-GDP **> 85%** → warn
     - Inflation **> 4%** → warn

### Technical Constraints
- Drawer state: Zustand (existing store). Threshold values: localStorage with a versioned key (e.g., `thresholds:v1`) to allow future schema migration.
- Threshold evaluation must be pure and unit-testable (a single function taking value + config, returning breach status).
- Accessible: warning icon must carry an `aria-label` describing the breach.

### Out of Scope
- Email/push notifications.
- Historical breach logging.

### Definition of Done
- Defaults apply on first load; edits persist across reloads.
- Breached cards show amber border + icon; recovery clears the state without reload.
- Drawer opens/closes via Zustand with no layout shift on the main grid.

---

## SPEC-08 — Mobile Usability Remediation

**Priority:** Critical | **Module:** Global Layout | **Type:** Bug Fix / UX Remediation

### Objective
Resolve four specific mobile usability defects that currently degrade the dashboard experience on small screens (375px–767px).

### Business Value
When the dashboard is deployed on Vercel and shared as a link, the majority of first impressions occur on mobile devices. A polished analytical product that breaks on a phone loses credibility instantly — with recruiters, clients, and collaborators alike. Mobile remediation directly protects the perceived professionalism of the entire project.

### Functional Requirements
1. **Command Center metric cards**
   - On viewports ≤ 375px, cards must render in a single column with correct internal padding and no horizontal overflow.
   - Verify against iPhone SE (375×667) and a 360px Android baseline.
2. **Chart touch interaction**
   - On screens < 768px, wrap Recharts charts in a horizontally scrollable container and enable `allowDataOverflow` so dense time series remain readable.
   - Scroll containers must show a subtle visual affordance (fade or scroll hint) indicating horizontal scrollability.
3. **Sidebar drawer close target**
   - Increase the close button's tappable hit area to a minimum of 44×44px (Apple HIG / WCAG 2.5.5 target size), without enlarging the visual icon disproportionately.
4. **Data Editor mobile mode**
   - Add a "Mobile view" toggle on the Data Editor that switches the horizontal table to a card-per-row layout.
   - Each card shows the row's key fields with labels; editing remains functional in card mode.
   - Default to card mode automatically below 768px, with the toggle allowing override.

### Technical Constraints
- Use Tailwind responsive utilities; no CSS framework additions.
- No regression on desktop layouts (≥ 1024px) — verify all four areas at desktop width after changes.

### Out of Scope
- Full responsive redesign of pages not listed above.
- PWA/offline behavior.

### Definition of Done
- Zero horizontal page overflow at 360px, 375px, and 414px widths.
- All four defects verified fixed in Chrome DevTools device emulation and at least one real device.
- Desktop rendering unchanged (visual spot-check on all affected pages).

---

## SPEC-09 — Supabase Data Pipeline Migration

**Priority:** High | **Module:** Data Layer | **Type:** Infrastructure

### Objective
Replace the static JSON/CSV data source with a Supabase PostgreSQL backend, while retaining the static files as a zero-configuration fallback.

### Business Value
The static-file approach makes every data update a developer task: edit JSON by hand, commit, redeploy. With a database backend, a new year's figures can be entered in 30 seconds and propagate to every chart automatically. This converts the dashboard from a code artifact into a maintainable data product — a prerequisite for professional contract use and ongoing publication.

### Functional Requirements
1. **Database schema**
   - `indicators` table: `id` (PK), `code` (unique), `name`, `sector`, `unit`, `source`, `reliability`.
   - `data_points` table: `indicator_id` (FK → indicators.id), `year`, `value`, `is_forecast` (boolean); composite uniqueness on (`indicator_id`, `year`).
   - Provide the SQL migration script as part of the deliverable.
2. **Data access layer**
   - Update `lib/data.ts` to fetch from Supabase via the official JS client.
   - Preserve the existing function signatures and return shapes so no consuming component requires changes.
3. **Fallback behavior**
   - If `NEXT_PUBLIC_SUPABASE_URL` is unset, the data layer silently falls back to the bundled static JSON. The app must run identically in both modes.
4. **Rendering strategy**
   - Initial data fetch occurs in Server Components; data is passed to Client Components as props. No client-side fetch on first paint.

### Technical Constraints
- Read-only access from the app (no in-app writes in this phase); use the anon key with RLS enabled for SELECT.
- Type the Supabase responses; do not use `any`. Generate or hand-write row types matching the schema.
- Environment variables documented in `.env.example`.

### Out of Scope
- Admin UI for data entry (data managed via Supabase dashboard in this phase).
- Authentication.

### Definition of Done
- App runs correctly with and without Supabase env vars set.
- Schema migration script runs cleanly on a fresh Supabase project.
- A value edited in Supabase appears on the dashboard after refresh with no code change or redeploy.
- All existing pages render identical output to the static version (parity check).

---

## SPEC-10 — Chart Export & Shareable Deep Links

**Priority:** Medium-High | **Module:** All Chart Pages | **Type:** Feature Enhancement

### Objective
Add PNG export and state-encoding shareable URLs to every chart page, eliminating the dashboard's "last-mile" gap between analysis and communication.

### Business Value
A research dashboard that cannot produce a chart image for a slide deck, or share a precise view via link, forces analysts back into screenshots and verbal descriptions. These two features together convert the dashboard from a private analysis tool into a citable reference: any chart can be dropped into a presentation, and any specific analytical view can be sent to a colleague and reproduced exactly.

### Functional Requirements
1. **PNG export — `useChartExport` hook**
   - Implement a reusable `useChartExport` hook that captures the Recharts SVG via the browser canvas API and triggers a PNG download.
   - Export at 2× pixel density for presentation quality; filename pattern: `{page}-{chart}-{YYYY-MM-DD}.png`.
   - Exported image must include the chart title and a white (non-transparent) background.
   - Add an "Export PNG" button to every chart, positioned consistently (top-right of each chart container).
2. **Shareable deep links**
   - Encode current page state — selected sector, date range, active tab — as URL search params using Next.js `useSearchParams` and `useRouter`.
   - State changes update the URL via `router.replace` (no history spam); opening a shared URL restores the exact view.
   - Invalid or partial params degrade gracefully to defaults — never crash or render an empty state.
   - Add a "Copy link" button that copies the current URL and confirms with a brief toast/check state.

### Technical Constraints
- No new libraries: SVG-to-canvas conversion via `XMLSerializer` + `Image` + `canvas.toBlob`; clipboard via `navigator.clipboard`.
- URL param parsing centralized in one utility (e.g., `lib/urlState.ts`) — no per-page ad-hoc parsing.
- Hook must handle charts of any rendered dimension without clipping.

### Out of Scope
- SVG or PDF export formats.
- Server-side rendered share preview images (OG images).

### Definition of Done
- Every chart page exports a correctly rendered, presentation-quality PNG.
- A copied URL opened in a fresh incognito window reproduces the exact view (sector, range, tab).
- Malformed URL params fall back to defaults without error.
- `useChartExport` is used by all charts with zero duplicated capture logic.

---

## Suggested Implementation Order

| Order | Spec | Rationale |
|-------|------|-----------|
| 1 | SPEC-08 (Mobile) | Protects credibility of everything already shipped |
| 2 | SPEC-07 (Alerts) | High visible value, low architectural risk |
| 3 | SPEC-06 (Correlation) | Analytical depth, isolated to one module |
| 4 | SPEC-10 (Export/Share) | Communication layer on a now-stable UI |
| 5 | SPEC-09 (Supabase) | Infrastructure last — migrate once features stabilize |
