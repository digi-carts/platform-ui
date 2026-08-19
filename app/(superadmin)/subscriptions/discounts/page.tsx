'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Plus, X, Trash2 } from 'lucide-react';

type OfferType = 'FLAT' | 'PERCENT' | 'ONE_TIME' | 'REFERRAL' | 'CUSTOM';
type OfferScope = 'SUBSCRIPTION' | 'PRODUCT';

interface Offer {
  id: string; code: string; type: OfferType; scope: OfferScope;
  value: number; maxUses: number | null; usedCount: number;
  expiresAt: string | null; refCode: string | null;
  description: string | null; minOrderAmt: number; active: boolean;
  storeId: string | null; createdAt: string;
}

const OFFER_TYPE_LABELS: Record<OfferType, string> = { FLAT: 'Flat', PERCENT: 'Percent', ONE_TIME: 'One-time', REFERRAL: 'Referral', CUSTOM: 'Custom' };
const OFFER_TYPE_COLORS: Record<OfferType, string> = {
  FLAT: 'bg-blue-100 text-blue-700', PERCENT: 'bg-purple-100 text-purple-700',
  ONE_TIME: 'bg-orange-100 text-orange-700', REFERRAL: 'bg-green-100 text-green-700', CUSTOM: 'bg-neutral-100 text-neutral-700',
};

const emptyOffer = { code: '', type: 'FLAT' as OfferType, scope: 'SUBSCRIPTION' as OfferScope, value: 0, maxUses: '', expiresAt: '', refCode: '', description: '', minOrderAmt: 0, storeId: '' };

export default function DiscountsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerFilter, setOfferFilter] = useState<OfferScope | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyOffer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try { const r = await api.get('/offers'); setOffers(r.data.offers || []); }
    catch { /* ignore */ }
  };
  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/offers', {
        ...form,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        refCode: form.refCode || null,
        description: form.description || null,
        storeId: form.storeId || null,
      });
      setForm(emptyOffer); setShowForm(false);
      await load(); flash('Discount created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Code already exists');
    } finally { setSaving(false); }
  };

  const toggle = async (o: Offer) => {
    await api.patch(`/offers/${o.id}`, { active: !o.active }).catch(() => {});
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this discount?')) return;
    await api.delete(`/offers/${id}`).catch(() => {});
    load();
  };

  const filtered = offerFilter === 'ALL' ? offers : offers.filter(o => o.scope === offerFilter);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={20} className="text-neutral-400" />
          <h1 className="text-2xl font-bold">Discounts</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)} variant={showForm ? 'outline' : 'default'}>
          {showForm ? <><X size={14} className="mr-1" />Cancel</> : <><Plus size={14} className="mr-1" />New Discount</>}
        </Button>
      </div>

      {showForm && (
        <Card className="max-w-2xl">
          <CardHeader><CardTitle className="text-base">New Discount</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Code <span className="text-neutral-400 text-xs">(auto-uppercased)</span></Label>
                  <Input placeholder="SAVE20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as OfferType })}
                    className="h-9 w-full rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="FLAT">Flat amount off</option>
                    <option value="PERCENT">Percentage off</option>
                    <option value="ONE_TIME">One-time use</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Scope</Label>
                  <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value as OfferScope })}
                    className="h-9 w-full rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="SUBSCRIPTION">Subscription (admin discount)</option>
                    <option value="PRODUCT">Product (customer checkout)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{form.type === 'PERCENT' ? 'Discount %' : 'Discount Amount'}</Label>
                  <Input type="number" min={0} step="0.01" value={form.value} onChange={e => setForm({ ...form, value: +e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Max Uses <span className="text-neutral-400 text-xs">(blank = unlimited)</span></Label>
                  <Input type="number" min={1} placeholder="∞" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Expires At <span className="text-neutral-400 text-xs">(optional)</span></Label>
                  <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
                {form.scope === 'PRODUCT' && (
                  <div className="space-y-1">
                    <Label>Min Order Amount <span className="text-neutral-400 text-xs">(0 = no min)</span></Label>
                    <Input type="number" min={0} step="0.01" value={form.minOrderAmt} onChange={e => setForm({ ...form, minOrderAmt: +e.target.value })} />
                  </div>
                )}
                {form.type === 'REFERRAL' && (
                  <div className="space-y-1">
                    <Label>Referral Code / Tag</Label>
                    <Input placeholder="e.g. REF-JOHN" value={form.refCode} onChange={e => setForm({ ...form, refCode: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label>Description <span className="text-neutral-400 text-xs">(shown to user)</span></Label>
                <Input placeholder="Get 20% off your first order" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Store ID <span className="text-neutral-400 text-xs">(blank = global, all stores)</span></Label>
                <Input placeholder="Leave blank for all stores" value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Discount'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {msg && <p className="text-sm text-green-600">{msg}</p>}

      <div className="flex gap-2">
        {(['ALL', 'SUBSCRIPTION', 'PRODUCT'] as const).map(s => (
          <button key={s} type="button" onClick={() => setOfferFilter(s)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${offerFilter === s ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
            {s === 'ALL' ? `All (${offers.length})` : s === 'SUBSCRIPTION' ? `Subscription (${offers.filter(o => o.scope === 'SUBSCRIPTION').length})` : `Product (${offers.filter(o => o.scope === 'PRODUCT').length})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white max-w-4xl">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Code</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Type</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Scope</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Value</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Uses</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Expires</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">No discounts yet. Create one above.</td></tr>
            )}
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-neutral-50/50">
                <td className="px-4 py-2 font-mono font-semibold text-sm">{o.code}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${OFFER_TYPE_COLORS[o.type]}`}>{OFFER_TYPE_LABELS[o.type]}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.scope === 'SUBSCRIPTION' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>
                    {o.scope === 'SUBSCRIPTION' ? 'Subscription' : 'Product'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  {o.type === 'PERCENT' ? `${o.value}%` : `−${o.value}`}
                  {o.description && <p className="text-xs text-neutral-400 truncate max-w-[140px]">{o.description}</p>}
                </td>
                <td className="px-4 py-2 text-sm text-neutral-500">
                  {o.usedCount}{o.maxUses !== null ? ` / ${o.maxUses}` : ''}
                </td>
                <td className="px-4 py-2 text-xs text-neutral-500">
                  {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-2">
                  <button type="button" onClick={() => toggle(o)}
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${o.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                    {o.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => remove(o.id)}><Trash2 size={12} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
