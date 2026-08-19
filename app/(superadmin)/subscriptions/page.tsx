'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'UNLIMITED' | 'CUSTOM';
type SubLevel = string;
interface BusinessLevel { key: string; label: string; description: string; color: string; order: number }
interface Sub { id: string; name: string; price: number; currency: string; billingPeriod: BillingPeriod; customDays?: number | null; details?: string | null; level?: SubLevel | null; maxUses?: number | null; totalUses?: number | null }

const emptyForm = { name: '', price: 0, currency: 'INR', billingPeriod: 'MONTHLY' as BillingPeriod, customDays: '' as number | '', details: '', level: '' as SubLevel | '', maxUses: -1 as number };

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];

const DEFAULT_LEVEL_COLOR = 'bg-neutral-100 text-neutral-700';
const levelColor = (levels: BusinessLevel[], key: string) => levels.find(l => l.key === key)?.color ?? DEFAULT_LEVEL_COLOR;
const levelLabel = (levels: BusinessLevel[], key: string) => levels.find(l => l.key === key)?.label ?? key;

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  UNLIMITED: 'Unlimited',
  CUSTOM: 'Custom',
};

const PERIOD_BADGE: Record<BillingPeriod, 'default' | 'secondary' | 'outline'> = {
  MONTHLY: 'default',
  QUARTERLY: 'secondary',
  YEARLY: 'secondary',
  UNLIMITED: 'outline',
  CUSTOM: 'secondary',
};

function CurrencySelect({ value, onChange, className }: Readonly<{ value: string; onChange: (v: string) => void; className?: string }>) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black ${className ?? 'h-9 w-full'}`}>
      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function BillingSelect({ value, onChange, customDays, onCustomDaysChange }: Readonly<{ value: BillingPeriod; onChange: (v: BillingPeriod) => void; customDays?: number | ''; onCustomDaysChange?: (v: number | '') => void }>) {
  return (
    <div className="flex items-center gap-2">
      <select value={value} onChange={e => onChange(e.target.value as BillingPeriod)}
        className="h-8 rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
        <option value="MONTHLY">Monthly</option>
        <option value="QUARTERLY">Quarterly</option>
        <option value="YEARLY">Yearly</option>
        <option value="UNLIMITED">Unlimited</option>
        <option value="CUSTOM">Custom</option>
      </select>
      {value === 'CUSTOM' && (
        <div className="flex items-center gap-1">
          <input
            type="number" min={1} placeholder="days"
            value={customDays ?? ''}
            onChange={e => onCustomDaysChange?.(e.target.value ? Number(e.target.value) : '')}
            className="h-8 w-16 rounded-md border border-neutral-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
          <span className="text-xs text-neutral-400">days</span>
        </div>
      )}
    </div>
  );
}

function LevelSelect({ value, onChange, className, levels }: Readonly<{ value: SubLevel | ''; onChange: (v: SubLevel | '') => void; className?: string; levels: BusinessLevel[] }>) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as SubLevel | '')}
      className={`rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black ${className ?? 'h-9 w-full'}`}>
      <option value="">No level</option>
      {levels.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
    </select>
  );
}

function LevelBadge({ level, levels }: Readonly<{ level: SubLevel | null | undefined; levels: BusinessLevel[] }>) {
  if (!level) return <span className="text-xs text-neutral-300">—</span>;
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColor(levels, level)}`}>{levelLabel(levels, level)}</span>;
}

function DetailsView({ details }: Readonly<{ details?: string | null }>) {
  if (details) return <pre className="text-xs text-neutral-600 whitespace-pre-wrap font-mono bg-white border rounded-lg p-3 mt-1">{details}</pre>;
  return <p className="text-xs text-neutral-400 italic pt-1">No details. Click edit to add markdown content.</p>;
}

// Preset badge colors offered when creating/editing a business level
const LEVEL_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: 'Neutral', value: 'bg-neutral-100 text-neutral-700' },
  { label: 'Amber',   value: 'bg-amber-50 text-amber-700' },
  { label: 'Blue',    value: 'bg-blue-100 text-blue-700' },
  { label: 'Purple',  value: 'bg-purple-100 text-purple-700' },
  { label: 'Green',   value: 'bg-green-100 text-green-700' },
  { label: 'Rose',    value: 'bg-rose-100 text-rose-700' },
];

