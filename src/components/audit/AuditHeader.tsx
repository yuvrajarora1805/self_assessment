'use client';

import React from 'react';
import { Building2, Globe, Calendar, LogOut } from 'lucide-react';

interface AuditHeaderProps {
  roName: string;
  cmsCode: string;
  zone?: string;
  currentAuditMonth?: string;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onLogout?: () => void;
}

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English (Default)' },
  { value: 'en-hi', label: 'English + Hindi (हिन्दी)' },
  { value: 'en-mr', label: 'English + Marathi (मराठी)' },
  { value: 'en-gu', label: 'English + Gujarati (ગુજરાતી)' },
  { value: 'en-te', label: 'English + Telugu (తెలుగు)' },
  { value: 'en-ta', label: 'English + Tamil (தமிழ்)' },
  { value: 'en-ml', label: 'English + Malayalam (മലയാളം)' },
  { value: 'en-bn', label: 'English + Bengali (বাংলা)' },
  { value: 'en-or', label: 'English + Odia (ଓଡ଼ିଆ)' },
  { value: 'en-kn', label: 'English + Kannada (ಕನ್ನಡ)' },
  { value: 'en-as', label: 'English + Assamese (অসমীয়া)' }
];

export default function AuditHeader({
  roName,
  cmsCode,
  zone,
  currentAuditMonth,
  selectedLanguage,
  onLanguageChange,
  onLogout
}: AuditHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#002855] text-white shadow-md border-b border-blue-900 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Outlet Identity */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-extrabold truncate text-white leading-tight">
              {roName || 'Retail Outlet Assessment'}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-blue-200 mt-0.5">
              <span className="font-mono bg-blue-950/80 px-2 py-0.5 rounded font-bold text-white border border-blue-500/30">
                {cmsCode || 'CMS: ---'}
              </span>
              {zone && <span>&bull; {zone} Zone</span>}
              {currentAuditMonth && (
                <span className="hidden sm:inline-flex items-center space-x-1 bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{currentAuditMonth} Cycle</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Language Selection & Action */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          <div className="flex items-center bg-blue-900/90 rounded-lg border border-blue-400/30 px-2.5 py-1.5 shadow-inner">
            <Globe className="w-4 h-4 text-blue-300 mr-2 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white font-normal">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-400 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
