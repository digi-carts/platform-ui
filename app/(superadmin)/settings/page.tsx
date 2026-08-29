'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconSettings } from '@/components/ui/icons';
import { CheckCircle2, Clock, Globe, Sparkles } from 'lucide-react';

export default function SuperSettingsPage() {
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const [inactiveDays, setInactiveDays] = useState(30);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysMsg, setDaysMsg] = useState('');
  const [daysError, setDaysError] = useState('');

  const [cfToken, setCfToken] = useState('');
  const [cfZoneId, setCfZoneId] = useState('');
  const [cfDomain, setCfDomain] = useState('');
  const [cfStorefrontHost, setCfStorefrontHost] = useState('');
  const [cfConfigured, setCfConfigured] = useState(false);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfMsg, setCfMsg] = useState('');
  const [cfError, setCfError] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash-lite');
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiMsg, setGeminiMsg] = useState('');

  useEffect(() => {
    api.get('/platform/platform-config/admin-settings').then(r => {
      if (typeof r.data.adminInactiveDays === 'number') setInactiveDays(r.data.adminInactiveDays);
      setCfConfigured(!!r.data.cloudflareConfigured);
      setCfZoneId(r.data.cloudflareZoneId || '');
      setCfDomain(r.data.cloudflareDomain || '');
      setCfStorefrontHost(r.data.storefrontHost || '');
      setGeminiConfigured(!!r.data.geminiConfigured);
      if (r.data.geminiModel) setGeminiModel(r.data.geminiModel);
    }).catch(() => {});
  }, []);

  const changePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setPwLoading(true); setPwError('');
    try {
      await api.post('/auth/admin-mgmt/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwMsg('Password changed successfully');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err: unknown) {
      setPwError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  const saveDays = async () => {
    if (inactiveDays < 1) { setDaysError('Must be at least 1 day'); return; }
    setDaysLoading(true); setDaysError('');
    try {
      await api.patch('/platform/platform-config', { adminInactiveDays: inactiveDays });
      setDaysMsg('Saved');
      setTimeout(() => setDaysMsg(''), 3000);
    } catch {
      setDaysError('Failed to save');
    } finally { setDaysLoading(false); }
  };

  const saveCf = async () => {
    if (!cfZoneId.trim() || !cfDomain.trim()) { setCfError('Zone ID and Domain are required'); return; }
    setCfLoading(true); setCfError(''); setCfMsg('');
    try {
      const patch: Record<string, unknown> = {
        cloudflareZoneId: cfZoneId.trim(),
        cloudflareDomain: cfDomain.trim(),
        storefrontHost: cfStorefrontHost.trim(),
      };
      if (cfToken.trim()) patch.cloudflareApiToken = cfToken.trim();
      await api.patch('/platform/platform-config', patch);
      setCfConfigured(true);
      setCfToken('');
      setCfMsg('Saved.');
      setTimeout(() => setCfMsg(''), 3000);
    } catch {
      setCfError('Failed to save Cloudflare settings.');
    } finally { setCfLoading(false); }
  };

  const testCf = async () => {
    setTestLoading(true); setTestMsg('');
    try {
      const { data } = await api.post('/platform/platform-config/cloudflare-test');
      setTestMsg(data.ok ? '✓ Connection successful' : `✗ ${data.error || 'Test failed'}`);
    } catch (err: unknown) {
      setTestMsg(`✗ ${(err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Test failed'}`);
    } finally { setTestLoading(false); }
  };

  const saveGemini = async () => {
    setGeminiLoading(true); setGeminiMsg('');
    try {
      const patch: Record<string, unknown> = { geminiModel };
      if (geminiKey.trim()) patch.geminiApiKey = geminiKey.trim();
      await api.patch('/platform/platform-config', patch);
      if (geminiKey.trim()) setGeminiConfigured(true);
      setGeminiKey('');
      setGeminiMsg('Saved.');
      setTimeout(() => setGeminiMsg(''), 3000);
    } catch {
      setGeminiMsg('Failed to save.');
    } finally { setGeminiLoading(false); }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <IconSettings size={22} />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-3">
              <div className="space-y-1">
                <Label>Current Password</Label>
                <Input type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>New Password</Label>
                <Input type="password" minLength={6} value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Confirm New Password</Label>
                <Input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              </div>
              {pwError && <p className="text-sm text-red-500">{pwError}</p>}
              {pwMsg && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={13} />{pwMsg}</p>}
              <Button type="submit" disabled={pwLoading} className="w-full">{pwLoading ? 'Saving…' : 'Update Password'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={15} />
              Admin Inactivity Block
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-500">
              Admins who have not logged in for this many days will be automatically blocked.
            </p>
            <div className="space-y-1">
              <Label>Days before auto-block</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={inactiveDays}
                  onChange={e => setInactiveDays(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-sm text-neutral-500">days</span>
              </div>
              <p className="text-xs text-neutral-400">Default: 30 days. Cron runs daily.</p>
            </div>
            {daysError && <p className="text-sm text-red-500">{daysError}</p>}
            {daysMsg && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={13} />{daysMsg}</p>}
            <Button type="button" onClick={saveDays} disabled={daysLoading} className="w-full">
              {daysLoading ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe size={15} />
            Cloudflare DNS
            {cfConfigured && <span className="ml-2 text-xs font-normal text-green-600 flex items-center gap-1"><CheckCircle2 size={12} />Configured</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-500">
            Configure Cloudflare to automatically create <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">*.{cfDomain || 'yourdomain.com'}</code> DNS records when a new store is published.
            Requires a Cloudflare API token with <strong>Zone:DNS:Edit</strong> permission.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Domain <span className="text-red-500">*</span></Label>
              <Input value={cfDomain} onChange={e => setCfDomain(e.target.value)} placeholder="digi-carts.com" />
              <p className="text-xs text-neutral-400">The root domain managed in Cloudflare</p>
            </div>
            <div className="space-y-1">
              <Label>Zone ID <span className="text-red-500">*</span></Label>
              <Input value={cfZoneId} onChange={e => setCfZoneId(e.target.value)} placeholder="abc123def456..." />
              <p className="text-xs text-neutral-400">Found in Cloudflare → domain → Overview sidebar</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>API Token {cfConfigured && <span className="text-xs text-neutral-400 ml-1">(leave blank to keep current)</span>}</Label>
              <Input type="password" value={cfToken} onChange={e => setCfToken(e.target.value)}
                placeholder={cfConfigured ? '••••••••••••••••••••' : 'Enter Cloudflare API token'} />
              <p className="text-xs text-neutral-400">
                Create at Cloudflare → My Profile → API Tokens → Create Token → Edit zone DNS template
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Storefront Host <span className="text-red-500">*</span></Label>
              <Input value={cfStorefrontHost} onChange={e => setCfStorefrontHost(e.target.value)}
                placeholder="digi-cart-storefront.run.app" />
              <p className="text-xs text-neutral-400">
                The hostname your storefront is reachable at — this becomes the CNAME target for store subdomains.
                For Cloud Run: the <code className="bg-neutral-100 px-1 rounded">.run.app</code> URL.
                For k3s/VPS: the server hostname or IP.
              </p>
            </div>
          </div>
          {cfError && <p className="text-sm text-red-500">{cfError}</p>}
          {cfMsg && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={13} />{cfMsg}</p>}
          {testMsg && <p className={`text-sm ${testMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{testMsg}</p>}
          <div className="flex gap-2">
            <Button type="button" onClick={saveCf} disabled={cfLoading}>
              {cfLoading ? 'Saving…' : 'Save'}
            </Button>
            {cfConfigured && (
              <Button type="button" variant="outline" onClick={testCf} disabled={testLoading}>
                {testLoading ? 'Testing…' : 'Test Connection'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles size={16} />
            Platform AI (Gemini)
            {geminiConfigured && <CheckCircle2 size={14} className="text-green-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-500">
            Provide one Gemini API key here and every merchant gets AI product generation out of the box — they don&apos;t need their own Gemini account. Merchants can still override with their own key in their AI settings.
          </p>
          <div className="space-y-1">
            <Label>Gemini API Key</Label>
            <Input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
              placeholder={geminiConfigured ? '•••••••••••••••• (set — enter new to replace)' : 'AIza…'} />
            <p className="text-xs text-neutral-400">Get one free at aistudio.google.com/apikey</p>
          </div>
          <div className="space-y-1">
            <Label>Default Model</Label>
            <select value={geminiModel} onChange={e => setGeminiModel(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (fast &amp; affordable)</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
            </select>
          </div>
          {geminiMsg && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={13} />{geminiMsg}</p>}
          <Button type="button" onClick={saveGemini} disabled={geminiLoading}>
            {geminiLoading ? 'Saving…' : 'Save AI Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
