'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, CheckCircle, Clock, Loader2, Trash2 } from 'lucide-react';

interface StoreRow { id: string; name: string; subdomain: string; domain?: string }
interface DnsRecord { type: string; name: string; rrdata: string }

type Step = 'input' | 'processing' | 'dns' | 'active';

export function DomainModal({ store, onClose, onSaved }: Readonly<{
  store: StoreRow;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [domain, setDomain] = useState(store.domain || '');
  const [step, setStep] = useState<Step>(store.domain ? 'dns' : 'input');
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [status, setStatus] = useState<'pending' | 'active' | 'unknown'>('pending');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const checkStatus = useCallback(async (d: string) => {
    try {
      const { data } = await api.get(`/store/domain-mapping/${encodeURIComponent(d)}`);
      setStatus(data.status);
      setStatusMsg(data.message || '');
      if (data.dnsRecords?.length) setDnsRecords(data.dnsRecords);
      if (data.status === 'active') setStep('active');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (store.domain) {
      setDomain(store.domain);
      checkStatus(store.domain);
    }
  }, [store.domain, checkStatus]);

  const connect = async () => {
    if (!domain.trim()) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/store/domain-mapping', { domain: domain.trim(), storeId: store.id });
      setDnsRecords(data.dnsRecords || []);
      setStep('dns');
      onSaved();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to connect domain');
    } finally { setLoading(false); }
  };

  const remove = async () => {
    if (!confirm(`Remove domain ${domain}?`)) return;
    setRemoving(true);
    try {
      await api.delete(`/store/domain-mapping/${encodeURIComponent(domain)}`, { data: { storeId: store.id } });
      setDomain('');
      setDnsRecords([]);
      setStep('input');
      onSaved();
    } catch { /* ignore */ }
    finally { setRemoving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe size={16} className="text-indigo-600" />
            Custom Domain — {store.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Step: Input domain */}
          {step === 'input' && (
            <>
              <p className="text-sm text-neutral-500">
                Enter the domain the store owner wants to use. They must own this domain and be able to edit its DNS records.
              </p>
              <div className="space-y-1">
                <Label>Domain</Label>
                <Input placeholder="iyrastore.com or shop.iyra.com" value={domain}
                  onChange={e => setDomain(e.target.value.toLowerCase().trim())} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={connect} disabled={loading || !domain} className="flex-1">
                  {loading ? <><Loader2 size={14} className="mr-2 animate-spin" />Connecting…</> : 'Connect Domain'}
                </Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          )}

          {/* Step: DNS records */}
          {(step === 'dns' || step === 'active') && (
            <>
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${step === 'active' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                {step === 'active'
                  ? <><CheckCircle size={16} /> Domain is active and SSL is provisioned!</>
                  : <><Clock size={16} /> Waiting for DNS — ask the store owner to add these records</>
                }
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Domain: <code className="bg-neutral-100 px-1.5 rounded">{domain}</code></p>
                <p className="text-sm text-neutral-500 mb-3">
                  Ask the store owner to add this record in their DNS provider (Cloudflare, GoDaddy, Namecheap, etc.):
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs text-neutral-500">Type</th>
                        <th className="text-left px-3 py-2 text-xs text-neutral-500">Name / Host</th>
                        <th className="text-left px-3 py-2 text-xs text-neutral-500">Value / Target</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {dnsRecords.length > 0 ? dnsRecords.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs font-bold">{r.type}</td>
                          <td className="px-3 py-2 font-mono text-xs">{r.name || '@'}</td>
                          <td className="px-3 py-2 font-mono text-xs">{r.rrdata}</td>
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => navigator.clipboard.writeText(r.rrdata)}
                              className="text-xs text-neutral-400 hover:text-black underline">copy</button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-3 py-3 text-xs text-neutral-400 text-center">
                          <button type="button" onClick={() => checkStatus(domain)} className="underline">Check DNS records</button>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  ⚠️ Do NOT enable Cloudflare proxy (orange cloud) — keep it DNS only (grey cloud).
                  SSL certificate provisions automatically in ~15 minutes after DNS propagates.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => checkStatus(domain)} className="flex-1">
                  <Loader2 size={13} className="mr-1" /> Check Status
                </Button>
                <Button variant="destructive" size="sm" onClick={remove} disabled={removing}>
                  {removing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
              </div>

              {statusMsg && <p className="text-xs text-neutral-500">{statusMsg}</p>}
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
