'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Compass,
  ClipboardCheck,
  Layers,
  LogOut,
  Sliders
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  dealerCount?: number;
}

export default function Sidebar({ isOpen, dealerCount = 8 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isLinkActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }
    try {
      localStorage.removeItem('fuel_user');
      localStorage.removeItem('session_token');
      sessionStorage.clear();
      // Ensure cookies are wiped immediately in browser
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'fuel_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'fuel_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) { }
    window.location.href = '/login?logout=true';
  };

  return (
    <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-200 ${isOpen ? 'block' : 'hidden md:block'}`}>
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 leading-tight">FuelAudit Pro</div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">RO & Franchise Portal</div>
          </div>
        </div>

        {/* Grouped Nav Items */}
        <div className="p-4 space-y-6 text-xs">
          {/* OVERVIEW */}
          <div>
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overview</div>
            <nav className="space-y-1">
              <Link
                href="/"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold transition ${isLinkActive('/')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Layers className={`w-4 h-4 ${isLinkActive('/') ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Executive Dashboard</span>
              </Link>
            </nav>
          </div>

          {/* OPERATIONS */}
          <div>
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Operations</div>
            <nav className="space-y-1">
              <Link
                href="/dealers"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${isLinkActive('/dealers')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className={`w-4 h-4 ${isLinkActive('/dealers') ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Dealers & ROs</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLinkActive('/dealers') ? 'bg-blue-200/60 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {dealerCount}
                </span>
              </Link>

              <Link
                href="/map"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${isLinkActive('/map')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Compass className={`w-4 h-4 ${isLinkActive('/map') ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Geospatial Map</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </Link>

              <Link
                href="/dealers/manage"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${isLinkActive('/dealers/manage')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Sliders className={`w-4 h-4 ${isLinkActive('/dealers/manage') ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Outlet Master Setup</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Config
                </span>
              </Link>

            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Profile Bar */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="min-w-0 pr-2">
          <div className="text-xs font-bold text-slate-900 leading-tight truncate">System Administrator</div>
          <div className="text-[10px] font-extrabold text-blue-600 tracking-wider">ADMIN</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition cursor-pointer shrink-0"
          title="Sign out of Admin Session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </aside>
  );
}
