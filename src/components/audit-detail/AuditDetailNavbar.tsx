'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, Printer, LogOut } from 'lucide-react';

interface AuditDetailNavbarProps {
  isAdmin: boolean;
  onExportExcel: () => void;
}

export function AuditDetailNavbar({ isAdmin, onExportExcel }: AuditDetailNavbarProps) {
  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    try { localStorage.removeItem('fuel_user'); } catch (e) {}
    window.location.replace('/login');
  };

  return (
    <div className="sticky top-0 z-50 bg-[#002855] text-white shadow-md no-print">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-0 sm:h-16 flex flex-wrap items-center justify-between gap-2">
        <Link 
          href={isAdmin ? '/' : '/audit-form'} 
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-blue-200 hover:text-white transition py-1"
        >
          <ArrowLeft className="w-4 h-4 mr-1 shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-none">{isAdmin ? 'Dashboard' : 'Audit Form'}</span>
        </Link>

        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Export as Excel Sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Export</span> Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
