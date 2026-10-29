'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ArrowRight, 
  Fuel, 
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  KeyRound,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export default function DealerLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildFormUrl = (cms: string, ro: any) => {
    const c = encodeURIComponent(cms || '');
    const r = encodeURIComponent(ro?.ro_name || '');
    const t = encodeURIComponent(ro?.tsm_name || '');
    const b = encodeURIComponent(ro?.brand_type || 'Nayara Retail');
    const k = encodeURIComponent(ro?.has_canopy || 'Yes');
    return `/audit-form?cmsCode=${c}&roName=${r}&tsm=${t}&brand=${b}&canopy=${k}`;
  };

  const executeLogin = async (loginUser: string, loginPass: string) => {
    const cleanUser = (loginUser || '').trim();
    const cleanPass = (loginPass || '').trim();

    if (!cleanUser) {
      setError('Please enter your Franchisee CMS Code');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });
      const data = await res.json();

      if (data.success && data.user) {
        if (data.user.role !== 'DEALER') {
          setError('This portal is for Franchisee Dealers only. Administrators should use the HQ Admin Portal.');
          setLoading(false);
          return;
        }

        // Save session in localStorage and cookie
        try {
          const userStr = JSON.stringify(data.user);
          localStorage.setItem('fuel_user', userStr);
          if (data.token) localStorage.setItem('session_token', data.token);
          document.cookie = `session_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `fuel_role=DEALER; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `fuel_user=${encodeURIComponent(userStr)}; path=/; max-age=604800; SameSite=Lax`;
        } catch (e) {
          console.warn('Session save error:', e);
        }

        // Redirect directly to the audit form
        const targetUrl = data.redirectUrl || buildFormUrl(data.user.username, data.user.ro || {});
        window.location.replace(targetUrl);
      } else {
        setError(data.error || 'Authentication failed. Please verify your CMS Code and password.');
        setLoading(false);
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Server unreachable'));
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between items-center p-4 selection:bg-blue-100 font-sans">
      
      {/* Top Header Brand */}
      <header className="w-full max-w-md pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#002855] text-white rounded-xl flex items-center justify-center font-black text-base shadow-sm">
            N
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wide text-[#002855]">
              NAYARA ENERGY
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Authorized Franchisee Portal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#002855] rounded-full border border-blue-200 text-[10px] font-bold tracking-wider uppercase shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Authorized Access</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden my-auto">
        
        {/* Card Header Banner */}
        <div className="bg-[#002855] text-white p-7 text-center relative border-b border-blue-900/50">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-blue-500/25 border border-white/10">
            <Fuel className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white bg-transparent p-0 m-0 tracking-tight">
            Franchisee Self Assessment
          </h1>
          <p className="text-xs text-blue-200/80 mt-1 font-medium">
            Authorized Dealer &amp; RO Representative Sign In
          </p>
        </div>

        {/* Form Body */}
        <div className="p-7 md:p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-rose-700 font-medium animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Franchisee CMS Code
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter CMS Code (e.g. 50085NA085)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-blue-600 font-medium">Initial default: 123456</span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#002855] hover:bg-[#003875] active:bg-[#001f3f] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-950/20 flex items-center justify-center space-x-2 transition disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Open Self Assessment Form</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Compliance Notice */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Self Assessment Policy:</span> Dealers must record accurate daily tank dips, photo verifications, and statutory renewals during the active monthly cycle.
            </div>
          </div>
        </div>

        {/* Card Footer Support Info */}
        <div className="bg-slate-50/80 px-7 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Need assistance?</span>
          </div>
          <span className="font-semibold text-blue-700">Contact Assigned TSM</span>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="w-full max-w-md py-4 text-center text-xs text-slate-400">
        Nayara Energy Enterprise Operations &bull; Franchisee Dealer Gateway
      </footer>

    </div>
  );
}
