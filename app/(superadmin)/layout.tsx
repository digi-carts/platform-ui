'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu, ShieldCheck, LogOut } from 'lucide-react';

export default function SuperAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'superadmin') router.replace('/dashboard');
  }, [hydrated, user, router]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? 'S';

  if (!hydrated || !user || user?.role !== 'superadmin') return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {sidebarOpen && (
        <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 w-56 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-neutral-100 lg:hidden" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <ShieldCheck size={18} className="text-neutral-400" />
            <span className="font-semibold text-sm text-neutral-600">Super Admin</span>
          </div>
          <div className="flex lg:hidden items-center gap-2">
            <ShieldCheck size={18} />
            <span className="font-semibold text-sm">Super Admin</span>
          </div>

          {/* Avatar dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(v => !v)}
              className="w-8 h-8 rounded-full bg-neutral-800 text-white text-sm font-bold flex items-center justify-center hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label="User menu"
            >
              {initials}
            </button>
            {avatarOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b">
                  <p className="text-xs font-semibold truncate">{user.email}</p>
                  <p className="text-xs text-neutral-400">Super Admin</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
