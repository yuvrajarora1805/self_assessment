'use client';

import React, { useEffect, useState } from 'react';


import { 
  Building2, 
  MapPin, 
  Phone, 
  ClipboardCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  Calendar, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  User,
  Menu,
  ChevronRight,
  Maximize2,
  Compass,
  RefreshCw,
  Camera,
  Clock,
  Upload
} from 'lucide-react';

export default function DealerPortalPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('audit');
  const [loading, setLoading] = useState(true);

  // Live Geolocation State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Re-upload Requests & Monthly Cycle State
  const [pendingReuploads, setPendingReuploads] = useState<any[]>([]);
  const [completedAudit, setCompletedAudit] = useState<any | null>(null);
  const [cycleInfo, setCycleInfo] = useState<any | null>(null);
  const [activeUploadModal, setActiveUploadModal] = useState<any | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 1. Unified lifecycle initialization — enforces real session
  useEffect(() => {
    let active = true;

    const initPortal = async () => {
      try {
        let stored: string | null = null;

        // Primary: localStorage
        try {
          stored = localStorage.getItem('fuel_user');
        } catch (e) {}

        // Fallback: cookie (e.g., cross-tab or proxy scenario)
        if (!stored) {
          const match = document.cookie.match(/fuel_user=([^;]+)/);
          if (match) {
            try { stored = decodeURIComponent(match[1]); } catch (e) {}
          }
        }

        // If no session at all — redirect to login
        if (!stored) {
          if (active) window.location.replace('/login');
          return;
        }

        let currentUser: any = null;
        try {
          currentUser = JSON.parse(stored);
        } catch (err) {
          console.error('Session parse error — clearing corrupt session:', err);
        }

        // Corrupt or invalid session — clear and redirect
        if (!currentUser || !currentUser.username || !currentUser.role) {
          try { localStorage.removeItem('fuel_user'); } catch (e) {}
          document.cookie = 'fuel_user=; path=/; max-age=0;';
          if (active) window.location.replace('/login');
          return;
        }

        if (active) {
          setUser(currentUser);
          setLoading(false);

          // Fetch pending re-upload requests & completed audit status from monthly profile
          fetch(`/api/dealer/monthly-profile?cmsCode=${encodeURIComponent(currentUser.username)}`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.profile) {
                if (data.profile.pendingReuploadRequests) {
                  setPendingReuploads(data.profile.pendingReuploadRequests);
                }
                if (data.profile.completedAudit) {
                  setCompletedAudit(data.profile.completedAudit);
                }
                if (data.profile.cycleInfo) {
                  setCycleInfo(data.profile.cycleInfo);
                }
              }
            })
            .catch(err => console.warn('Could not check pending re-upload requests:', err));
        }

        // 2. Automatically initiate GPS verification
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (!active) return;
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const acc = Math.round(pos.coords.accuracy);

              setGpsCoords(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
              setGpsAccuracy(acc);

              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await res.json();
                if (!active) return;
                const addr = data.display_name || 'Coordinates verified on map.';
                const pin = data.address?.postcode ? ` (PIN: ${data.address.postcode})` : '';
                setGpsAddress(addr + pin);
              } catch {
                if (active) setGpsAddress('Physical street lookup unavailable; GPS coordinates locked.');
              }
            },
            (err) => {
              if (!active) return;
              if (err.code === 1) {
                setGpsError('Permission denied. Tap the lock/tune icon (🔒) in your browser address bar to allow Location access.');
              } else if (err.code === 2) {
                setGpsError('Position unavailable. Ensure your device GPS is switched on.');
              } else {
                setGpsError('GPS request timed out. Please retry.');
              }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        }
      } catch (err) {
        console.error('Portal init error:', err);
        if (active) setLoading(false);
      }
    };

    initPortal();

    return () => {
      active = false;
    };
  }, []);

  // Manual GPS re-trigger
  const acquireDeviceGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setGpsCoords(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setGpsAccuracy(acc);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          const addr = data.display_name || 'Coordinates verified on map.';
          const pin = data.address?.postcode ? ` (PIN: ${data.address.postcode})` : '';
          setGpsAddress(addr + pin);
        } catch {
          setGpsAddress('Physical street lookup unavailable; GPS coordinates locked.');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Permission blocked by browser. Tap the lock/tune icon (🔒) in your browser address bar to allow Location access.');
        } else if (err.code === 2) {
          setGpsError('Position unavailable. Ensure your device GPS is switched on.');
        } else {
          setGpsError('GPS request timed out. Please retry.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };


  const handleReplacementCapture = async (reqItem: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const maxW = 960;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Watermark Banner
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          const bannerHeight = 65;
          ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          const now = new Date().toLocaleString('en-IN');
          ctx.fillText(`📍 GPS: ${gpsCoords || 'GPS STAMPED'} | ⏰ ${now}`, 15, canvas.height - 40);

          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#93c5fd';
          const addrText = (gpsAddress || ro.ro_name).substring(0, 110);
          ctx.fillText(`REPLACEMENT PHOTO: ${reqItem.photo_title} • ${addrText}`, 15, canvas.height - 18);

          const watermarked = canvas.toDataURL('image/jpeg', 0.70);

          // Submit replacement to API
          const res = await fetch(`/api/audits/${reqItem.audit_id}/resubmit-photo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: reqItem.id,
              targetId: reqItem.target_id,
              category: reqItem.category,
              newPhotoData: watermarked
            })
          });

          const data = await res.json();
          if (data.success) {
            alert(`✅ Replacement photo for "${reqItem.photo_title}" uploaded successfully!`);
            // Remove from active pending list
            setPendingReuploads(prev => prev.filter(p => p.id !== reqItem.id));
            setActiveUploadModal(null);
          } else {
            alert('Upload failed: ' + data.error);
          }
          setUploadingPhoto(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Error processing photo: ' + err.message);
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('fuel_user');
      document.cookie = 'fuel_user=; path=/; max-age=0;';
    } catch (e) {}
    window.location.replace('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-700">Verifying session...</p>
          <p className="text-xs text-slate-400 mt-1">Checking your dealer credentials. Redirecting to login if not authenticated.</p>
        </div>
      </div>
    );
  }

  const ro = user.ro || {
    ro_name: 'RO OUTLET',
    cms_code: user.username,
    dealer_name: user.fullName,
    dealer_mobile: '9876543210',
    zone: user.zone || 'North',
    sales_area: 'Retail Area',
    address: 'Physical Address Stamped',
    brand_type: 'Nayara Retail',
    has_canopy: 'Yes',
    tsm_name: 'Assigned TSM'
  };

  const formUrl = `/audit-form?cmsCode=${encodeURIComponent(ro.cms_code)}&roName=${encodeURIComponent(ro.ro_name)}&tsm=${encodeURIComponent(ro.tsm_name || '')}&brand=${encodeURIComponent(ro.brand_type || '')}&canopy=${encodeURIComponent(ro.has_canopy || 'Yes')}`;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col text-slate-800">
      
      {/* 1. Mobile-Optimized Header Navigation Bar */}
      <header className="bg-[#002855] text-white px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Outlet Title and Badges */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold text-white bg-transparent p-0 m-0 leading-tight truncate">
                {ro.ro_name}
              </h1>
              <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-blue-200 mt-0.5">
                <span className="font-mono bg-blue-900/80 px-1.5 py-0.2 rounded text-white font-bold">{ro.cms_code}</span>
                <span>&bull;</span>
                <span className="truncate">{ro.zone} Zone</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {cycleInfo && (
              <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                completedAudit?.approval_status === 'APPROVED'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : cycleInfo.isOverdue
                  ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {completedAudit?.approval_status === 'APPROVED'
                    ? `${cycleInfo.monthName} Certified`
                    : cycleInfo.badgeText}
                </span>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] text-emerald-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Verified Dealer</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-900/70 hover:bg-blue-800 text-xs text-blue-200 hover:text-white border border-blue-400/30 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Portal Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        
        {/* Alert: Action Required for Image Re-uploads */}
        {pendingReuploads.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-950 m-0 p-0">
                    Action Required: {pendingReuploads.length} Photo{pendingReuploads.length > 1 ? 's' : ''} Require Re-upload
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Operations HQ has requested clear replacement photos before your monthly performance increment can be approved.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-200 text-amber-900 border border-amber-300 self-start sm:self-center">
                Revision Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {pendingReuploads.map((req) => (
                <div key={req.id} className="bg-white border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between shadow-xs space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {req.photo_title}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {req.category}
                      </span>
                    </div>

                    <div className="mt-2 p-2 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 font-medium">
                      <strong>Admin Note:</strong> &ldquo;{req.reason}&rdquo;
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <label className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Processing...' : 'Capture Replacement Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={uploadingPhoto}
                        className="hidden"
                        onChange={(e) => handleReplacementCapture(req, e)}
                      />
                    </label>

                    {req.current_photo_url && (
                      <button
                        type="button"
                        onClick={() => setActiveUploadModal(req)}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        title="View previously uploaded image"
                      >
                        View Original
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Tabs (Mobile-Friendly Pill Bar) */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-center transition ${
              activeTab === 'overview'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            RO Profile & Geofence
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-center transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'audit'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {completedAudit ? (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {completedAudit.approval_status === 'APPROVED' ? 'Approved Assessment' :
                   completedAudit.approval_status === 'REVISION_REQUIRED' ? 'Revision Required' :
                   'Assessment Under Review'}
                </span>
              </>
            ) : (
              <>
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Fill Audit Form</span>
              </>
            )}
          </button>
        </div>

        {activeTab === 'overview' ? (
          /* Overview View */
          <div className="space-y-4 sm:space-y-6">
            
            {/* Quick Action Hero Banner */}
            <div className={`text-white rounded-2xl p-5 sm:p-7 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 ${
              completedAudit?.approval_status === 'APPROVED' 
                ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-[#002855]' 
                : completedAudit?.approval_status === 'REVISION_REQUIRED'
                ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-[#002855]'
                : completedAudit
                ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-[#002855]'
                : 'bg-gradient-to-r from-[#002855] via-blue-900 to-blue-800'
            }`}>
              <div className="space-y-1.5">
                <div className="inline-block bg-white/20 border border-white/30 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {completedAudit?.approval_status === 'APPROVED' ? 'Assessment Approved' :
                   completedAudit?.approval_status === 'REVISION_REQUIRED' ? 'Action Required: Re-upload Images' :
                   completedAudit ? 'Form Submitted • Under Review' :
                   'Mandatory Self-Assessment'}
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-white bg-transparent p-0 m-0 leading-snug">
                  {completedAudit?.approval_status === 'APPROVED' ? 'Monthly Increment Verified' :
                   completedAudit?.approval_status === 'REVISION_REQUIRED' ? 'Photo Revision Required by Operations' :
                   completedAudit ? 'Assessment Submitted & Awaiting Approval' :
                   'Franchisee Inspection Cycle'}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                  {completedAudit?.approval_status === 'APPROVED' ? `Your self-assessment has been approved by ${completedAudit.approved_by || 'HQ'} with ${completedAudit.percentage}% score. Performance bonus confirmed.` :
                   completedAudit?.approval_status === 'REVISION_REQUIRED' ? 'Operations HQ has reviewed your submission. Please upload the requested replacement photos below to complete verification.' :
                   completedAudit ? `Submitted on ${new Date(completedAudit.created_at).toLocaleDateString('en-IN')}. Score: ${completedAudit.percentage}% (${completedAudit.grade}). Operations sign-off is in progress.` :
                   "Record your station's shift staffing, 12-16 camera evidence photos, automated tank dips, and statutory compliances."}
                </p>
              </div>

              {completedAudit ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <a
                    href={`/audits/${completedAudit.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-[#002855] rounded-xl text-xs sm:text-sm font-extrabold shadow-lg flex items-center justify-center space-x-2 shrink-0 transition"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                    <span>View Submitted Report</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                  {pendingReuploads.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg flex items-center justify-center space-x-1.5 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{pendingReuploads.length} Photo{pendingReuploads.length > 1 ? 's' : ''} to Re-upload</span>
                    </button>
                  )}
                </div>
              ) : (
                <a
                  href={formUrl}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 shrink-0 transition"
                >
                  <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Start Audit Form</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              )}
            </div>

            {/* Live GPS Geofence Verification Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${gpsCoords ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent p-0 m-0">
                      Live Physical Geofence & Location Stamp
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Mandatory on-site verification before audit submission
                    </p>
                  </div>
                </div>

                <button
                  onClick={acquireDeviceGPS}
                  disabled={gpsLoading}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Acquiring GPS...' : 'Refresh Location'}</span>
                </button>
              </div>

              <div className="mt-3 text-xs">
                {gpsCoords ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>📍 GPS Locked: {gpsCoords}</span>
                      <span className="text-[11px] font-normal text-emerald-700">(Accuracy: &plusmn;{gpsAccuracy}m)</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      {gpsAddress || 'Physical address verified.'}
                    </div>
                  </div>
                ) : gpsError ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>GPS Acquisition Failed</span>
                    </div>
                    <div className="text-[11px] text-rose-700">{gpsError}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600 text-center">
                    ⏳ Requesting device location permission...
                  </div>
                )}
              </div>
            </div>

            {/* Dealership Details Responsive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Outlet Meta Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent p-0 m-0">Outlet Master Information</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Retail Outlet:</span>
                    <strong className="text-slate-900 text-right">{ro.ro_name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">CMS Code:</span>
                    <strong className="text-blue-700 font-mono font-bold">{ro.cms_code}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Territory:</span>
                    <strong className="text-slate-900 text-right">{ro.zone} Zone ({ro.sales_area})</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Brand Type:</span>
                    <strong className="text-slate-900">{ro.brand_type || 'Nayara Retail'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Canopy:</span>
                    <strong className="text-slate-900">{ro.has_canopy || 'Yes'}</strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-50 gap-0.5">
                    <span className="text-slate-400 font-medium">Address:</span>
                    <span className="text-slate-700 sm:text-right text-[11px] font-medium">{ro.address || 'Address registered on file'}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Territory Team */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent p-0 m-0">Dealer & Territory Team</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Dealer Name:</span>
                    <strong className="text-slate-900">{ro.dealer_name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Dealer Mobile:</span>
                    <strong className="text-slate-900 font-mono">{ro.dealer_mobile}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Assigned TSM:</span>
                    <strong className="text-blue-700">{ro.tsm_name || 'Rajesh Kumar'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Dealership Status:</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">Active</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">Database Persistence:</span>
                    <span className="text-blue-700 font-semibold text-[11px]">SQLite Synced</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : completedAudit ? (
          /* Form Already Submitted — Under Review & Re-upload Dedicated View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-8 space-y-6">
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              completedAudit.approval_status === 'APPROVED'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : completedAudit.approval_status === 'REVISION_REQUIRED'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}>
              <div className="flex items-center space-x-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                  completedAudit.approval_status === 'APPROVED' ? 'bg-emerald-600' :
                  completedAudit.approval_status === 'REVISION_REQUIRED' ? 'bg-amber-600' : 'bg-blue-600'
                }`}>
                  {completedAudit.approval_status === 'APPROVED' ? <CheckCircle2 className="w-6 h-6" /> :
                   completedAudit.approval_status === 'REVISION_REQUIRED' ? <Camera className="w-6 h-6" /> :
                   <ClipboardCheck className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${
                      completedAudit.approval_status === 'APPROVED' ? 'bg-emerald-600' :
                      completedAudit.approval_status === 'REVISION_REQUIRED' ? 'bg-amber-600' : 'bg-blue-600'
                    }`}>
                      {completedAudit.approval_status === 'APPROVED' ? 'Approved' :
                       completedAudit.approval_status === 'REVISION_REQUIRED' ? 'Action Required: Re-upload Images' :
                       'Submitted & Under Review'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Cycle: {completedAudit.audit_month || 'Current Month'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    {completedAudit.approval_status === 'APPROVED'
                      ? 'Self-Assessment Approved — Monthly Bonus Confirmed'
                      : completedAudit.approval_status === 'REVISION_REQUIRED'
                      ? 'Image Re-upload Requested by Operations HQ'
                      : 'Self-Assessment Form Submitted — Under Admin Review'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Total Score: <strong>{completedAudit.total_score}</strong> ({completedAudit.percentage}%) &bull; Rating: <strong>{completedAudit.grade}</strong> &bull; Submitted on {new Date(completedAudit.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <a
                  href={`/audits/${completedAudit.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                  <span>View Submitted Report</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            </div>

            {/* If Re-uploads are required, show the dedicated re-upload panel */}
            {pendingReuploads.length > 0 ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Replacement Photos Required ({pendingReuploads.length})</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    You do not need to refill the whole form. Only capture and submit the specific photos requested below:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReuploads.map((req) => (
                    <div key={req.id} className="border-2 border-amber-300 bg-amber-50/40 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{req.photo_title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded uppercase">{req.category}</span>
                        </div>
                        <div className="mt-2 p-2.5 bg-white border border-amber-200 rounded-lg text-xs text-amber-950 font-medium">
                          <strong>Reason from Reviewer:</strong> &ldquo;{req.reason}&rdquo;
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <label className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition">
                          <Camera className="w-4 h-4" />
                          <span>{uploadingPhoto ? 'Uploading replacement...' : 'Capture & Upload Replacement Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={uploadingPhoto}
                            className="hidden"
                            onChange={(e) => handleReplacementCapture(req, e)}
                          />
                        </label>
                        {req.current_photo_url && (
                          <button
                            type="button"
                            onClick={() => setActiveUploadModal(req)}
                            className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            View Original
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">All Evidence Complete</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your monthly assessment is completely submitted with zero pending re-upload requests. You can view or download the report above.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Active Detailed Assessment Form (Native Full-Width Experience) */
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col -mx-3 sm:-mx-6 md:-mx-8" style={{minHeight: 'calc(100vh - 80px)'}}>
            {/* Native Top Action Bar */}
            <div className="bg-gradient-to-r from-[#002855] to-blue-900 px-4 py-3 flex items-center justify-between text-white shadow-sm shrink-0">
              <div className="flex items-center space-x-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">Official Self-Assessment Form</span>
                <span className="text-blue-300 font-mono text-[11px] bg-blue-950/60 px-2 py-0.5 rounded">CMS: {ro.cms_code}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-blue-100 font-semibold transition"
                >
                  &larr; Back
                </button>
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-blue-100 font-semibold transition"
                >
                  <Maximize2 className="w-3 h-3 mr-1" />
                  <span>New Tab</span>
                </a>
              </div>
            </div>

            {/* Primary CTA — Always Reliable Direct Link */}
            <div className="shrink-0 bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs">
                <p className="font-bold text-emerald-900">✅ Your form is ready — pre-filled with your dealer credentials</p>
                <p className="text-emerald-700 mt-0.5">CMS: <strong>{ro.cms_code}</strong> &bull; {ro.ro_name} &bull; TSM: {ro.tsm_name || 'Assigned TSM'}</p>
              </div>
              <a
                href={formUrl}
                className="shrink-0 inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/30 transition space-x-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Open Audit Form</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Embedded Form — Fallback with fixed height */}
            <iframe
              src={formUrl}
              allow="geolocation; camera; microphone; clipboard-write"
              title={`Franchisee Self Assessment - ${ro.ro_name}`}
              style={{
                width: '100%',
                height: 'calc(100vh - 160px)',
                minHeight: '600px',
                border: 'none',
                display: 'block',
                flexGrow: 1
              }}
            />
          </div>
        )}

      </main>

      {/* Modal to view original image when dealer is replacing */}
      {activeUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#002855] text-white p-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white m-0">{activeUploadModal.photo_title}</h4>
              <button
                type="button"
                onClick={() => setActiveUploadModal(null)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={activeUploadModal.current_photo_url}
                alt={activeUploadModal.photo_title}
                className="max-h-[55vh] w-auto max-w-full object-contain rounded"
              />
            </div>
            <div className="p-4 bg-amber-50 border-t border-amber-200">
              <div className="text-xs font-bold text-amber-900">Admin Remark:</div>
              <p className="text-xs text-amber-800 mt-0.5">&ldquo;{activeUploadModal.reason}&rdquo;</p>
            </div>
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveUploadModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
