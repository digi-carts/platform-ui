'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Play, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Clock, Database, Plus, Trash2, Check, X, Pencil } from 'lucide-react';

const SCHEMA_LABELS: Record<string, string> = {
  platform_svc: 'Platform',
  auth_svc: 'Auth',
  store_svc: 'Store',
  catalog_svc: 'Catalog',
  order_svc: 'Orders',
  billing_svc: 'Billing',
  payment_svc: 'Payment',
  notif_svc: 'Notifications',
  shipping_svc: 'Shipping',
  public: 'Public',
};

type Column = { name: string; type: string; nullable: boolean };
type SchemaTree = Record<string, Record<string, Column[]>>;
type PkMap = Record<string, Record<string, string[]>>;

type QueryResult =
  | { type: 'select'; rows: Record<string, unknown>[]; count: number }
  | { type: 'exec'; affected: number }
  | { type: 'error'; error: string }
  | null;

interface ActiveTable { schema: string; table: string; columns: Column[]; pk: string[] }

// ── SQL literal helpers (quote identifiers/values safely) ──────────────────────
function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Convert an edit-field string to a SQL literal based on the column's type.
function literalForColumn(col: Column | undefined, raw: string): string {
  if (raw === '') return col && !col.nullable ? `''` : 'NULL';
  const t = (col?.type || '').toLowerCase();
  if (/(int|numeric|decimal|real|double|serial|money)/.test(t) && !Number.isNaN(Number(raw))) return String(Number(raw));
  if (/bool/.test(t)) return (raw === 'true' || raw === 't' || raw === '1') ? 'true' : 'false';
  const escaped = `'${raw.replace(/'/g, "''")}'`;
  return /json/.test(t) ? `${escaped}::jsonb` : escaped;
}

const qualified = (schema: string, table: string) => `${schema}."${table}"`;
const cell = (v: unknown) => v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

