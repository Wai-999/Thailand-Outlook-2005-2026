'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Download, Save, X, RefreshCw, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DataRow = {
  rowIndex: number;
  rowKey: string;
  sector: string;
  indicatorCode: string;
  indicatorName: string;
  unit: string;
  values: Record<string, string>;
};

type APIResponse = {
  rows: DataRow[];
  sectors: string[];
  yearColumns: string[];
  dataset: string;
  error?: string;
};

type PendingChange = { rowKey: string; year: string; value: string };

const YEAR_RANGE_OPTIONS = [
  { label: 'All years', value: 'all' },
  { label: '2015 onwards', value: '2015' },
  { label: 'Last 6 years', value: 'last6' },
] as const;
type YearRange = typeof YEAR_RANGE_OPTIONS[number]['value'];

// Stable empty object so memo'd rows don't re-render when they have no pending changes
const EMPTY_PENDING: Record<string, string> = {};

// ---------------------------------------------------------------------------
// CSV helper
// ---------------------------------------------------------------------------
function buildCSV(rows: DataRow[], yearColumns: string[], dataset: string): string {
  if (dataset === 'macro') {
    const header = ['Sector', 'Indicator Code', 'Indicator Name', 'Unit', ...yearColumns].join(',');
    const lines = rows.map((r) =>
      [r.sector, r.indicatorCode, r.indicatorName, r.unit, ...yearColumns.map((y) => r.values[y] ?? '')].join(','),
    );
    return [header, ...lines].join('\n');
  } else {
    const header = ['Sector', 'Indicator', 'Unit', ...yearColumns].join(',');
    const lines = rows.map((r) =>
      [r.sector, r.indicatorName, r.unit, ...yearColumns.map((y) => r.values[y] ?? '')].join(','),
    );
    return [header, ...lines].join('\n');
  }
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// EditableCell — local state, only commits to parent on blur.
// This means typing never triggers a parent re-render; only blur does.
// ---------------------------------------------------------------------------
const EditableCell = memo(function EditableCell({
  baseValue,
  pendingValue,
  onCommit,
}: {
  baseValue: string;
  pendingValue: string | undefined;
  onCommit: (value: string) => void;
}) {
  const isChanged = pendingValue !== undefined;
  const displayValue = isChanged ? pendingValue : baseValue;
  const [local, setLocal] = useState(displayValue);

  // Sync when external value changes (save, discard, dataset switch)
  const prev = useRef(displayValue);
  useEffect(() => {
    if (prev.current !== displayValue) {
      prev.current = displayValue;
      setLocal(displayValue);
    }
  }, [displayValue]);

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => onCommit(e.target.value)}
      placeholder="—"
      className={`w-[68px] rounded px-2 py-1 text-center text-xs tabular-nums transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/60 ${
        isChanged
          ? 'bg-[var(--secondary-soft)] font-semibold text-ink'
          : 'bg-transparent text-ink-muted hover:bg-[var(--surface)]'
      }`}
    />
  );
});

