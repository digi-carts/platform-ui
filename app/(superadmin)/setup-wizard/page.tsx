'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Lock } from 'lucide-react';

interface WizardField { key: string; label: string; enabled: boolean; required: boolean; locked?: boolean }
interface WizardStep {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  skippable: boolean;
  locked?: boolean;
  fields?: WizardField[];
}
interface WizardConfig { steps: WizardStep[] }

function Toggle({ checked, disabled, onChange, label }: Readonly<{ checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }>) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-black' : 'bg-neutral-300'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function SetupWizardPage() {
  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try { const r = await api.get('/platform/setup-wizard'); setConfig(r.data.config as WizardConfig); }
    catch { setError('Failed to load wizard config'); }
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const patchStep = (key: string, patch: Partial<WizardStep>) =>
    setConfig(c => c ? { steps: c.steps.map(s => s.key === key ? { ...s, ...patch } : s) } : c);

  const patchField = (stepKey: string, fieldKey: string, patch: Partial<WizardField>) =>
    setConfig(c => c ? {
      steps: c.steps.map(s => s.key === stepKey
        ? { ...s, fields: s.fields?.map(f => f.key === fieldKey ? { ...f, ...patch } : f) }
        : s),
    } : c);

  const save = async () => {
    if (!config) return;
    setSaving(true); setError('');
    try {
      const r = await api.patch('/platform/setup-wizard', config);
      setConfig(r.data.config as WizardConfig);
      flash('Setup wizard saved');
    } catch { setError('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!config) return <p className="text-sm text-red-500">{error || 'No config'}</p>;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Wand2 size={20} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Setup Wizard</h1>
      </div>
      <p className="text-sm text-neutral-500">
        Design the merchant onboarding wizard — enable/disable steps, mark them skippable, edit titles &amp; help text,
        and choose which fields the simpler steps collect. Locked <Lock size={11} className="inline" /> items are required by the platform.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-4">
        {config.steps.map((step, i) => (
          <Card key={step.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                <CardTitle className="text-base flex-1">
                  {step.label}
                  {step.locked && <Lock size={12} className="inline ml-1.5 text-neutral-400" />}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                    Enabled
                    <Toggle checked={step.enabled} disabled={step.locked} onChange={v => patchStep(step.key, { enabled: v })} label={`${step.label} enabled`} />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                    Skippable
                    <Toggle checked={step.skippable} disabled={step.key === 'finish'} onChange={v => patchStep(step.key, { skippable: v })} label={`${step.label} skippable`} />
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={step.label} onChange={e => patchStep(step.key, { label: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Help doc <span className="text-neutral-400 font-normal">— shown to the merchant on this step. Use new lines; start a line with &quot;- &quot; for a bullet.</span></Label>
                  <textarea value={step.description}
                    onChange={e => patchStep(step.key, { description: e.target.value })}
                    rows={4}
                    placeholder="Explain what this step is for and any guidance the merchant needs…"
                    className="w-full border rounded-md p-2.5 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
              </div>

              {step.fields && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-medium text-neutral-500">Fields collected</p>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1.5 items-center text-xs text-neutral-400">
                    <span />
                    <span className="text-center w-16">Collect</span>
                    <span className="text-center w-16">Required</span>
                  </div>
                  {step.fields.map(f => (
                    <div key={f.key} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                      <span className="text-sm">
                        {f.label}
                        {f.locked && <Lock size={10} className="inline ml-1 text-neutral-400" />}
                      </span>
                      <div className="w-16 flex justify-center">
                        <Toggle checked={f.enabled} disabled={f.locked} onChange={v => patchField(step.key, f.key, { enabled: v })} label={`${f.label} collect`} />
                      </div>
                      <div className="w-16 flex justify-center">
                        <Toggle checked={f.required} disabled={f.locked || !f.enabled} onChange={v => patchField(step.key, f.key, { required: v })} label={`${f.label} required`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 sticky bottom-0 bg-white/80 backdrop-blur py-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Wizard'}</Button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </div>
    </div>
  );
}
