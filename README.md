# Thailand Outlook — Economic Research Dashboard

An independent, open-source research dashboard for the Thai economy. Every chart traces to a named source, every model shows its work, and every figure comes with a methodology note.

**Live site:** [deploy link here once live]

---

## What this is

Thailand's economic data is scattered across a dozen institutions — the Bank of Thailand publishes one set of numbers, NESDC another, the Tourism Authority a third. Reconciling them into a coherent picture used to be a manual exercise every time.

Thailand Outlook is the platform that should have existed. It pulls together macro indicators, sector performance, tourism data, household debt trends, investment flows, and statistical analysis into one place — with full source attribution, transparent methodology, and no figures dressed up as more certain than they are.

---

## Pages

| Page | Description | Status |
|------|-------------|--------|
| **Command Center** | Headline economic snapshot — is Thailand improving, weakening, or mixed? | ✅ Live |
| **Macro Outlook** | GDP, inflation, trade, monetary policy — the big macro picture | ✅ Live |
| **Sector Intelligence** | Industry-by-industry performance across manufacturing, services, agriculture | ✅ Live |
| **Tourism Monitor** | Arrivals, receipts, recovery index vs. 2019 peak | ✅ Live |
| **Household & Debt** | Household debt-to-GDP, NPL ratios, financial stress scoring | ✅ Live |
| **Investment Tracker** | FDI flows, BOI approvals, private capital formation | ✅ Live |
| **Statistical Engine** | Correlation matrix, OLS regression, descriptive stats — math shown | ✅ Live |
| **Forecast Lab** | Transparent linear-trend projections with scenario modeling | ✅ Live |
| **Data Sources** | Full source list with reliability badges and coverage stats | ✅ Live |
| **Data Editor** | Password-protected in-browser editor for indicator values | ✅ Live |
| **Documentation** | Dashboard guide + Technical Methods tab (all formulas documented) | ✅ Live |
| **Contact** | About the project and author | ✅ Live |
| Province Map | Geographic breakdown by province | 🔜 Planned |
| Trade Network | Bilateral trade partner analysis | 🔜 Planned |
| Research Library | Methodology write-ups and further reading | 🔜 Planned |

---

## Data sources

| Source | What it covers | Reliability |
|--------|----------------|-------------|
| **Bank of Thailand (BOT)** | Policy rate, monetary aggregates, household debt, NPL, FX | Official |
| **NESDC** | GDP, national accounts, investment, consumption | Official |
| **NSO Thailand** | CPI, labor market, household surveys | Official |
| **World Bank WDI** | FDI, trade openness, long-run macro series | International body |
| **IMF** | Cross-check on fiscal and external balance data | International body |

All data is compiled into a static research snapshot (`public/data/`) — no live API connection. The most recent 1–2 years are often marked forecast or preliminary by the original compilers.

---

## Statistical methods

All calculations are implemented in plain TypeScript in [`lib/stats.ts`](lib/stats.ts) — no external statistical library, fully reproducible in a spreadsheet.

| Method | Where used | Formula |
|--------|------------|---------|
| **Pearson correlation** | Statistical Engine — correlation matrix | r = Σ[(xᵢ−x̄)(yᵢ−ȳ)] / √[Σ(xᵢ−x̄)² · Σ(yᵢ−ȳ)²] |
| **Lag correlation** | Statistical Engine — leading indicator analysis | Shifts one series by k periods before computing r |
| **OLS regression** | Statistical Engine — GDP growth explainer | β = Σ[(xᵢ−x̄)(yᵢ−ȳ)] / Σ(xᵢ−x̄)² |
| **R²** | Regression fit quality | 1 − SS_res / SS_tot |
| **YoY growth rate** | All pages with change indicators | (value_t − value_t−1) / \|value_t−1\| × 100% |
| **CAGR** | Multi-year trend summaries | (end / start)^(1/n) − 1 |
| **Additive risk score** | Command Center, Household & Debt | Σ driver contributions, clamped 0–100 |
| **Linear trend forecast** | Forecast Lab | OLS on time index, extrapolated forward |
| **Tourism Recovery Index** | Tourism Monitor | (arrivals_t / arrivals_2019) × 100 |

Full methodology documentation is in the **Technical Methods** tab on the [Documentation page](/docs).

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| State | Zustand 5 |
| Hosting | Vercel (recommended) |

---

## Project structure

```
thailand-outlook/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Command Center (/)
│   ├── macro-outlook/      # Macro Outlook
│   ├── sector-intelligence/
│   ├── tourism-monitor/
│   ├── household-debt/
│   ├── investment-tracker/
│   ├── statistical-engine/
│   ├── forecast-lab/
│   ├── data-sources/
│   ├── data-editor/        # Password-protected data editor
│   ├── docs/               # Documentation + Technical Methods
│   ├── contact/
│   └── api/user-data/      # API route for data editor reads/writes
├── components/             # Shared UI components
│   ├── Sidebar.tsx
│   ├── GlassCard.tsx
│   ├── MetricCard.tsx
│   ├── CorrelationMatrix.tsx
│   ├── RegressionPanel.tsx
│   ├── ResearchNote.tsx
│   ├── SourceBadge.tsx
│   └── data/UserDataEditor.tsx
├── lib/
│   ├── stats.ts            # All statistical calculations
│   ├── data.ts             # Data access helpers
│   ├── nav.ts              # Navigation config
│   ├── store.ts            # Zustand UI store
│   └── types.ts            # TypeScript types
├── public/data/
│   ├── macro.json          # Macro indicators (2005–2026)
│   ├── micro.json          # Sector indicators
│   └── user/               # Editable user data CSVs
└── scripts/
    └── build-data.mjs      # Data pipeline script
```

---

## Running locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Type-check
npx tsc --noEmit

# Build for production
npm run build
```

Node.js 18+ required.

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import this repository
4. Leave all settings as default — Vercel auto-detects Next.js
5. Click **Deploy**

Every push to `main` triggers an automatic redeploy.

---

## Design principles

- **Source everything.** Every indicator carries a named publisher and a reliability badge (`official`, `international`, `secondary`). No figure appears without a citation.
- **Show the work.** Statistical methods are documented in the UI (research notes, interpretation panels) and in full on the Technical Methods page. Every formula can be reproduced in a spreadsheet.
- **Be honest about uncertainty.** Forecasts are labeled as forecasts. Preliminary data is labeled preliminary. Gaps in the data show as gaps in the chart — never filled in.
- **No black boxes.** The risk scores, correlation thresholds, and scenario adjustments all use named rules that can be read and questioned. A transparent heuristic is more useful than an opaque model.

---

## Data coverage

- **Indicators tracked:** 80+ individual series
- **Sectors:** 12 (GDP & Growth, Inflation, Trade, Tourism, Labour, Finance & Banking, Investment, Household & Debt, Government, External, Energy, and more)
- **Time span:** 2005–2026 (historical through 2024; 2025–2026 are forecast/preliminary from original compilers)

---

## License

MIT — use it, fork it, build on it. If you spot a number that looks wrong or a source that's gone stale, open an issue.

---

*Built by [Wai](mailto:harryethan136@gmail.com) — an analyst focused on Southeast Asian economies.*
