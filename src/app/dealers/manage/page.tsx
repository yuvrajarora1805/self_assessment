'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  Edit3, 
  Database, 
  ShieldCheck, 
  Compass, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2, 
  Phone,
  Layers,
  MapPin,
  Menu,
  KeyRound
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function OutletMasterSetupPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/dealers')
      .then(res => res.json())
      .then(data => {
        if (data.dealers) setDealers(data.dealers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = dealers.filter(d => {
    const matchesSearch = 
      (d.ro_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.cms_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.dealer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.sales_area || '').toLowerCase().includes(search.toLowerCase());
    const matchesZone = selectedZone === 'ALL' || d.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-800">
      <Sidebar isOpen={sidebarOpen} dealerCount={dealers.length} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 m-0 p-0">Outlet Master Configuration Hub</h1>
              <p className="text-xs text-slate-400">Select any retail outlet to edit franchisee contacts, GPS coordinates, safe capacities, and master tanks</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dealers/new"
              className="inline-flex items-center px-3.5 py-1.5 bg-[#002855] hover:bg-[#001e40] text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Add New RO
            </Link>
          </div>
        </header>

        {/* Workspace */}
        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by RO Name, CMS Code, Contact, or Sales Area..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Zone:</span>
              <select
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Operating Zones</option>
                <option value="North">North Zone</option>
                <option value="West">West Zone</option>
                <option value="South">South Zone</option>
                <option value="Central">Central Zone</option>
                <option value="East">East Zone</option>
              </select>
            </div>
          </div>

          {/* Outlets Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-bold space-y-2">
              <div className="w-8 h-8 border-4 border-[#002855] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading Dealership Registry...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(d => (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          CMS: {d.cms_code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">{d.ro_name}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                        {d.zone}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-1">
                      <div className="flex items-center text-slate-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                        <span>{d.dealer_name}</span>
                      </div>
                      
                      {/* Interactive Mobile Number with Quick Edit */}
                      <div className="flex items-center justify-between group/phone py-0.5">
                        <div className="flex items-center text-slate-600">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                          <span className={d.dealer_mobile && d.dealer_mobile !== 'Not Specified' ? 'font-mono font-bold text-slate-800' : 'text-slate-400 italic'}>
                            {d.dealer_mobile || 'Not Specified'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const newPhone = window.prompt(`Update WhatsApp Mobile Number for ${d.ro_name} (CMS: ${d.cms_code}):`, d.dealer_mobile === 'Not Specified' ? '' : d.dealer_mobile || '');
                            if (newPhone !== null && newPhone.trim() !== (d.dealer_mobile || '')) {
                              try {
                                const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
                                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                if (token) headers['Authorization'] = `Bearer ${token}`;
                                const res = await fetch(`/api/dealers/${encodeURIComponent(d.cms_code)}`, {
                                  method: 'PUT',
                                  headers,
                                  body: JSON.stringify({ dealer_mobile: newPhone.trim() })
                                });
                                const resData = await res.json();
                                if (resData.success) {
                                  setDealers(prev => prev.map(item => item.id === d.id ? { ...item, dealer_mobile: newPhone.trim() } : item));
                                } else {
                                  alert('Failed to update phone: ' + resData.error);
                                }
                              } catch (err: any) {
                                alert('Error updating phone: ' + err.message);
                              }
                            }
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                          title="Quick edit phone number"
                        >
                          Edit Phone
                        </button>
                      </div>

                      <div className="flex items-center text-slate-500">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                        <span>{d.sales_area || 'Area Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmReset = window.confirm(`Reset password for dealer '${d.ro_name}' (CMS: ${d.cms_code}) to '123456'?\n\nDealer will be required to set a new password on their next login.`);
                        if (!confirmReset) return;

                        try {
                          const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
                          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                          if (token) headers['Authorization'] = `Bearer ${token}`;

                          const res = await fetch('/api/auth/admin-reset-password', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ cmsCode: d.cms_code, customPassword: '123456' })
                          });
                          const resData = await res.json();
                          if (resData.success) {
                            if (resData.whatsappUrl) {
                              const openWA = window.confirm(`✅ Password reset to '123456' successfully!\n\nOpen WhatsApp to notify ${d.dealer_name} (${d.dealer_mobile})?`);
                              if (openWA) window.open(resData.whatsappUrl, '_blank');
                            } else {
                              alert(`✅ Password reset to '123456' successfully!`);
                            }
                          } else {
                            alert('Failed to reset password: ' + resData.error);
                          }
                        } catch (err: any) {
                          alert('Error resetting password: ' + err.message);
                        }
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg transition cursor-pointer"
                      title="Reset dealer password to 123456"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-700" />
                      <span>Reset Pass</span>
                    </button>

                    <Link
                      href={`/dealers/${encodeURIComponent(d.cms_code)}`}
                      className="inline-flex items-center px-3 py-1.5 bg-[#002855] hover:bg-[#001e40] text-white text-xs font-bold rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      <span>Edit Master</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
