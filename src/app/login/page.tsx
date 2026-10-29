'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ArrowRight, 
  Fuel, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Building,
  KeyRound,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('expired')) {
        setError('Your session has expired or is unauthorized. Please log in again.');
        try {
          localStorage.removeItem('fuel_user');
          localStorage.removeItem('session_token');
        } catch (e) {}
      }
    }
  }, []);

  const executeLogin = async (loginUser: string, loginPass: string) => {
    const cleanUser = (loginUser || '').trim();
    const cleanPass = (loginPass || '').trim();

    if (!cleanUser) {
      setError('Please enter your CMS Code or Username');
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
        // Check if mandatory first-time password reset is required
        if (data.mustChangePassword) {
          setShowResetModal(true);
          setPendingUserData(data);
          setLoading(false);
          return;
        }

        // 1. Client-side cookie backup ensuring cookies are available immediately
        try {
          if (data.token) {
            document.cookie = `session_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
          }
          if (data.user?.role) {
            document.cookie = `fuel_role=${data.user.role}; path=/; max-age=604800; SameSite=Lax`;
          }
        } catch (e) {
          console.warn('Cookie sync warning:', e);
        }

        // 2. Cache user info in localStorage
        try {
          if (rememberMe) {
            localStorage.setItem('fuel_user', JSON.stringify(data.user));
            if (data.token) localStorage.setItem('session_token', data.token);
          }
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }

        // 3. Automatically redirect to destination returned by server (Dealer to audit form, Admin to dashboard)
        const target = data.redirectUrl || (data.user.role === 'DEALER' ? '/audit-form' : '/');
        setTimeout(() => {
          window.location.href = target;
        }, 100);
      } else {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Server unreachable'));
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (newPass === '123456') {
      setResetError('Password cannot be the default initial password (123456).');
      return;
    }
    if (newPass !== confirmPass) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmsCode: pendingUserData?.user?.username,
          newPassword: newPass,
          confirmPassword: confirmPass
        })
      });
      const data = await res.json();
      if (data.success) {
        try {
          if (pendingUserData?.token) {
            document.cookie = `session_token=${pendingUserData.token}; path=/; max-age=604800; SameSite=Lax`;
          }
          document.cookie = `fuel_role=DEALER; path=/; max-age=604800; SameSite=Lax`;
          localStorage.setItem('fuel_user', JSON.stringify({
            ...pendingUserData.user,
            mustChangePassword: false
          }));
        } catch (e) {}

        const target = pendingUserData?.redirectUrl || '/audit-form';
        setTimeout(() => {
          window.location.href = target;
        }, 100);
      } else {
        setResetError(data.error || 'Failed to update password.');
        setResetLoading(false);
      }
    } catch (err: any) {
      setResetError(err.message || 'Network error.');
      setResetLoading(false);
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
            <div className="font-extrabold text-sm tracking-wide text-[#002855] flex items-center gap-1.5">
              NAYARA ENERGY
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Enterprise Retail Operations Portal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#002855] rounded-full border border-blue-200 text-[10px] font-bold tracking-wider uppercase shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Unified Access</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden my-auto transition-all duration-300">
        
        {/* Header Banner */}
        <div className="bg-[#002855] text-white p-7 text-center relative border-b border-blue-900/50">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-blue-500/25 border border-white/10">
            <Fuel className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white bg-transparent p-0 m-0 tracking-tight">
            Franchisee &amp; Operations Portal
          </h1>
          <p className="text-xs text-blue-200/80 mt-1.5 font-medium max-w-xs mx-auto">
            Authorized Dealer &amp; Management Sign In
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
            {/* Username / CMS Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                CMS Code or Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter CMS Code or Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-blue-600 font-medium">Default: 123456</span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Security Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-medium">Remember this device</span>
              </label>

              <div className="text-slate-500 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted Session</span>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#002855] hover:bg-[#003875] active:bg-[#001f3f] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-950/20 flex items-center justify-center space-x-2 transition disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In &amp; Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Compliance Notice */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Single Secure Access:</span> Dealers will be redirected directly to their monthly self-assessment form; administrators to the operations HQ dashboard.
            </div>
          </div>
        </div>

        {/* Card Footer Support Info */}
        <div className="bg-slate-50/80 px-7 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Need assistance?</span>
          </div>
          <span className="font-semibold text-blue-700">Contact Assigned TSM / HQ</span>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="w-full max-w-md py-4 text-center text-xs text-slate-400">
        Nayara Energy Enterprise Operations &bull; Secure Authentication Portal
      </footer>

      {/* Mandatory First-Time Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#002855] text-white p-6 flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white bg-transparent p-0 m-0">Mandatory Security Update</h3>
                <p className="text-xs text-blue-200 mt-0.5">Replace Default Password to Proceed</p>
              </div>
            </div>

            <form onSubmit={handlePasswordReset} className="p-6 md:p-7 space-y-4">
              <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3.5 text-xs text-[#002855] space-y-1">
                <p className="font-bold">Welcome, {pendingUserData?.user?.fullName || pendingUserData?.user?.username}!</p>
                <p className="text-slate-600 leading-relaxed">For operational compliance, all dealers must replace the temporary default password (<code className="font-mono font-bold bg-blue-100 px-1 py-0.5 rounded text-blue-900">123456</code>) with a personal secure password before accessing the audit form.</p>
              </div>

              {resetError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center space-x-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password (Minimum 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Enter your new strong password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 bg-[#002855] hover:bg-blue-900 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {resetLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Secure Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set Password &amp; Open Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