// ---------------------------------------------------------------------------
// EditorRow — memoized. Only re-renders when ITS OWN pending values change.
// Unchanged rows are completely skipped during re-renders.
// ---------------------------------------------------------------------------
const EditorRow = memo(function EditorRow({
  row,
  visibleYears,
  pendingForRow,
  onCellChange,
}: {
  row: DataRow;
  visibleYears: string[];
  pendingForRow: Record<string, string>;
  onCellChange: (rowKey: string, year: string, value: string) => void;
}) {
  return (
    <tr className="group border-b border-[var(--glass-border)]/40 last:border-0 transition-colors hover:bg-[var(--primary-soft)]/30">
      <td className="sticky left-0 z-10 min-w-[200px] bg-white/90 py-2 pl-4 pr-3 font-medium text-ink shadow-[1px_0_0_0_var(--glass-border)] transition-colors group-hover:bg-[var(--primary-soft)]/40">
        {row.indicatorName}
      </td>
      <td className="sticky left-[200px] z-10 min-w-[88px] bg-white/90 py-2 pr-4 text-xs text-ink-muted shadow-[1px_0_0_0_var(--glass-border)] transition-colors group-hover:bg-[var(--primary-soft)]/40">
        {row.unit}
      </td>
      {visibleYears.map((yr) => (
        <td key={yr} className="py-1 pr-2">
          <EditableCell
            baseValue={row.values[yr] ?? ''}
            pendingValue={pendingForRow[yr]}
            onCommit={(value) => onCellChange(row.rowKey, yr, value)}
          />
        </td>
      ))}
    </tr>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function UserDataEditor() {
  const [dataset, setDataset] = useState<'macro' | 'micro'>('macro');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [yearRange, setYearRange] = useState<YearRange>('all');

  const [rows, setRows] = useState<DataRow[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [yearColumns, setYearColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [pending, setPending] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  // ---------------------------------------------------------------------------
  // pendingByRow — pre-computed index so each EditorRow gets only ITS entries.
  // Only the row whose key is in the Map gets a new object reference → only
  // that row re-renders (React.memo skips all others).
  // ---------------------------------------------------------------------------
  const pendingByRow = useMemo(() => {
    const result = new Map<string, Record<string, string>>();
    for (const [key, value] of pending) {
      const sep = key.lastIndexOf('||');
      const rowKey = key.slice(0, sep);
      const year = key.slice(sep + 2);
      if (!result.has(rowKey)) result.set(rowKey, {});
      result.get(rowKey)![year] = value;
    }
    return result;
  }, [pending]);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async (resetEdits = false) => {
    if (resetEdits) {
      setPending(new Map());
      setSaveResult(null);
    }
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ dataset });
      if (sectorFilter) params.set('sector', sectorFilter);
      const res = await fetch(`/api/user-data?${params.toString()}`);
      const data: APIResponse = await res.json();
      if (data.error && !data.rows.length) {
        setFetchError(data.error);
      } else {
        setRows(data.rows);
        setSectors(data.sectors);
        setYearColumns(data.yearColumns);
        if (data.error) setFetchError(data.error);
      }
    } catch {
      setFetchError('Failed to fetch data. Check the server and try again.');
    } finally {
      setLoading(false);
    }
  }, [dataset, sectorFilter]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Derived year list
  // ---------------------------------------------------------------------------
  const visibleYears = useMemo(
    () =>
      yearRange === 'all'
        ? yearColumns
        : yearRange === 'last6'
          ? yearColumns.slice(-6)
          : yearColumns.filter((y) => parseInt(y) >= parseInt(yearRange)),
    [yearRange, yearColumns],
  );

  // ---------------------------------------------------------------------------
  // Cell change — stable callback (no deps), so EditorRow memo is unaffected
  // ---------------------------------------------------------------------------
  const handleCellChange = useCallback((rowKey: string, year: string, value: string) => {
    setSaveResult(null);
    setPending((prev) => {
      const next = new Map(prev);
      next.set(`${rowKey}||${year}`, value);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  async function handleSave() {
    if (!pending.size) return;
    setSaving(true);
    setSaveResult(null);

    const changes: PendingChange[] = [];
    for (const [key, value] of pending.entries()) {
      const sep = key.lastIndexOf('||');
      const rowKey = key.slice(0, sep);
      const year = key.slice(sep + 2);
      changes.push({ rowKey, year, value });
    }

    let failedAt: string | null = null;
    let succeeded = 0;
    for (const { rowKey, year, value } of changes) {
      try {
        const res = await fetch('/api/user-data', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataset, rowKey, year, newValue: value }),
        });
        const data = await res.json();
        if (!data.success) {
          failedAt = `${rowKey} / ${year}: ${data.error ?? 'Unknown error'}`;
          break;
        }
        succeeded++;
      } catch {
        failedAt = `${rowKey} / ${year}: Network error`;
        break;
      }
    }

    setSaving(false);
    if (failedAt) {
      setSaveResult({ ok: false, message: `Save stopped at: ${failedAt}` });
    } else {
      setPending(new Map());
      setSaveResult({ ok: true, message: `${succeeded} change${succeeded === 1 ? '' : 's'} saved. Dashboard updated.` });
      await fetchData(false);
    }
  }

  function handleDiscard() {
    setPending(new Map());
    setSaveResult(null);
  }

  function handleDownload() {
    const csv = buildCSV(rows, yearColumns, dataset);
    const filename = dataset === 'macro' ? 'thailand_macro.csv' : 'thailand_micro.csv';
    downloadFile(csv, filename);
  }

  const changeCount = pending.size;

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="glass-card overflow-hidden p-0">

        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--glass-border)] bg-white/95 px-3 py-2.5">

          {/* Dataset toggle */}
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Dataset</span>
            <div className="flex overflow-hidden rounded-lg border border-[var(--glass-border)]">
              {(['macro', 'micro'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDataset(d)}
                  className={`px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    dataset === d
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface)] text-ink-muted hover:text-ink'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-[var(--glass-border)]" />

          {/* Sector filter */}
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Sector</span>
            <div className="relative">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="appearance-none rounded-lg border border-[var(--glass-border)] bg-[var(--surface)] py-1.5 pl-2.5 pr-7 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
              >
                <option value="">All sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            </div>
          </div>

          {/* Year range */}
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Years</span>
            <div className="relative">
              <select
                value={yearRange}
                onChange={(e) => setYearRange(e.target.value as YearRange)}
                className="appearance-none rounded-lg border border-[var(--glass-border)] bg-[var(--surface)] py-1.5 pl-2.5 pr-7 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
              >
                {YEAR_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
            </div>
          </div>

          {changeCount > 0 && (
            <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {changeCount} unsaved
            </span>
          )}

          <div className="flex-1" />

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handleDownload}
              disabled={loading}
              title="Download CSV"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-white hover:text-ink disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download CSV</span>
            </button>
            <button
              onClick={handleDiscard}
              disabled={!changeCount || saving}
              title="Discard changes"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-white hover:text-danger disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Discard</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!changeCount || saving}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {changeCount > 0 ? `Save ${changeCount}` : 'Save'}
            </button>
          </div>
        </div>

        {/* Feedback banner */}
        {saveResult && (
          <div
            className={`border-b px-4 py-2.5 text-xs font-medium ${
              saveResult.ok
                ? 'border-[var(--success)]/20 bg-[var(--success)]/8 text-success'
                : 'border-[var(--danger)]/20 bg-[var(--danger)]/8 text-danger'
            }`}
          >
            {saveResult.message}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex flex-col gap-3 p-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-md bg-[var(--glass-border)]/60" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : fetchError && !rows.length ? (
          <div className="flex flex-col gap-2 p-8 text-center">
            <p className="text-sm font-semibold text-ink">Data file not found</p>
            <p className="text-sm text-ink-muted">{fetchError}</p>
            <p className="mt-2 font-mono text-xs text-ink-soft">
              Expected: public/data/user/{dataset === 'macro' ? 'thailand_macro.csv' : 'thailand_micro.csv'}
            </p>
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)', minHeight: '280px' }}>
            <table className="min-w-max w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--surface-strong)]">
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="sticky left-0 z-20 min-w-[200px] bg-[var(--surface-strong)] py-3 pl-4 pr-3 text-left font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted shadow-[1px_0_0_0_var(--glass-border)]">
                    Indicator
                  </th>
                  <th className="sticky left-[200px] z-20 min-w-[88px] bg-[var(--surface-strong)] py-3 pr-4 text-left font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted shadow-[1px_0_0_0_var(--glass-border)]">
                    Unit
                  </th>
                  {visibleYears.map((yr) => (
                    <th key={yr} className="min-w-[72px] py-3 pr-2 text-center font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      {yr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <EditorRow
                    key={row.rowKey}
                    row={row}
                    visibleYears={visibleYears}
                    pendingForRow={pendingByRow.get(row.rowKey) ?? EMPTY_PENDING}
                    onCellChange={handleCellChange}
                  />
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={visibleYears.length + 2} className="py-8 text-center text-sm text-ink-soft">
                      No rows match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-ink-soft">
        Only year-column values are editable. Indicator names, units, and sector labels are metadata and cannot be changed here.
        Changes are saved directly to the source CSV &mdash; always keep a downloaded backup before making bulk edits.
      </p>
    </div>
  );
}
