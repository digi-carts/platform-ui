'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconNotifications } from '@/components/ui/icons';
import { CheckCircle2, Mail, MessageCircle } from 'lucide-react';

interface NotifConfig {
  smtpHost?: string; smtpPort?: string; smtpUser?: string;
  smtpPassword?: string; smtpFrom?: string; emailEnabled?: boolean;
  waProvider?: 'TWILIO' | 'META'; waApiKey?: string;
  waPhoneId?: string; waAccountSid?: string; waAuthToken?: string; waEnabled?: boolean;
}

export default function NotificationsConfigPage() {
  const [cfg, setCfg] = useState<NotifConfig>({
    smtpHost: 'smtp.gmail.com', smtpPort: '587', emailEnabled: false,
    waProvider: 'META', waEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [waSaving, setWaSaving] = useState(false);
  const [waMsg, setWaMsg] = useState('');
  const [waErr, setWaErr] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState<'EMAIL' | 'WHATSAPP' | 'BOTH' | null>(null);
  const [testMsg, setTestMsg] = useState('');
  const [testOk, setTestOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications/config');
      if (r.data.config) setCfg(c => ({ ...c, ...r.data.config }));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveEmail = async () => {
    setEmailSaving(true); setEmailErr('');
    try {
      await api.put('/notifications/config', {
        smtpHost: cfg.smtpHost, smtpPort: Number(cfg.smtpPort),
        smtpUser: cfg.smtpUser, smtpPassword: cfg.smtpPassword,
        smtpFrom: cfg.smtpFrom, emailEnabled: cfg.emailEnabled,
      });
      setEmailMsg('Saved'); setTimeout(() => setEmailMsg(''), 3000);
    } catch { setEmailErr('Failed to save'); }
    finally { setEmailSaving(false); }
  };

  const saveWa = async () => {
    setWaSaving(true); setWaErr('');
    try {
      await api.put('/notifications/config', {
        waProvider: cfg.waProvider, waApiKey: cfg.waApiKey,
        waPhoneId: cfg.waPhoneId, waEnabled: cfg.waEnabled,
        waAccountSid: cfg.waAccountSid, waAuthToken: cfg.waAuthToken,
      });
      setWaMsg('Saved'); setTimeout(() => setWaMsg(''), 3000);
    } catch { setWaErr('Failed to save'); }
    finally { setWaSaving(false); }
  };

  const sendTest = async (channel: 'EMAIL' | 'WHATSAPP' | 'BOTH') => {
    setTesting(channel); setTestMsg('');
    try {
      const { data } = await api.post('/notifications/notify/test', {
        channel, toEmail: testEmail || cfg.smtpUser || undefined, toPhone: testPhone || undefined,
      });
      const lines = (data.results as { channel: string; ok: boolean; error?: string }[] | undefined)
        ?.map(r => r.ok ? `${r.channel}: sent` : `${r.channel}: ${r.error || 'failed'}`)
        .join(' · ');
      setTestOk(!!data.ok);
      setTestMsg(lines || (data.ok ? 'Test sent.' : 'Test failed.'));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { results?: { channel: string; ok: boolean; error?: string }[]; error?: string } } };
      const lines = err.response?.data?.results
        ?.map(r => r.ok ? `${r.channel}: sent` : `${r.channel}: ${r.error || 'failed'}`)
        .join(' · ');
      setTestOk(false);
      setTestMsg(lines || err.response?.data?.error || 'Failed to send test.');
    } finally { setTesting(null); }
  };

  if (loading) return <div className="w-full"><p className="text-sm text-neutral-400">Loading…</p></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <IconNotifications size={22} />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {/* Email SMTP */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail size={15} />Email (SMTP)
            </CardTitle>
            <button type="button" aria-label="Toggle email"
              onClick={() => setCfg(c => ({ ...c, emailEnabled: !c.emailEnabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${cfg.emailEnabled ? 'bg-black' : 'bg-neutral-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.emailEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.gmail.com" value={cfg.smtpHost || ''}
                onChange={e => setCfg(c => ({ ...c, smtpHost: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Port</Label>
              <Input type="number" placeholder="587" value={cfg.smtpPort || ''}
                onChange={e => setCfg(c => ({ ...c, smtpPort: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Email (sender)</Label>
            <Input type="email" placeholder="yourstore@gmail.com" value={cfg.smtpUser || ''}
              onChange={e => setCfg(c => ({ ...c, smtpUser: e.target.value, smtpFrom: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>App Password</Label>
            <Input type="password" placeholder="Gmail App Password" value={cfg.smtpPassword === '••••••••' ? '' : (cfg.smtpPassword || '')}
              onChange={e => setCfg(c => ({ ...c, smtpPassword: e.target.value }))} />
            <p className="text-xs text-neutral-400">
              Gmail: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">myaccount.google.com/apppasswords</a> → create an App Password
            </p>
          </div>
          {emailErr && <p className="text-sm text-red-500">{emailErr}</p>}
          {emailMsg && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={13} />{emailMsg}</p>}
          <Button type="button" onClick={saveEmail} disabled={emailSaving} className="w-full">
            {emailSaving ? 'Saving…' : 'Save Email Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle size={15} />WhatsApp
            </CardTitle>
            <button type="button" aria-label="Toggle WhatsApp"
              onClick={() => setCfg(c => ({ ...c, waEnabled: !c.waEnabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${cfg.waEnabled ? 'bg-green-500' : 'bg-neutral-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.waEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Provider</Label>
            <div className="flex gap-2">
              {(['META', 'TWILIO'] as const).map(p => (
                <button key={p} type="button"
                  onClick={() => setCfg(c => ({ ...c, waProvider: p }))}
                  className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${cfg.waProvider === p ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                  {p === 'META' ? 'Meta (WhatsApp Business API)' : 'Twilio'}
                </button>
              ))}
            </div>
          </div>
          {cfg.waProvider === 'META' ? (
            <>
              <div className="space-y-1">
                <Label>Access Token</Label>
                <Input type="password" placeholder="EAAxxxxxx…" value={cfg.waApiKey === '••••••••' ? '' : (cfg.waApiKey || '')}
                  onChange={e => setCfg(c => ({ ...c, waApiKey: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Phone Number ID</Label>
                <Input placeholder="123456789012345" value={cfg.waPhoneId || ''}
                  onChange={e => setCfg(c => ({ ...c, waPhoneId: e.target.value }))} />
                <p className="text-xs text-neutral-400">
                  Get from <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline">Meta for Developers</a> → Your App → WhatsApp → API Setup
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Account SID</Label>
                <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={cfg.waAccountSid || ''}
                  onChange={e => setCfg(c => ({ ...c, waAccountSid: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Auth Token</Label>
                <Input type="password" placeholder={cfg.waAuthToken === '••••••••' ? '••••••••' : 'Twilio Auth Token'}
                  value={cfg.waAuthToken === '••••••••' ? '' : (cfg.waAuthToken || '')}
                  onChange={e => setCfg(c => ({ ...c, waAuthToken: e.target.value }))} />
                <p className="text-xs text-neutral-400">
                  From <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a> → Account Info
                </p>
              </div>
              <div className="space-y-1">
                <Label>Twilio WhatsApp Number</Label>
                <Input placeholder="+14155238886" value={cfg.waPhoneId || ''}
                  onChange={e => setCfg(c => ({ ...c, waPhoneId: e.target.value }))} />
              </div>
            </>
          )}
          {waErr && <p className="text-sm text-red-500">{waErr}</p>}
          {waMsg && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={13} />{waMsg}</p>}
          <Button type="button" onClick={saveWa} disabled={waSaving} className="w-full">
            {waSaving ? 'Saving…' : 'Save WhatsApp Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send a test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Test email</Label>
              <Input type="email" placeholder={cfg.smtpUser || 'you@example.com'} value={testEmail}
                onChange={e => setTestEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Test phone</Label>
              <Input placeholder="+919876543210" value={testPhone}
                onChange={e => setTestPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!cfg.emailEnabled || !!testing}
              onClick={() => sendTest('EMAIL')}>{testing === 'EMAIL' ? 'Sending…' : 'Send test email'}</Button>
            <Button type="button" variant="outline" size="sm" disabled={!cfg.waEnabled || !!testing}
              onClick={() => sendTest('WHATSAPP')}>{testing === 'WHATSAPP' ? 'Sending…' : 'Send test WhatsApp'}</Button>
            <Button type="button" variant="outline" size="sm" disabled={(!cfg.emailEnabled && !cfg.waEnabled) || !!testing}
              onClick={() => sendTest('BOTH')}>{testing === 'BOTH' ? 'Sending…' : 'Send test message'}</Button>
          </div>
          {testMsg && <p className={`text-sm ${testOk ? 'text-green-600' : 'text-red-500'}`}>{testMsg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
