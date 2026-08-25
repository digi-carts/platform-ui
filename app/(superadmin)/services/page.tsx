'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, RefreshCw, CheckCircle2, XCircle, HelpCircle, ExternalLink } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'running' | 'inactive' | 'unknown';
  instances: number;
  minInstances: number;
  maxInstances: number;
  url: string | null;
  lastRevision: string | null;
}

interface StatusResponse {
  services: ServiceStatus[];
  fetchedAt: string;
}

function StatusBadge({ status }: { status: ServiceStatus['status'] }) {
  if (status === 'running') return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} />Running
    </span>
  );
  if (status === 'inactive') return (
    <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
      <XCircle size={11} />Inactive
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
      <HelpCircle size={11} />Unknown
    </span>
  );
}

const SERVICES_UI = ['admin-ui', 'platform-ui', 'storefront'];

export default function ServicesPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/platform/services/status');
      setData(r.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const detail = axiosErr.response?.data?.error ?? axiosErr.message ?? 'Unknown error';
      setError(`Failed to fetch service status: ${detail}`);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const backends = data?.services.filter(s => !SERVICES_UI.includes(s.name)) ?? [];
  const uis = data?.services.filter(s => SERVICES_UI.includes(s.name)) ?? [];
  const running = data?.services.filter(s => s.status === 'running').length ?? 0;
  const total = data?.services.length ?? 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={22} className="text-neutral-400" />
          <h1 className="text-2xl font-bold">Services</h1>
        </div>
        <button type="button" onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold mt-1">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Running</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{running}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Inactive</p>
              <p className="text-3xl font-bold mt-1 text-neutral-400">{total - running}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {data && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Backend Services</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {backends.map(svc => (
                <div key={svc.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={svc.status} />
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      {svc.lastRevision && <p className="text-xs text-neutral-400">{svc.lastRevision}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-neutral-400">live / min / max</p>
                      <p className="text-sm font-mono">{svc.instances} / {svc.minInstances} / {svc.maxInstances}</p>
                    </div>
                    {svc.url && (
                      <a href={svc.url} target="_blank" rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-black transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Frontend / UI</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {uis.map(svc => (
                <div key={svc.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={svc.status} />
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      {svc.lastRevision && <p className="text-xs text-neutral-400">{svc.lastRevision}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-neutral-400">live / min / max</p>
                      <p className="text-sm font-mono">{svc.instances} / {svc.minInstances} / {svc.maxInstances}</p>
                    </div>
                    {svc.url && (
                      <a href={svc.url} target="_blank" rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-black transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="text-xs text-neutral-400 text-right">
            Last updated: {new Date(data.fetchedAt).toLocaleTimeString()}
          </p>
        </>
      )}

      {loading && !data && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