function ResultTable({ rows, editable, active, onEdit, onDelete }: Readonly<{
  rows: Record<string, unknown>[];
  editable: boolean;
  active: ActiveTable | null;
  onEdit: (row: Record<string, unknown>, col: string, raw: string) => void;
  onDelete: (row: Record<string, unknown>) => void;
}>) {
  const [editing, setEditing] = useState<{ rowIdx: number; col: string } | null>(null);
  const [draft, setDraft] = useState('');

  if (rows.length === 0) return <p className="text-sm text-neutral-400 py-4 text-center">No rows returned.</p>;
  const cols = Object.keys(rows[0]);
  const pkSet = new Set(active?.pk ?? []);

  const commit = (rowIdx: number, col: string) => {
    const original = cell(rows[rowIdx][col]);
    if (draft !== original) onEdit(rows[rowIdx], col, draft);
    setEditing(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-neutral-100 border-b sticky top-0">
          <tr>
            {editable && <th className="px-2 py-2 w-8" />}
            {cols.map(c => (
              <th key={c} className="px-3 py-2 text-left font-semibold text-neutral-600 whitespace-nowrap">
                {c}{pkSet.has(c) && <span className="ml-1 text-amber-500" title="primary key">🔑</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50">
              {editable && (
                <td className="px-2 py-1 text-center">
                  <button type="button" onClick={() => onDelete(row)} className="text-neutral-300 hover:text-red-500" aria-label="Delete row">
                    <Trash2 size={12} />
                  </button>
                </td>
              )}
              {cols.map(c => {
                const v = row[c];
                const isEditingCell = editing?.rowIdx === i && editing?.col === c;
                const canEdit = editable && !pkSet.has(c);   // PKs used as row identity — not editable
                if (isEditingCell) {
                  return (
                    <td key={c} className="px-2 py-1">
                      <input autoFocus value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onBlur={() => commit(i, c)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commit(i, c);
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        className="w-full min-w-[120px] border rounded px-1.5 py-0.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black" />
                    </td>
                  );
                }
                const display = v === null
                  ? <span className="text-neutral-300 italic">null</span>
                  : typeof v === 'object'
                    ? <span className="font-mono text-neutral-500">{JSON.stringify(v)}</span>
                    : String(v);
                return (
                  <td key={c}
                    onClick={canEdit ? () => { setEditing({ rowIdx: i, col: c }); setDraft(cell(v)); } : undefined}
                    className={`px-3 py-1.5 font-mono text-neutral-700 whitespace-nowrap max-w-[280px] truncate ${canEdit ? 'cursor-text hover:bg-amber-50' : ''}`}
                    title={canEdit ? 'Click to edit' : (pkSet.has(c) ? 'Primary key (read-only)' : undefined)}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && <p className="px-3 py-2 text-[11px] text-neutral-400">Click a non-key cell to edit · Enter saves · 🔑 columns identify the row and can&apos;t be edited.</p>}
      {!editable && active === null && <p className="px-3 py-2 text-[11px] text-neutral-400">Select a table from the sidebar (then Run) to edit rows inline.</p>}
    </div>
  );
}

function AddRowForm({ active, onInsert, onCancel }: Readonly<{
  active: ActiveTable;
  onInsert: (values: Record<string, string>) => void;
  onCancel: () => void;
}>) {
  const [vals, setVals] = useState<Record<string, string>>({});
  return (
    <div className="border rounded-lg p-3 bg-neutral-50 space-y-2">
      <p className="text-xs font-semibold text-neutral-600">Insert row into {qualified(active.schema, active.table)}</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {active.columns.map(col => (
          <div key={col.name} className="space-y-0.5">
            <label className="text-[10px] text-neutral-500 font-mono">{col.name}<span className="text-neutral-400"> {col.type}{col.nullable ? '' : ' *'}</span></label>
            <input value={vals[col.name] ?? ''} placeholder={col.nullable ? 'NULL' : ''}
              onChange={e => setVals(v => ({ ...v, [col.name]: e.target.value }))}
              className="w-full border rounded px-1.5 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 px-3 gap-1" onClick={() => onInsert(vals)}><Check size={12} /> Insert</Button>
        <Button size="sm" variant="outline" className="h-7 px-3 gap-1" onClick={onCancel}><X size={12} /> Cancel</Button>
      </div>
      <p className="text-[11px] text-neutral-400">Leave a field blank for NULL (or empty string on NOT-NULL text columns). Values are typed by column.</p>
    </div>
  );
}

function SchemaNode({ schema, tables, onSelectTable }: Readonly<{
  schema: string;
  tables: Record<string, Column[]>;
  onSelectTable: (schema: string, table: string) => void;
}>) {
  const [open, setOpen] = useState(true);
  const [openTable, setOpenTable] = useState<string | null>(null);
  const label = SCHEMA_LABELS[schema] || schema;

  return (
    <div>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 w-full text-xs font-semibold text-neutral-300 hover:text-white py-1.5 px-2 rounded hover:bg-neutral-800 transition-colors">
        <Database size={11} className="shrink-0 text-blue-400" />
        <span className="flex-1 text-left">{label}</span>
        <span className="text-neutral-600 font-normal">{schema}</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      {open && (
        <div className="ml-2 border-l border-neutral-700 pl-2 mt-0.5 space-y-0.5">
          {Object.entries(tables).map(([table, cols]) => (
            <div key={table}>
              <button type="button"
                onClick={() => { onSelectTable(schema, table); setOpenTable(openTable === table ? null : table); }}
                className="flex items-center gap-1.5 w-full text-xs text-neutral-400 hover:text-white py-1 px-2 rounded hover:bg-neutral-800 transition-colors group">
                <span className="flex-1 text-left truncate font-mono">{table}</span>
                <span className="text-neutral-600 text-[10px] group-hover:text-neutral-400">{cols.length}</span>
                {openTable === table ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
              </button>
              {openTable === table && (
                <div className="ml-2 border-l border-neutral-800 pl-2 py-0.5 space-y-0.5">
                  {cols.map(col => (
                    <div key={col.name} className="flex items-baseline gap-2 px-1 py-0.5">
                      <span className="text-[11px] font-mono text-neutral-300 truncate">{col.name}</span>
                      <span className="text-[10px] text-neutral-600 shrink-0">{col.type}</span>
                      {col.nullable && <span className="text-[9px] text-neutral-700 shrink-0">null</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SqlPage() {
  const [query, setQuery] = useState('SELECT * FROM platform_svc."Subscription" ORDER BY price ASC LIMIT 50');
  const [result, setResult] = useState<QueryResult>(null);
  const [running, setRunning] = useState(false);
  const [schema, setSchema] = useState<SchemaTree>({});
  const [pks, setPks] = useState<PkMap>({});
  const [active, setActive] = useState<ActiveTable | null>(null);
  const [adding, setAdding] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get('/platform/cleanup/schema')
      .then(r => {
        const d = r.data as { tree?: SchemaTree; pks?: PkMap };
        setSchema(d.tree ?? {});
        setPks(d.pks ?? {});
      })
      .catch(() => {});
  }, []);

  const runQuery = useCallback(async (q?: string) => {
    const sql = q ?? query;
    if (!sql.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await api.post('/platform/cleanup/sql', { query: sql });
      setResult(r.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Query failed';
      setResult({ type: 'error', error: msg });
    } finally {
      setRunning(false);
    }
  }, [query]);

  // Run a mutation (UPDATE/INSERT/DELETE) then refresh the current query.
  const runMutation = useCallback(async (sql: string) => {
    setRunning(true);
    try {
      await api.post('/platform/cleanup/sql', { query: sql });
      await runQuery();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Mutation failed';
      setResult({ type: 'error', error: msg });
      setRunning(false);
    }
  }, [runQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
  };

  const selectTable = (sch: string, table: string) => {
    const columns = schema[sch]?.[table] ?? [];
    const pk = pks[sch]?.[table] ?? [];
    const q = `SELECT * FROM ${qualified(sch, table)} LIMIT 100`;
    setActive({ schema: sch, table, columns, pk });
    setAdding(false);
    setQuery(q);
    runQuery(q);
  };

  // If the user hand-edits the query, unbind the active table (editing disabled until a table is clicked again).
  const onQueryChange = (v: string) => { setQuery(v); if (active) setActive(null); };

  // Editing is only enabled for a single-table result with a known PK whose columns are all present.
  const editable = !!(active && active.pk.length > 0 && result?.type === 'select' && result.rows.length > 0 &&
    active.pk.every(k => Object.keys(result.rows[0]).includes(k)));

  const handleEdit = (row: Record<string, unknown>, col: string, raw: string) => {
    if (!active) return;
    const meta = active.columns.find(m => m.name === col);
    const where = active.pk.map(k => `"${k}" = ${sqlLiteral(row[k])}`).join(' AND ');
    runMutation(`UPDATE ${qualified(active.schema, active.table)} SET "${col}" = ${literalForColumn(meta, raw)} WHERE ${where}`);
  };

  const handleDelete = (row: Record<string, unknown>) => {
    if (!active) return;
    const where = active.pk.map(k => `"${k}" = ${sqlLiteral(row[k])}`).join(' AND ');
    if (!confirm(`Delete this row from ${active.table}?\nWHERE ${where}`)) return;
    runMutation(`DELETE FROM ${qualified(active.schema, active.table)} WHERE ${where}`);
  };

  const handleInsert = (values: Record<string, string>) => {
    if (!active) return;
    const entries = active.columns.filter(c => (values[c.name] ?? '') !== '' || !c.nullable);
    if (entries.length === 0) { setResult({ type: 'error', error: 'Provide at least one value' }); return; }
    const colList = entries.map(c => `"${c.name}"`).join(', ');
    const valList = entries.map(c => literalForColumn(c, values[c.name] ?? '')).join(', ');
    setAdding(false);
    runMutation(`INSERT INTO ${qualified(active.schema, active.table)} (${colList}) VALUES (${valList})`);
  };

  const schemaEntries = Object.entries(schema).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 overflow-hidden -m-6">
      {/* Schema browser */}
      <aside className="w-56 shrink-0 bg-neutral-900 text-white flex flex-col overflow-hidden border-r border-neutral-800">
        <div className="px-3 py-2.5 border-b border-neutral-800">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Schema Browser</p>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-1 space-y-1">
          {schemaEntries.length === 0 ? (
            <p className="text-xs text-neutral-600 px-2 py-3">Loading…</p>
          ) : (
            schemaEntries.map(([sch, tables]) => (
              <SchemaNode key={sch} schema={sch} tables={tables} onSelectTable={selectTable} />
            ))
          )}
        </div>
      </aside>

      {/* SQL console */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-neutral-50">
          <h1 className="text-sm font-semibold text-neutral-700">SQL Console</h1>
          <span className="text-neutral-300">|</span>
          <span className="text-xs text-neutral-400">Click a table to load &amp; edit · Ctrl+Enter to run</span>
          <div className="ml-auto flex items-center gap-2">
            {editable && !adding && (
              <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-7 px-3 text-xs gap-1.5">
                <Plus size={11} /> Add row
              </Button>
            )}
            <Button size="sm" onClick={() => runQuery()} disabled={running} className="h-7 px-3 text-xs gap-1.5">
              <Play size={11} />
              {running ? 'Running…' : 'Run'}
            </Button>
          </div>
        </div>

        <div className="px-4 pt-3 pb-2">
          <textarea ref={textareaRef} value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6} spellCheck={false}
            className="w-full font-mono text-sm border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-black bg-neutral-950 text-green-400 placeholder-neutral-600"
            placeholder='SELECT * FROM platform_svc."Subscription"' />
          {active && (
            <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <Pencil size={10} /> Editing bound to <span className="font-mono">{qualified(active.schema, active.table)}</span>
              {active.pk.length === 0 && <span className="text-amber-600"> — no primary key, editing disabled</span>}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto px-4 pb-4 space-y-3">
          {adding && active && <AddRowForm active={active} onInsert={handleInsert} onCancel={() => setAdding(false)} />}
          {result && (
            <div className="border rounded-lg overflow-hidden">
              {result.type === 'error' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-sm">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap font-mono text-xs">{result.error}</pre>
                </div>
              )}
              {result.type === 'exec' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 text-sm">
                  <CheckCircle2 size={14} />
                  <span><strong>{result.affected}</strong> row(s) affected</span>
                </div>
              )}
              {result.type === 'select' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border-b text-xs text-neutral-500">
                    <Clock size={11} />
                    <span>{result.count} row{result.count !== 1 ? 's' : ''} returned</span>
                    {editable && <span className="ml-auto text-green-600 font-medium">● editable</span>}
                  </div>
                  <ResultTable rows={result.rows} editable={editable} active={active} onEdit={handleEdit} onDelete={handleDelete} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
