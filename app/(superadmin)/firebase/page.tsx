'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoModal } from '@/components/ui/info-modal';
import { Flame, Info } from 'lucide-react';

interface FirebaseConfig {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseEnableGoogle: boolean;
  firebaseEnablePhone: boolean;
  firebaseEnableFacebook: boolean;
  firebaseFacebookAppId: string;
}

const defaultConfig: FirebaseConfig = {
  firebaseApiKey: '',
  firebaseAuthDomain: '',
  firebaseProjectId: '',
  firebaseEnableGoogle: true,
  firebaseEnablePhone: true,
  firebaseEnableFacebook: false,
  firebaseFacebookAppId: '',
};

function A({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{children}</a>;
}

function Step({ n, children }: Readonly<{ n: number; children: React.ReactNode }>) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">{n}</span>
      <span>{children}</span>
    </div>
  );
}

export default function FirebaseConfigPage() {
  const [config, setConfig] = useState<FirebaseConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [fbInfoOpen, setFbInfoOpen] = useState(false);

  useEffect(() => {
    api.get('/platform/platform-config').then(r => {
      const fb = r.data.firebase || {};
      setConfig(prev => ({
        ...prev,
        firebaseApiKey: fb.apiKey || '',
        firebaseAuthDomain: fb.authDomain || '',
        firebaseProjectId: fb.projectId || '',
        firebaseEnableGoogle: fb.enableGoogle !== false,
        firebaseEnablePhone: fb.enablePhone !== false,
        firebaseEnableFacebook: !!fb.enableFacebook,
      }));
    }).catch(() => {});
  }, []);

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.patch('/platform/platform-config', {
        firebaseApiKey: config.firebaseApiKey,
        firebaseAuthDomain: config.firebaseAuthDomain,
        firebaseProjectId: config.firebaseProjectId,
        firebaseEnableGoogle: config.firebaseEnableGoogle,
        firebaseEnablePhone: config.firebaseEnablePhone,
        firebaseEnableFacebook: config.firebaseEnableFacebook,
        firebaseFacebookAppId: config.firebaseFacebookAppId,
      });
      setMsg('Saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Flame size={22} className="text-orange-500" />
        <h1 className="text-2xl font-bold">Firebase Auth Config</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        Configure Firebase Authentication to allow customers to sign in with Google, Phone, or Facebook.
        Get these values from your <A href="https://console.firebase.google.com">Firebase Console</A>.
      </p>

      {fbInfoOpen && (
        <InfoModal title="How to get Firebase Web App Config" onClose={() => setFbInfoOpen(false)}>
          <Step n={1}>Go to <A href="https://console.firebase.google.com">console.firebase.google.com</A> and select your project (or create one)</Step>
          <Step n={2}>Click the <strong>gear icon</strong> → <strong>Project Settings</strong> → <strong>General</strong> tab</Step>
          <Step n={3}>Scroll down to <strong>Your apps</strong> → click your Web app (or click <strong>Add app</strong> → <strong>Web</strong> to create one)</Step>
          <Step n={4}>Under <strong>SDK setup and configuration</strong>, copy <code className="bg-neutral-100 px-1 rounded">apiKey</code>, <code className="bg-neutral-100 px-1 rounded">authDomain</code>, <code className="bg-neutral-100 px-1 rounded">projectId</code> from the <code className="bg-neutral-100 px-1 rounded">firebaseConfig</code> object</Step>
          <Step n={5}>In the Firebase Console → <strong>Authentication</strong> → <strong>Sign-in method</strong>, enable the providers you want (Google, Phone, Facebook)</Step>
          <Step n={6}>For Google: make sure your storefront URL is in <strong>Authorized domains</strong> (Authentication → Settings)</Step>
        </InfoModal>
      )}

      <form onSubmit={save} className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Firebase Web App Config
                <button
                  type="button"
                  onClick={() => setFbInfoOpen(true)}
                  className="text-neutral-400 hover:text-neutral-600 inline-flex items-center"
                  aria-label="Firebase setup guide">
                  <Info size={14} />
                </button>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-neutral-400">Project Settings → General → Your apps → Web app → firebaseConfig</p>
            <div className="space-y-1">
              <Label>API Key <span className="text-red-400">*</span></Label>
              <Input placeholder="AIzaSy..." value={config.firebaseApiKey}
                onChange={e => setConfig(c => ({ ...c, firebaseApiKey: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Auth Domain <span className="text-red-400">*</span></Label>
              <Input placeholder="your-project.firebaseapp.com" value={config.firebaseAuthDomain}
                onChange={e => setConfig(c => ({ ...c, firebaseAuthDomain: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Project ID <span className="text-red-400">*</span></Label>
              <Input placeholder="your-project-id" value={config.firebaseProjectId}
                onChange={e => setConfig(c => ({ ...c, firebaseProjectId: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Enabled Sign-in Methods</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: 'firebaseEnableGoogle', label: '🔵 Google Sign-In' },
              { key: 'firebaseEnablePhone', label: '📱 Phone (OTP)' },
              { key: 'firebaseEnableFacebook', label: '🔷 Facebook Login' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={config[key as keyof FirebaseConfig] as boolean}
                  onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                  className="accent-black w-4 h-4" />
                {label}
              </label>
            ))}
            {config.firebaseEnableFacebook && (
              <div className="space-y-1 pt-2">
                <Label>Facebook App ID</Label>
                <Input placeholder="1234567890" value={config.firebaseFacebookAppId}
                  onChange={e => setConfig(c => ({ ...c, firebaseFacebookAppId: e.target.value }))} />
                <p className="text-xs text-neutral-400">From developers.facebook.com → Your App → Settings → Basic</p>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {msg && <p className="text-sm text-green-600">✓ {msg}</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Firebase Config'}</Button>
      </form>
    </div>
  );
}
