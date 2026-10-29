'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Database, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Compass,
  KeyRound,
  MessageSquare
} from 'lucide-react';
import { DealerTanksTab } from '@/components/dealers/DealerTanksTab';

interface DealerDetailPageProps {
  params: Promise<{ cms: string }>;
}

export default function DealerDetailPage({ params }: DealerDetailPageProps) {
  const { cms } = use(params);
  const router = useRouter();

  const [dealer, setDealer] = useState<any>(null);
  const [tanks, setTanks] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'tanks' | 'certs' | 'audits'>('profile');

  // Form edit state
  const [formData, setFormData] = useState({
    ro_name: '',
    dealer_name: '',
    dealer_mobile: '',
    zone: 'North',
    sales_area: '',
    latitude: 28.6139,
    longitude: 77.2090,
    address: '',
    brand_type: 'Nayara Retail',
    has_canopy: 'Yes',
    tsm_name: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/dealers/${encodeURIComponent(cms)}`, { headers });
      if (res.status === 401) {
        window.location.replace('/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDealer(data.dealer);
        setTanks(data.tanks || []);
        setAudits(data.audits || []);
        setCertificates(data.certificates || []);
        setFormData({
          ro_name: data.dealer.ro_name || '',
          dealer_name: data.dealer.dealer_name || '',
          dealer_mobile: data.dealer.dealer_mobile || '',
          zone: data.dealer.zone || 'North',
          sales_area: data.dealer.sales_area || '',
          latitude: data.dealer.latitude || 28.6139,
          longitude: data.dealer.longitude || 77.2090,
          address: data.dealer.address || '',
          brand_type: data.dealer.brand_type || 'Nayara Retail',
          has_canopy: data.dealer.has_canopy || 'Yes',
          tsm_name: data.dealer.tsm_name || ''
        });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to load dealer' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cms]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/dealers/${encodeURIComponent(cms)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Dealership master details updated successfully!' });
        loadData();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to update dealership' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-[#002855] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-700">Loading Dealership Profile &amp; Configurations...</p>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Retail Outlet Not Found</h2>
          <p className="text-xs text-slate-500">The CMS code <span className="font-mono font-bold">{cms}</span> could not be located.</p>
          <Link href="/dealers" className="inline-flex items-center px-4 py-2 bg-[#002855] text-white text-xs font-bold rounded-lg">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dealers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <Link
            href="/dealers"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Back to Dealers"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 m-0 p-0">{dealer.ro_name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                CMS: {dealer.cms_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dealer.zone} Zone &bull; {dealer.sales_area || 'Area Unassigned'} &bull; TSM: {dealer.tsm_name || 'Unassigned'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={async () => {
              const confirmReset = window.confirm(`Reset password for dealer account '${dealer.cms_code}' to '123456'?\n\nThey will be prompted to set a new password upon their next login.`);
              if (!confirmReset) return;

              try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('/api/auth/admin-reset-password', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ cmsCode: dealer.cms_code, customPassword: '123456' })
                });
                const data = await res.json();
                if (data.success) {
                  setFeedback({
                    type: 'success',
                    text: `Password reset to temporary: '123456'. Dealer must create new password on next login.`
                  });
                  if (data.whatsappUrl) {
                    const sendWhatsApp = window.confirm(`Password reset done!\n\nWould you like to open WhatsApp to send the temporary credentials to ${dealer.dealer_name} (${dealer.dealer_mobile})?`);
                    if (sendWhatsApp) {
                      window.open(data.whatsappUrl, '_blank');
                    }
                  }
                } else {
                  setFeedback({ type: 'error', text: data.error || 'Failed to reset password' });
                }
              } catch (e: any) {
                setFeedback({ type: 'error', text: e.message });
              }
            }}
            className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
            title="Reset dealer password to 123456"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-700" />
            <span>Reset Password</span>
          </button>

          <a
            href={`https://maps.google.com/?q=${dealer.latitude},${dealer.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold rounded-lg transition"
          >
            <Compass className="w-3.5 h-3.5 mr-1" />
            <span>Maps</span>
          </a>
          <Link
            href={`/audit-form?cmsCode=${encodeURIComponent(dealer.cms_code)}`}
            className="inline-flex items-center px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition"
          >
            <span>Enter Audit</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 flex-1">
        {feedback && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'border-[#002855] text-[#002855]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Outlet Profile &amp; Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tanks')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'tanks'
                ? 'border-[#002855] text-[#002855]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Fixed Tanks ({tanks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certs')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'certs'
                ? 'border-[#002855] text-[#002855]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approved Certificates ({certificates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audits')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'audits'
                ? 'border-[#002855] text-[#002855]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Assessment History ({audits.length})</span>
          </button>
        </div>

        {/* Tab 1: Editable Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Retail Outlet Master Parameters</h2>
              <p className="text-xs text-slate-400 mt-0.5">Modify core RO information, dealer mobile, GPS coordinates and sales area.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Retail Outlet Name</label>
                <input
                  type="text"
                  required
                  value={formData.ro_name}
                  onChange={(e) => setFormData({ ...formData, ro_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Franchisee Dealer Name</label>
                <input
                  type="text"
                  required
                  value={formData.dealer_name}
                  onChange={(e) => setFormData({ ...formData, dealer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered Contact Mobile (WhatsApp)</label>
                <input
                  type="text"
                  value={formData.dealer_mobile}
                  onChange={(e) => setFormData({ ...formData, dealer_mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Zone</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                >
                  <option value="North">North Zone</option>
                  <option value="West">West Zone</option>
                  <option value="South">South Zone</option>
                  <option value="Central">Central Zone</option>
                  <option value="East">East Zone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sales Area / Territory</label>
                <input
                  type="text"
                  value={formData.sales_area}
                  onChange={(e) => setFormData({ ...formData, sales_area: e.target.value })}
                  placeholder="e.g. Ludhiana, Punjab"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned TSM</label>
                <input
                  type="text"
                  value={formData.tsm_name}
                  onChange={(e) => setFormData({ ...formData, tsm_name: e.target.value })}
                  placeholder="TSM Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canopy Installed?</label>
                <select
                  value={formData.has_canopy}
                  onChange={(e) => setFormData({ ...formData, has_canopy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                >
                  <option value="Yes">Yes (Canopy Available)</option>
                  <option value="No">No (Non-Canopy)</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Postal Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Highway / Street address"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={async () => {
                  const confirmReset = window.confirm(`Reset password for dealer account '${dealer.cms_code}' to '123456'?\n\nThey will be prompted to set a new password upon their next login.`);
                  if (!confirmReset) return;

                  try {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const res = await fetch('/api/auth/admin-reset-password', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({ cmsCode: dealer.cms_code, customPassword: '123456' })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setFeedback({
                        type: 'success',
                        text: `Password reset to temporary: '123456'. Dealer must create new password on next login.`
                      });
                      if (data.whatsappUrl) {
                        const sendWhatsApp = window.confirm(`Password reset done!\n\nWould you like to open WhatsApp to send the temporary credentials to ${dealer.dealer_name} (${dealer.dealer_mobile})?`);
                        if (sendWhatsApp) {
                          window.open(data.whatsappUrl, '_blank');
                        }
                      }
                    } else {
                      setFeedback({ type: 'error', text: data.error || 'Failed to reset password' });
                    }
                  } catch (e: any) {
                    setFeedback({ type: 'error', text: e.message });
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Reset password to 123456 and require dealer to create new password on login"
              >
                <KeyRound className="w-4 h-4 mr-1.5 text-amber-700" />
                <span>Reset Dealer Password</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-5 py-2.5 bg-[#002855] hover:bg-[#001e40] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1.5" />
                <span>{saving ? 'Saving...' : 'Save Outlet Details'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Fixed Tanks Master */}
        {activeTab === 'tanks' && (
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <DealerTanksTab
              cmsCode={dealer.cms_code}
              tanks={tanks}
              onTanksUpdated={(updated) => setTanks(updated)}
            />
          </div>
        )}

        {/* Tab 3: Approved Certificates */}
        {activeTab === 'certs' && (
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Statutory Certificates &amp; Validity Records</h2>
              <p className="text-xs text-slate-400 mt-0.5">Approved compliance records reused across monthly audits.</p>
            </div>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{cert.cert_type}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Valid: {cert.valid_upto || 'Permanent'}
                      </span>
                    </div>
                    {cert.photo_url && (
                      <a
                        href={cert.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Uploaded Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
                No approved certificates stored yet for this outlet.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Historical Audits */}
        {activeTab === 'audits' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Assessment Submission History</h2>
              <p className="text-xs text-slate-400 mt-0.5">Every audit recorded for this retail outlet.</p>
            </div>

            {audits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase">Date</th>
                      <th className="px-4 py-3 font-semibold uppercase">Representative</th>
                      <th className="px-4 py-3 font-semibold uppercase">Score</th>
                      <th className="px-4 py-3 font-semibold uppercase">Status</th>
                      <th className="px-4 py-3 font-semibold uppercase text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {audits.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {a.rep_name || 'Dealer'} ({a.rep_mobile || '—'})
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {a.percentage}% ({a.grade})
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            a.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            a.approval_status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {a.approval_status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/audits/${a.id}`}
                            className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No past assessment records found for this outlet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
