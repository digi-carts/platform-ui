'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers } from 'lucide-react';

type SubLevel = string;
interface BusinessLevel { key: string; label: string; description: string; color: string; order: number }

interface Sub {
  id: string;
  name: string;
  level?: SubLevel | null;
  maxProducts: number;
  features: Record<string, boolean>;
}

const FEATURE_KEYS = [
  { key: 'customDomain',  label: 'Custom Domain' },
  { key: 'reports',       label: 'Reports & Analytics' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'support',       label: 'Support' },
] as const;

type FeatureKey = typeof FEATURE_KEYS[number]['key'];

interface LevelState {
  maxProducts: number;
  features: Record<FeatureKey, boolean>;
  planIds: string[];
  saving: boolean;
  saved: boolean;
}

const defaultLevelState = (): LevelState => ({
  maxProducts: 50,
  features: { customDomain: false, reports: false, notifications: false, support: false },
  planIds: [],
  saving: false,
  saved: false,
});

export default function FeatureLimitsPage() {
  const [levels, setLevels] = useState<BusinessLevel[]>([]);
  const [levelRows, setLevelRows] = useState<Record<string, LevelState>>({});
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [lvlRes, subRes] = await Promise.all([
        api.get('/platform/business-levels'),
        api.get('/platform/subscriptions'),
      ]);
      const lvls: BusinessLevel[] = lvlRes.data.levels || [];
      const data: Sub[] = subRes.data.subscriptions || [];
      setLevels(lvls);

      const next: Record<string, LevelState> = {};
      for (const lvl of lvls) {
        const plans = data.filter(s => s.level === lvl.key);
        if (plans.length === 0) { next[lvl.key] = defaultLevelState(); continue; }
        const first = plans[0];
        const f = (first.features ?? {}) as Record<string, boolean>;
        next[lvl.key] = {
          maxProducts: first.maxProducts ?? 50,
          features: {
            customDomain:  f.customDomain  ?? false,
            reports:       f.reports       ?? false,
            notifications: f.notifications ?? false,
            support:       f.support       ?? false,
          },
          planIds: plans.map(p => p.id),
          saving: false,
          saved: false,
        };
      }
      setLevelRows(next);
    } catch {
      setError('Failed to load plans');
    }
  };

  useEffect(() => { load(); }, []);

  const setRow = (lvl: string, patch: Partial<LevelState>) =>
    setLevelRows(prev => ({ ...prev, [lvl]: { ...prev[lvl], ...patch } }));

  const setFeature = (lvl: string, key: FeatureKey, value: boolean) =>
    setLevelRows(prev => ({
      ...prev,
      [lvl]: { ...prev[lvl], features: { ...prev[lvl].features, [key]: value } },
    }));

  const save = async (lvl: string) => {
    const row = levelRows[lvl];
    if (!row || row.planIds.length === 0) return;
    setRow(lvl, { saving: true });
    try {
      await Promise.all(
        row.planIds.map(id =>
          api.patch(`/platform/subscriptions/${id}`, {
            maxProducts: row.maxProducts,
            features: row.features,
          })
        )
      );
      setRow(lvl, { saving: false, saved: true });
      setTimeout(() => setRow(lvl, { saved: false }), 2000);
    } catch {
      setRow(lvl, { saving: false });
      setError('Failed to save');
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <Layers size={20} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Feature Limits</h1>
      </div>
      <p className="text-sm text-neutral-500">
        Configure product count limits and feature access per business level. Changes apply to all plans at that level.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white max-w-5xl">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Level</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Max Products</th>
              {FEATURE_KEYS.map(f => (
                <th key={f.key} className="text-left px-4 py-3 font-medium text-neutral-500">{f.label}</th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {levels.length === 0 && (
              <tr><td colSpan={FEATURE_KEYS.length + 3} className="px-4 py-8 text-center text-neutral-400">No business levels yet.</td></tr>
            )}
            {levels.map(l => {
              const row = levelRows[l.key] ?? defaultLevelState();
              const hasPlans = row.planIds.length > 0;
              return (
                <tr key={l.key} className={hasPlans ? 'hover:bg-neutral-50/50' : 'opacity-40'}>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${l.color}`}>{l.label}</span>
                    {!hasPlans && <span className="ml-2 text-xs text-neutral-400">no plans</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number" min={0} step={1}
                      value={row.maxProducts}
                      disabled={!hasPlans}
                      onChange={e => setRow(l.key, { maxProducts: Number(e.target.value) })}
                      className="h-8 w-24 text-sm"
                    />
                  </td>
                  {FEATURE_KEYS.map(f => (
                    <td key={f.key} className="px-4 py-3">
                      <button
                        type="button"
                        disabled={!hasPlans}
                        onClick={() => setFeature(l.key, f.key, !row.features[f.key])}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${hasPlans ? 'cursor-pointer' : 'cursor-not-allowed'} ${row.features[f.key] ? 'bg-black' : 'bg-neutral-200'}`}
                        role="switch"
                        aria-checked={row.features[f.key]}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${row.features[f.key] ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <Button
                      size="sm" className="h-7 px-3 text-xs"
                      disabled={row.saving || !hasPlans}
                      onClick={() => save(l.key)}
                    >
                      {row.saving ? 'Saving…' : row.saved ? 'Saved ✓' : 'Save'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
