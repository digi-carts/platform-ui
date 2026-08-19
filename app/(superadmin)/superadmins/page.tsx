'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShieldCheck, Clock } from 'lucide-react';

interface SuperAdmin { id: string; email: string; name?: string | null; role: string; lastLoginAt?: string | null; createdAt: string }
type Modal = { type: 'create' } | null;

function fmtLastLogin(ts?: string | null) {
  if (!ts) return <span className="text-neutral-400 italic">Never</span>;
  const d = new Date(ts);
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  let label = days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
  return (
    <span className="flex items-center gap-1 text-neutral-400">
      <Clock size={11} />
      <span title={d.toLocaleString()}>{label}</span>
    </span>
  );
}

export default function SuperAdminsPage() {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api.get('/auth/admin-mgmt/superadmins');
    setAdmins(res.data.users || []);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const close = () => { setModal(null); setError(''); setFormErrors({ email: '', password: '' }); };

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    const pwValid = form.password.length >= 6;
    setFormErrors({ email: emailValid ? '' : 'Enter a valid email', password: pwValid ? '' : 'Min 6 characters' });
    if (!emailValid || !pwValid) return;
    setLoading(true); setError('');
    try {
      await api.post('/auth/admin-mgmt/superadmin', { email: form.email, password: form.password, name: form.name || undefined });
      setForm({ email: '', password: '', name: '' });
      close();
      await load();
      flash('Super admin created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create');
    } finally { setLoading(false); }
  };

  const del = async (a: SuperAdmin) => {
    if (!confirm(`Delete super admin ${a.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/admin-mgmt/superadmin/${a.id}`);
      await load();
      flash('Deleted');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete');
    }
  };

  const filtered = admins.filter(a => !search || a.email.toLowerCase().includes(search.toLowerCase()) || (a.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Super Admins</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-green-600">{msg}</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm w-56" />
          <Button size="sm" onClick={() => { setForm({ email: '', password: '', name: '' }); setModal({ type: 'create' }); setError(''); }}>
            + Add Super Admin
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Last Login</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No super admins found.</td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-neutral-50/50">
                <td className="px-4 py-3 font-medium">{a.email}</td>
                <td className="px-4 py-3 text-neutral-500">{a.name || <span className="italic text-neutral-300">—</span>}</td>
                <td className="px-4 py-3">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">SUPERADMIN</Badge>
                </td>
                <td className="px-4 py-3 text-xs">{fmtLastLogin(a.lastLoginAt)}</td>
                <td className="px-4 py-3 text-xs text-neutral-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => del(a)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.type === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck size={16} /> Create Super Admin</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={create} className="space-y-3">
                <div className="space-y-1">
                  <Label>Name (optional)</Label>
                  <Input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" placeholder="admin@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Creating…' : 'Create Super Admin'}</Button>
                  <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
