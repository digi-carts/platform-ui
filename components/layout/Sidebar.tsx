'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, LifeBuoy, Sun, Moon, Monitor, ChevronDown, ChevronRight, Tag, Layers, TerminalSquare, Wand2, Info } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import {
  IconDashboard, IconAdmins, IconStores, IconCustomers,
  IconTemplates, IconSubscriptions, IconNotifications,
  IconPayment, IconFirebase, IconSettings, IconServices,
} from '@/components/ui/icons';

const superAdminLinks = [
  { href: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
  { href: '/admins', label: 'Admins', Icon: IconAdmins },
  { href: '/superadmins', label: 'Super Admins', Icon: ShieldCheck },
  { href: '/stores', label: 'Stores', Icon: IconStores },
  { href: '/customers', label: 'Customers', Icon: IconCustomers },
  { href: '/templates', label: 'Templates', Icon: IconTemplates },
  { href: '/setup-wizard', label: 'Setup Wizard', Icon: Wand2 },
  { href: '/services', label: 'Services', Icon: IconServices },
  { href: '/notifications', label: 'Notifications', Icon: IconNotifications },
  { href: '/payment', label: 'Payment', Icon: IconPayment },
  { href: '/firebase', label: 'Firebase Auth', Icon: IconFirebase },
  { href: '/support', label: 'Support', Icon: LifeBuoy },
  { href: '/cleanup', label: 'SQL', Icon: TerminalSquare },
  { href: '/settings', label: 'Settings', Icon: IconSettings },
  { href: '/settings/info-content', label: 'Info Content', Icon: Info },
];

const subscriptionSubLinks = [
  { href: '/subscriptions', label: 'Plans', Icon: IconSubscriptions },
  { href: '/subscriptions/features', label: 'Feature Limits', Icon: Layers },
  { href: '/subscriptions/discounts', label: 'Discounts', Icon: Tag },
];

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: Readonly<SidebarProps>) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [subsOpen, setSubsOpen] = useState(pathname.startsWith('/subscriptions'));

  useEffect(() => {
    if (pathname.startsWith('/subscriptions')) setSubsOpen(true);
  }, [pathname]);
  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-56 h-full min-h-screen bg-neutral-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} />
          <span className="font-bold text-base">digi-carts</span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="lg:hidden text-neutral-400 hover:text-white p-1" aria-label="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      <div className="px-4 py-2">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Super Admin</span>
      </div>

      <nav className="flex-1 px-2 pb-2 flex flex-col gap-0.5 overflow-y-auto">
        {superAdminLinks.slice(0, 5).map(({ href, label, Icon }) => (
          <Link key={href} href={href} onClick={onClose}
            className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {/* Subscriptions collapsible */}
        <div>
          <button type="button" onClick={() => setSubsOpen(!subsOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${pathname.startsWith('/subscriptions') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <IconSubscriptions size={16} />
            <span className="flex-1 text-left">Subscriptions</span>
            {subsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {subsOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {subscriptionSubLinks.map(({ href, label, Icon }) => (
                <Link key={href} href={href} onClick={onClose}
                  className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
                  <Icon size={13} />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {superAdminLinks.slice(5).map(({ href, label, Icon }) => (
          <Link key={href} href={href} onClick={onClose}
            className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-2 pb-3">
        <Separator className="bg-neutral-800 mb-3" />
        <p className="text-[11px] text-neutral-500 truncate px-3 mb-2">{user?.email}</p>
        <div className="flex gap-1 px-1">
          {([['light', <Sun key="s" size={11} />], ['dark', <Moon key="m" size={11} />], ['system', <Monitor key="mo" size={11} />]] as const).map(([t, icon]) => (
            <button key={t} type="button" onClick={() => setTheme(t)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] transition-colors ${theme === t ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
              {icon}{t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