const emptyLevelForm = { key: '', label: '', description: '', color: LEVEL_COLOR_PRESETS[0].value, order: 0 };

function BusinessLevelsManager({ levels, reload }: Readonly<{ levels: BusinessLevel[]; reload: () => Promise<void> }>) {
  const [addForm, setAddForm] = useState(emptyLevelForm);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyLevelForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const showErr = (e: unknown) => {
    const r = (e as { response?: { data?: { error?: string; plans?: string[] } } }).response?.data;
    setErr(r?.plans?.length ? `${r.error}: ${r.plans.join(', ')}` : (r?.error ?? 'Failed'));
  };

  const add = async () => {
    if (!addForm.label.trim()) { setErr('Label is required'); return; }
    setBusy(true); setErr('');
    try {
      await api.post('/platform/business-levels', { ...addForm, key: addForm.key || addForm.label, order: Number(addForm.order) || levels.length });
      setAddForm(emptyLevelForm); await reload();
    } catch (e) { showErr(e); } finally { setBusy(false); }
  };

  const startEdit = (l: BusinessLevel) => { setEditingKey(l.key); setEditForm({ key: l.key, label: l.label, description: l.description, color: l.color, order: l.order }); setErr(''); };

  const saveEdit = async (originalKey: string) => {
    setBusy(true); setErr('');
    try {
      await api.patch(`/platform/business-levels/${originalKey}`, { ...editForm, order: Number(editForm.order) || 0 });
      setEditingKey(null); await reload();
    } catch (e) { showErr(e); } finally { setBusy(false); }
  };

  const remove = async (l: BusinessLevel) => {
    if (!confirm(`Delete business level "${l.label}"?`)) return;
    setErr('');
    try { await api.delete(`/platform/business-levels/${l.key}`); await reload(); }
    catch (e) { showErr(e); }
  };

  return (
    <Card className="mb-6">
      <CardHeader><CardTitle className="text-base">Business Levels</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {err && <p className="text-sm text-red-500">{err}</p>}

        {/* Existing levels */}
        <div className="space-y-2">
          {levels.length === 0 && <p className="text-sm text-neutral-400">No business levels yet.</p>}
          {levels.map(l => (
            editingKey === l.key ? (
              <div key={l.key} className="grid grid-cols-2 lg:grid-cols-5 gap-2 items-end border rounded-lg p-3 bg-neutral-50">
                <div className="space-y-1"><Label className="text-xs">Label</Label>
                  <Input className="h-8 text-sm" value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Key</Label>
                  <Input className="h-8 text-sm font-mono" value={editForm.key} onChange={e => setEditForm({ ...editForm, key: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Color</Label>
                  <select value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                    className="h-8 w-full rounded-md border border-neutral-200 px-2 text-sm bg-white">
                    {LEVEL_COLOR_PRESETS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select></div>
                <div className="space-y-1"><Label className="text-xs">Order</Label>
                  <Input type="number" className="h-8 text-sm" value={editForm.order} onChange={e => setEditForm({ ...editForm, order: Number(e.target.value) })} /></div>
                <div className="flex gap-1">
                  <Button size="sm" className="h-8 px-2" disabled={busy} onClick={() => saveEdit(l.key)}><Check size={13} /></Button>
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setEditingKey(null)}><X size={13} /></Button>
                </div>
                <div className="col-span-2 lg:col-span-5 space-y-1"><Label className="text-xs">Description</Label>
                  <Input className="h-8 text-sm" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
              </div>
            ) : (
              <div key={l.key} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.color}`}>{l.label}</span>
                <span className="text-xs font-mono text-neutral-400">{l.key}</span>
                <span className="text-sm text-neutral-600 flex-1 truncate">{l.description}</span>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => startEdit(l)}><Pencil size={12} /></Button>
                <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => remove(l)}><Trash2 size={12} /></Button>
              </div>
            )
          ))}
        </div>

        {/* Add new level */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 items-end border-t pt-3">
          <div className="space-y-1"><Label className="text-xs">Label</Label>
            <Input className="h-8 text-sm" placeholder="Trial" value={addForm.label} onChange={e => setAddForm({ ...addForm, label: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Key <span className="text-neutral-400 font-normal">(auto)</span></Label>
            <Input className="h-8 text-sm font-mono" placeholder="TRIAL" value={addForm.key} onChange={e => setAddForm({ ...addForm, key: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Color</Label>
            <select value={addForm.color} onChange={e => setAddForm({ ...addForm, color: e.target.value })}
              className="h-8 w-full rounded-md border border-neutral-200 px-2 text-sm bg-white">
              {LEVEL_COLOR_PRESETS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select></div>
          <div className="space-y-1"><Label className="text-xs">Order</Label>
            <Input type="number" className="h-8 text-sm" value={addForm.order} onChange={e => setAddForm({ ...addForm, order: Number(e.target.value) })} /></div>
          <Button size="sm" className="h-8" disabled={busy} onClick={add}>Add Level</Button>
          <div className="col-span-2 lg:col-span-5 space-y-1"><Label className="text-xs">Description</Label>
            <Input className="h-8 text-sm" placeholder="Free trial to explore the platform" value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} /></div>
        </div>
      </CardContent>
    </Card>
  );
}

type PlanRowProps = Readonly<{
  s: Sub;
  isEditing: boolean;
  isSaving: boolean;
  isExpanded: boolean;
  editForm: typeof emptyForm;
  setEditForm: (v: typeof emptyForm) => void;
  levels: BusinessLevel[];
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}>;

function PlanRow({ s, isEditing, isSaving, isExpanded, editForm, setEditForm, levels, onToggleExpand, onEdit, onSave, onCancel, onDelete }: PlanRowProps) {
  return (
    <>
      <tr className={isEditing ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'}>
        <td className="px-4 py-2">
          {isEditing
            ? <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-sm" />
            : <span className="font-medium">{s.name}</span>}
        </td>
        <td className="px-4 py-2">
          {isEditing
            ? <LevelSelect value={editForm.level} onChange={v => setEditForm({ ...editForm, level: v })} className="h-8 w-28" levels={levels} />
            : <LevelBadge level={s.level} levels={levels} />}
        </td>
        <td className="px-4 py-2">
          {isEditing
            ? <Input type="number" min={0} step="0.01" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: +e.target.value })} className="h-8 w-24 text-sm" />
            : <span>{s.price === 0 ? 'Free' : s.price}</span>}
        </td>
        <td className="px-4 py-2">
          {isEditing
            ? <CurrencySelect value={editForm.currency} onChange={v => setEditForm({ ...editForm, currency: v })} className="h-8 w-24" />
            : <span className="text-xs text-neutral-500">{s.currency}</span>}
        </td>
        <td className="px-4 py-2">
          {isEditing
            ? <BillingSelect value={editForm.billingPeriod} onChange={v => setEditForm({ ...editForm, billingPeriod: v, customDays: v !== 'CUSTOM' ? '' : editForm.customDays })} customDays={editForm.customDays} onCustomDaysChange={v => setEditForm({ ...editForm, customDays: v })} />
            : <Badge variant={PERIOD_BADGE[s.billingPeriod]}>{s.billingPeriod === 'CUSTOM' && s.customDays ? `${s.customDays}d` : PERIOD_LABELS[s.billingPeriod]}</Badge>}
        </td>
        <td className="px-4 py-2 text-center">
          {isEditing
            ? <Input type="number" min={-1} value={editForm.maxUses}
                onChange={e => setEditForm({ ...editForm, maxUses: Number(e.target.value) })}
                className="h-8 w-20 text-sm text-center" />
            : <span className="text-xs font-mono">
                {(s.maxUses ?? -1) === -1
                  ? <span className="text-neutral-400">∞</span>
                  : <span className="font-semibold text-amber-700">{s.maxUses}×</span>}
                {(s.totalUses ?? 0) > 0 && <span className="text-neutral-400 ml-1">({s.totalUses} used)</span>}
              </span>}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1 justify-end">
            {isEditing ? (
              <>
                <Button size="sm" className="h-7 px-2" disabled={isSaving} onClick={onSave}><Check size={12} /></Button>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={onCancel}><X size={12} /></Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-neutral-400" onClick={onToggleExpand}>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={onEdit}><Pencil size={12} /></Button>
                <Button size="sm" variant="destructive" className="h-7 px-2" onClick={onDelete}><Trash2 size={12} /></Button>
              </>
            )}
          </div>
        </td>
      </tr>
      {(isExpanded || isEditing) && (
        <tr className="bg-neutral-50">
          <td colSpan={7} className="px-4 pb-3">
            {isEditing ? (
              <div className="space-y-1 pt-1">
                <p className="text-xs text-neutral-400">Use limit: <strong>-1</strong> = unlimited, or enter a positive number (e.g. <strong>2</strong> = merchant can subscribe max 2 times).</p>
                <Label className="text-xs text-neutral-500">Details (markdown)</Label>
                <textarea value={editForm.details} onChange={e => setEditForm({ ...editForm, details: e.target.value })}
                  rows={6} className="w-full font-mono text-xs border rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-black" />
              </div>
            ) : (
              <DetailsView details={s.details} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [levels, setLevels] = useState<BusinessLevel[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try { const r = await api.get('/platform/subscriptions'); setSubs(r.data.subscriptions || []); }
    catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? (err as Error).message ?? 'Unknown error';
      console.error('[subscriptions] Failed to load plans:', (err as { response?: { status?: number } }).response?.status, errMsg);
      setError('Failed to load plans');
    }
  };
  const loadLevels = async () => {
    try { const r = await api.get('/platform/business-levels'); setLevels(r.data.levels || []); }
    catch (err: unknown) {
      console.error('[subscriptions] Failed to load business levels:', (err as { response?: { status?: number } }).response?.status);
    }
  };
  useEffect(() => { load(); loadLevels(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true); setError('');
    try {
      await api.post('/platform/subscriptions', { ...form, customDays: form.customDays !== '' ? form.customDays : null, level: form.level || null });
      setForm(emptyForm); await load(); flash('Plan created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const del = async (sub: Sub) => {
    if (!confirm(`Delete plan "${sub.name}"?`)) return;
    try { await api.delete(`/platform/subscriptions/${sub.id}`); await load(); flash('Plan deleted'); }
    catch { setError('Failed to delete plan'); }
  };

  const startEdit = (sub: Sub) => {
    setEditingId(sub.id);
    setEditForm({ name: sub.name, price: sub.price, currency: sub.currency, billingPeriod: sub.billingPeriod, customDays: sub.customDays ?? '', details: sub.details ?? '', level: sub.level ?? '', maxUses: sub.maxUses ?? -1 });
  };

  const saveEdit = async (id: string) => {
    setSavingId(id); setError('');
    try {
      await api.patch(`/platform/subscriptions/${id}`, { ...editForm, customDays: editForm.customDays !== '' ? editForm.customDays : null, level: editForm.level || null });
      setEditingId(null); await load(); flash('Plan updated');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
    } finally { setSavingId(null); }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
      </div>

      <BusinessLevelsManager levels={levels} reload={loadLevels} />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">New Plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1 col-span-2 lg:col-span-1">
                <Label>Plan Name</Label>
                <Input placeholder="Pro" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Price</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <CurrencySelect value={form.currency} onChange={v => setForm({ ...form, currency: v })} />
              </div>
              <div className="space-y-1">
                <Label>Billing Period</Label>
                <BillingSelect value={form.billingPeriod} onChange={v => setForm({ ...form, billingPeriod: v, customDays: v !== 'CUSTOM' ? '' : form.customDays })} customDays={form.customDays} onCustomDaysChange={v => setForm({ ...form, customDays: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Business Level</Label>
                <LevelSelect value={form.level} onChange={v => setForm({ ...form, level: v })} levels={levels} />
              </div>
              <div className="space-y-1">
                <Label>Use Limit <span className="text-neutral-400 text-xs font-normal">(-1 = unlimited)</span></Label>
                <Input type="number" min={-1} value={form.maxUses}
                  onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })} />
                <p className="text-xs text-neutral-400">-1 = unlimited · 2 = max 2 times per merchant</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Details <span className="text-neutral-400 text-xs font-normal">— markdown supported</span></Label>
              <textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })}
                placeholder={`## What's included\n- Up to 100 products\n- Email notifications`}
                rows={5} className="w-full font-mono text-xs border rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-black" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Plan'}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Level</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Price</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Currency</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Period</th>
              <th className="text-center px-4 py-3 font-medium text-neutral-500">Uses</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No plans yet.</td></tr>}
            {subs.map(s => (
              <PlanRow key={s.id} s={s}
                isEditing={editingId === s.id}
                isSaving={savingId === s.id}
                isExpanded={expandedId === s.id}
                editForm={editForm}
                setEditForm={setEditForm}
                levels={levels}
                onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                onEdit={() => startEdit(s)}
                onSave={() => saveEdit(s.id)}
                onCancel={() => setEditingId(null)}
                onDelete={() => del(s)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
