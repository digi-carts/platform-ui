'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface WaConfig {
  waProvider: 'TWILIO' | 'META';
  waApiKey: string;
  waPhoneId: string;
  waAccountSid: string;
  waAuthToken: string;
  waEnabled: boolean;
}

interface Props {
  readonly initial: Partial<WaConfig>;
  readonly onSave: (data: WaConfig) => Promise<void>;
}

const MASK = '••••••••';

export function WhatsAppConfigForm({ initial, onSave }: Props) {
  const [form, setForm] = useState<WaConfig>({
    waProvider: initial.waProvider ?? 'META',
    waApiKey: initial.waApiKey ?? '',
    waPhoneId: initial.waPhoneId ?? '',
    waAccountSid: initial.waAccountSid ?? '',
    waAuthToken: initial.waAuthToken ?? '',
    waEnabled: initial.waEnabled ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">WhatsApp</CardTitle>
          <Badge variant={form.waEnabled ? 'default' : 'secondary'}>
            {form.waEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <Label>Provider</Label>
          <Select value={form.waProvider}
            onValueChange={v => setForm(f => ({ ...f, waProvider: v as WaConfig['waProvider'] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="META">Meta (Cloud API)</SelectItem>
              <SelectItem value="TWILIO">Twilio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.waProvider === 'TWILIO' ? (
          <>
            <div className="space-y-1 col-span-2">
              <Label>Account SID</Label>
              <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={form.waAccountSid}
                onChange={e => setForm(f => ({ ...f, waAccountSid: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Auth Token</Label>
              <Input type="password" placeholder={form.waAuthToken === MASK ? MASK : 'Twilio Auth Token'}
                value={form.waAuthToken === MASK ? '' : form.waAuthToken}
                onChange={e => setForm(f => ({ ...f, waAuthToken: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>WhatsApp From Number</Label>
              <Input placeholder="+1234567890" value={form.waPhoneId}
                onChange={e => setForm(f => ({ ...f, waPhoneId: e.target.value }))} />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1 col-span-2">
              <Label>Access Token</Label>
              <Input type="password" placeholder="••••••••" value={form.waApiKey === MASK ? '' : form.waApiKey}
                onChange={e => setForm(f => ({ ...f, waApiKey: e.target.value }))} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Phone Number ID</Label>
              <Input placeholder="123456789012345" value={form.waPhoneId}
                onChange={e => setForm(f => ({ ...f, waPhoneId: e.target.value }))} />
            </div>
          </>
        )}
        <div className="col-span-2 flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={form.waEnabled}
              onChange={e => setForm(f => ({ ...f, waEnabled: e.target.checked }))} />
            Enable WhatsApp notifications
          </label>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
        {error && <p className="col-span-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
