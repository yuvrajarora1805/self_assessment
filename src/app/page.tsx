'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Compass, 
  ClipboardCheck, 
  FileText, 
  Users, 
  Layers, 
  ShieldCheck, 
  Database, 
  Settings, 
  Moon, 
  LogOut, 
  Menu,
  ChevronRight,
  TrendingUp,
  Award,
  Search,
  ExternalLink
} from 'lucide-react';

interface ZoneStat {
  zone: string;
  total_ro: number;
  audited_ro: number;
  avg_score: number | null;
}

interface ActivityItem {
  id: string;
  type: 'audit' | 'warning' | 'new_ro' | 'pending';
  title: string;
  subtitle: string;
  time: string;
  badge: string;
  badgeColor: string;
}

import ActiveDraftsCard, { ActiveDraftItem } from '@/components/dashboard/ActiveDraftsCard';
import ReuploadAlertsCard, { ReuploadAlertItem } from '@/components/dashboard/ReuploadAlertsCard';

export default function AttendProDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalDealers, setTotalDealers] = useState(0);
  const [auditedCount, setAuditedCount] = useState(0);
  const [avgCompliance, setAvgCompliance] = useState('0.0');
  const [zoneStats, setZoneStats] = useState<ZoneStat[]>([]);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [activeDrafts, setActiveDrafts] = useState<ActiveDraftItem[]>([]);
  const [reuploadAlerts, setReuploadAlerts] = useState<ReuploadAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  let intervalId: NodeJS.Timeout | null = null;

  const handleUnauthorized = async () => {
    if (intervalId) clearInterval(intervalId);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    try {
      document.cookie = 'session_token=; path=/; max-age=0';
      document.cookie = 'fuel_role=; path=/; max-age=0';
      document.cookie = 'fuel_user=; path=/; max-age=0';
      localStorage.removeItem('fuel_user');
      localStorage.removeItem('session_token');
    } catch (e) {}
    window.location.replace('/login?expired=1');
  };

  const fetchStats = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    Promise.all([
      fetch('/api/dealers', { headers }).then(async r => {
        if (r.status === 401 || r.status === 403) {
          handleUnauthorized();
          return { success: false, dealers: [] };
        }
        return r.json();
      }),
      fetch('/api/stats', { headers }).then(async r => {
        if (r.status === 401 || r.status === 403) {
          handleUnauthorized();
          return { success: false };
        }
        return r.json();
      })
    ]).then(([dealersData, statsData]) => {
      if (dealersData?.success) {
        setTotalDealers(dealersData.dealers.length);
        const audited = dealersData.dealers.filter((d: any) => d.latest_audit_id).length;
        setAuditedCount(audited);
        if (dealersData.zoneStats) setZoneStats(dealersData.zoneStats);
      }
      if (statsData?.success) {
        setAvgCompliance(statsData.stats.averageCompliance);
        setRecentAudits(statsData.stats.recentAudits || []);
        setActiveDrafts(statsData.stats.activeDrafts || []);
        setReuploadAlerts(statsData.stats.pendingReuploadReviews || []);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }));
    fetchStats();
    // Live poll active drafts every 5 seconds
    intervalId = setInterval(fetchStats, 5000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const pendingCount = Math.max(0, totalDealers - auditedCount);

  // Generate activities list
  const activities: ActivityItem[] = [
    {
      id: 'act-1',
      type: 'audit',
      title: 'HIGHWAY SERVICE STATION',
      subtitle: 'Vikram Singh submitted audit report • Score: 94% (VERY GOOD)',
      time: '06:42 PM',
      badge: 'audit',
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'act-2',
      type: 'warning',
      title: 'Calibration Flag: HSD - TANK-1',
      subtitle: 'Delta: 3.2 mm flagged non-compliant at Gurugram outlet',
      time: '06:40 PM',
      badge: 'warning',
      badgeColor: 'bg-rose-100 text-rose-700'
    },
    {
      id: 'act-3',
      type: 'new_ro',
      title: 'New RO Registered: WESTERN PETRO EXPRESS',
      subtitle: 'Paresh Patel registered in West Zone (SG Highway, Ahmedabad)',
      time: '05:15 PM',
      badge: 'dealer',
      badgeColor: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 'act-4',
      type: 'pending',
      title: 'Audit Cycle Reminder: Deccan Energy Station',
      subtitle: 'Bengaluru South dealer scheduled for statutory review',
      time: '04:30 PM',
      badge: 'notice',
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'act-5',
      type: 'audit',
      title: 'Geofence Verification Successful',
      subtitle: 'GPS coordinates physically matched for 10842',
      time: '02:15 PM',
      badge: 'gps',
      badgeColor: 'bg-indigo-100 text-indigo-700'
    }
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    try {
      localStorage.removeItem('fuel_user');
    } catch (e) {}
    window.location.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex text-slate-800">
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} dealerCount={totalDealers} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header App Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 bg-transparent p-0 m-0">Executive Overview</h1>
              <p className="text-xs text-slate-400">Real-time RO network compliance, audit progression, and field metrics</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Dark Mode Pill */}
            <button className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition">
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            {/* Date Pill */}
            {mounted && currentDate && (
              <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentDate}</span>
              </div>
            )}

            {/* Live Connected Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Connected</span>
            </div>

            {/* Role Pill */}
            <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-blue-200 bg-blue-50/50 text-[11px] sm:text-xs text-blue-700 font-bold uppercase tracking-wider">
              ADMIN
            </div>

            {/* Top Logout Button - High Visibility with red accent */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              title="Sign Out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="p-6 md:p-8 space-y-6">
          
          {/* Top 4 Colored Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Registered Outlets (Blue Top Border) */}
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-blue-500 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Retail Outlets</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900">{totalDealers}</div>
                <div className="text-xs text-slate-400 mt-0.5">{totalDealers} total registered ROs</div>
              </div>
            </div>

            {/* Card 2: Audits Completed (Green Top Border) */}
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Audits Completed</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-emerald-600">{auditedCount}</div>
                <div className="text-xs text-slate-400 mt-0.5">{auditedCount} verified, {pendingCount} pending</div>
              </div>
            </div>

            {/* Card 3: Avg Compliance Score (Amber Top Border) */}
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-amber-500 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg Network Score</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900">{avgCompliance}%</div>
                <div className="text-xs text-slate-400 mt-0.5">Cycle 10/2026 rating</div>
              </div>
            </div>

            {/* Card 4: Action Required (Rose Top Border) */}
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-rose-500 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending / Overdue</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-rose-600">{pendingCount}</div>
                <div className="text-xs text-slate-400 mt-0.5">{pendingCount} outlets require audit</div>
              </div>
            </div>
          </div>

          {/* Action Alerts: Dealer Re-uploaded Photos awaiting Admin Sign-off */}
          <ReuploadAlertsCard alerts={reuploadAlerts} onRefresh={fetchStats} />

          {/* Real-Time Active Dealer Assessments In Progress (Drafts) */}
          <ActiveDraftsCard drafts={activeDrafts} onRefresh={fetchStats} />

          {/* 2-Column Split: Zone Breakdown vs Recent System Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Box: Zone Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900 bg-transparent p-0 m-0">Zone Breakdown</h2>
                  <Link href="/dealers" className="text-xs text-blue-600 font-semibold hover:underline">
                    View Registry &raquo;
                  </Link>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'NORTH ZONE', count: 2, audited: 1 },
                    { name: 'WEST ZONE', count: 2, audited: 0 },
                    { name: 'SOUTH ZONE', count: 2, audited: 0 },
                    { name: 'CENTRAL ZONE', count: 1, audited: 0 },
                    { name: 'EAST ZONE', count: 1, audited: 0 }
                  ].map(z => {
                    const zData = zoneStats.find(item => item.zone.toUpperCase().includes(z.name.split(' ')[0])) || { total_ro: z.count, audited_ro: z.audited };
                    return (
                      <div key={z.name} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{z.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-slate-400">
                            {zData.audited_ro} audited
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            {zData.total_ro} active
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Need geographic visualization?</span>
                <Link
                  href="/map"
                  className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <Compass className="w-3.5 h-3.5 mr-1" />
                  Open Live Map View
                </Link>
              </div>
            </div>

            {/* Right Box: Recent System Activity Stream */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 bg-transparent p-0 m-0">Recent System Activity</h2>
                <span className="text-xs text-slate-400">Auto-updating</span>
              </div>

              <div className="space-y-4">
                {activities.map(act => (
                  <div key={act.id} className="flex items-start justify-between space-x-3 py-1">
                    <div className="flex items-start space-x-2.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase mt-0.5 ${act.badgeColor}`}>
                        {act.badge}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 leading-tight">{act.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{act.subtitle}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0">
                      {act.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Access Action Bar */}
          <div className="bg-gradient-to-r from-[#002855] to-blue-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold bg-transparent p-0 m-0 text-white">Perform Retail Outlet Self-Assessment</h3>
              <p className="text-xs text-blue-200 mt-1">Connect directly to camera capture, tank dip validation, and statutory compliance checklist</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/dealers"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
              >
                View Dealer Roster
              </Link>
              <Link
                href="/dealers"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                + Start Assessment Now
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
