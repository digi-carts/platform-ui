'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CheckCircle2 } from 'lucide-react';

interface InfoSection {
  title?: string;
  steps?: string[];
  note?: string;
  youtubeUrl?: string;
}

interface InfoContent {
  payment?: InfoSection;
  shipping?: InfoSection;
  ai?: InfoSection;
  emailNotif?: InfoSection;
  whatsappNotif?: InfoSection;
}

const SECTION_LABELS: { key: keyof InfoContent; label: string; desc: string }[] = [
  { key: 'payment', label: 'Payment (Razorpay)', desc: 'Shown when merchant clicks ℹ on Razorpay settings' },
  { key: 'shipping', label: 'Shipping (NimbusPost)', desc: 'Shown when merchant clicks ℹ on shipping settings' },
  { key: 'ai', label: 'AI (Gemini)', desc: 'Shown when merchant clicks ℹ on AI settings' },
  { key: 'emailNotif', label: 'Notifications — Email', desc: 'Shown when merchant clicks ℹ on email notifications' },
  { key: 'whatsappNotif', label: 'Notifications — WhatsApp', desc: 'Shown when merchant clicks ℹ on WhatsApp notifications' },
];

function SectionEditor({
  label, desc, value, onChange,
}: Readonly<{ label: string; desc: string; value: InfoSection; onChange: (v: InfoSection) => void }>) {
  const stepsText = (value.steps ?? []).join('\n');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info size={15} className="text-neutral-400" />
          {label}
        </CardTitle>
        <p className="text-xs text-neutral-500">{desc}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>Modal title</Label>
          <Input
            value={value.title ?? ''}
            onChange={e => onChange({ ...value, title: e.target.value })}
            placeholder="How to set up …"
          />
        </div>
        <div className="space-y-1">
          <Label>Steps <span className="text-neutral-400 font-normal">(one per line)</span></Label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-1 focus:ring-black"
            value={stepsText}
            onChange={e => onChange({ ...value, steps: e.target.value.split('\n') })}
            placeholder="Step 1 description&#10;Step 2 description&#10;Step 3 description"
          />
        </div>
        <div className="space-y-1">
          <Label>Note <span className="text-neutral-400 font-normal">(shown below steps)</span></Label>
          <Input
            value={value.note ?? ''}
            onChange={e => onChange({ ...value, note: e.target.value })}
            placeholder="Optional extra note…"
          />
        </div>
        <div className="space-y-1">
          <Label>YouTube URL</Label>
          <Input
            value={value.youtubeUrl ?? ''}
            onChange={e => onChange({ ...value, youtubeUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InfoContentPage() {
  const [content, setContent] = useState<InfoContent>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/platform/platform-config/info-content').then(r => {
      if (r.data && typeof r.data === 'object') setContent(r.data as InfoContent);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.patch('/platform/platform-config/info-content', content);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  const update = (key: keyof InfoContent) => (v: InfoSection) =>
    setContent(c => ({ ...c, [key]: v }));

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Info Modal Content</h1>
        <p className="text-sm text-neutral-500">
          Edit the step-by-step guides shown to merchants when they click the <Info size={12} className="inline" /> button on each settings page.
          Leave any field blank to use the built-in default.
        </p>
      </div>

      {SECTION_LABELS.map(({ key, label, desc }) => (
        <SectionEditor
          key={key}
          label={label}
          desc={desc}
          value={content[key] ?? {}}
          onChange={update(key)}
        />
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={14} />Saved!</p>}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save All Info Content'}
      </Button>
    </div>
  );
}
