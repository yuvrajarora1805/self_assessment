'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { 
  Menu, 
  Compass, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  List, 
  Moon, 
  Calendar,
  LogOut
} from 'lucide-react';

interface DealerLocation {
  id: string;
  cms_code: string;
  ro_name: string;
  dealer_name: string;
  dealer_mobile: string;
  zone: string;
  sales_area: string;
  latitude: number;
  longitude: number;
  address: string;
  brand_type: string;
  has_canopy: string;
  tsm_name: string;
  latest_audit_id: string | null;
  percentage: number | null;
  grade: string | null;
  audit_date: string | null;
  approval_status?: string | null;
  pending_reuploads?: number;
  resolved_reuploads?: number;
}

export default function GeospatialMapPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dealers, setDealers] = useState<DealerLocation[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'under_review' | 'pending'>('all');
  const [filterZone, setFilterZone] = useState<string>('All');
  const [selectedDealer, setSelectedDealer] = useState<DealerLocation | null>(null);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/dealers', { headers })
      .then(async r => {
        if (!r.ok) return { success: false, dealers: [] };
        return r.json();
      })
      .then(data => {
        if (data.success) {
          setDealers(data.dealers);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current!).setView([21.7679, 78.8718], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      const createCustomIcon = (status: 'approved' | 'under_review' | 'pending') => {
        const color = status === 'approved' ? '#10B981' : status === 'under_review' ? '#F59E0B' : '#EF4444';
        const svgIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" fill="${color}" stroke="#FFFFFF" stroke-width="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="3" fill="#FFFFFF"/>
          </svg>
        `;
        return L.divIcon({
          html: svgIcon,
          className: 'custom-pin-marker',
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -34]
        });
      };

      const getDealerStatus = (d: DealerLocation): 'approved' | 'under_review' | 'pending' => {
        if (!d.latest_audit_id) return 'pending';
        if (d.approval_status === 'APPROVED') return 'approved';
        return 'under_review'; // PENDING_APPROVAL or REVISION_REQUIRED
      };

      const filtered = dealers.filter(d => {
        const matchesZone = filterZone === 'All' || d.zone === filterZone;
        const status = getDealerStatus(d);
        const matchesStatus = 
          filterStatus === 'all' || 
          filterStatus === status;
        return matchesZone && matchesStatus;
      });

      const bounds: any[] = [];

      filtered.forEach(d => {
        if (!d.latitude || !d.longitude) return;
        const status = getDealerStatus(d);
        const marker = L.marker([d.latitude, d.longitude], {
          icon: createCustomIcon(status)
        }).addTo(map);

        marker.on('click', () => {
          setSelectedDealer(d);
        });

        bounds.push([d.latitude, d.longitude]);
        markersRef.current.push(marker);
      });

      if (bounds.length > 0 && filterZone !== 'All') {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    };

    initMap();
  }, [dealers, filterStatus, filterZone]);

  const approvedCount = dealers.filter(d => d.latest_audit_id && d.approval_status === 'APPROVED').length;
  const underReviewCount = dealers.filter(d => d.latest_audit_id && d.approval_status !== 'APPROVED').length;
  const pendingCount = dealers.filter(d => !d.latest_audit_id).length;

  return (
    <div className="h-screen w-screen flex bg-[#F4F6F9] text-slate-800 overflow-hidden">
      
      {/* 1. Permanent Unified Sidebar */}
      <Sidebar isOpen={sidebarOpen} dealerCount={dealers.length} />

      {/* 2. Main Geospatial Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Top Header App Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 bg-transparent p-0 m-0">Live Geospatial Audit Map</h1>
              <p className="text-xs text-slate-400">
                Visualizing network presence: <span className="text-emerald-600 font-bold">🟢 {approvedCount} Approved</span> &bull; <span className="text-amber-600 font-bold">🟠 {underReviewCount} Under Review</span> &bull; <span className="text-rose-600 font-bold">🔴 {pendingCount} Pending</span>
              </p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="flex items-center space-x-3">
            {/* Status Pills */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded transition ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                All ({dealers.length})
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-2.5 py-1 rounded transition ${filterStatus === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}
              >
                🟢 Approved
              </button>
              <button
                onClick={() => setFilterStatus('under_review')}
                className={`px-2.5 py-1 rounded transition ${filterStatus === 'under_review' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'}`}
              >
                🟠 Under Review
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded transition ${filterStatus === 'pending' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'}`}
              >
                🔴 Pending
              </button>
            </div>

            {/* Zone Selector */}
            <select
              value={filterZone}
              onChange={e => setFilterZone(e.target.value)}
              className="bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="All">All Zones</option>
              <option value="North">North Zone</option>
              <option value="West">West Zone</option>
              <option value="South">South Zone</option>
              <option value="East">East Zone</option>
              <option value="Central">Central Zone</option>
            </select>

            <Link
              href="/dealers"
              className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition"
            >
              <List className="w-3.5 h-3.5 mr-1" />
              Table View
            </Link>

            <button
              onClick={async () => {
                try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
                try { localStorage.removeItem('fuel_user'); } catch (e) {}
                window.location.replace('/login');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              title="Sign Out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Map Canvas */}
        <div className="flex-1 w-full h-full relative z-0">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Selected RO Info Card */}
          {selectedDealer && (
            <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 z-30 bg-white rounded-xl shadow-2xl border border-slate-200 p-5 animate-in fade-in slide-in-from-bottom-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                    !selectedDealer.latest_audit_id 
                      ? 'bg-rose-100 text-rose-800' 
                      : selectedDealer.approval_status === 'APPROVED' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {!selectedDealer.latest_audit_id 
                      ? '⚠️ Audit Pending' 
                      : selectedDealer.approval_status === 'APPROVED' 
                      ? '✓ Approved & Verified' 
                      : '⏳ Under Operations Review'}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 bg-transparent p-0 m-0">
                    {selectedDealer.ro_name}
                  </h3>
                  <div className="text-xs font-mono text-blue-700 font-semibold mt-0.5">
                    CMS: {selectedDealer.cms_code} &bull; {selectedDealer.zone} Zone
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDealer(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-3">
                <div><strong>Dealer:</strong> {selectedDealer.dealer_name} ({selectedDealer.dealer_mobile})</div>
                <div><strong>Location:</strong> {selectedDealer.sales_area}</div>
                <div><strong>Address:</strong> {selectedDealer.address}</div>
                <div><strong>TSM:</strong> {selectedDealer.tsm_name}</div>
              </div>

              {selectedDealer.latest_audit_id ? (
                <div className={`mt-3 rounded-lg p-2.5 flex items-center justify-between text-xs border ${
                  selectedDealer.approval_status === 'APPROVED' 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div>
                    <span className={`font-bold text-sm ${selectedDealer.approval_status === 'APPROVED' ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {selectedDealer.percentage}%
                    </span>
                    <span className={`ml-1 ${selectedDealer.approval_status === 'APPROVED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      ({selectedDealer.grade})
                    </span>
                    <div className={`text-[10px] ${selectedDealer.approval_status === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedDealer.approval_status === 'APPROVED' ? 'Approved & Confirmed' : 'Submitted — Under Review'}
                    </div>
                  </div>
                  <Link
                    href={`/audits/${selectedDealer.latest_audit_id}`}
                    className={`px-3 py-1.5 font-bold rounded shadow-xs text-white ${
                      selectedDealer.approval_status === 'APPROVED' 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {selectedDealer.approval_status === 'APPROVED' ? 'View Report' : 'Review & Approve'}
                  </Link>
                </div>
              ) : (
                <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <span className="text-rose-700 font-semibold">Audit is overdue!</span>
                  <Link
                    href={`/audit-form?cmsCode=${encodeURIComponent(selectedDealer.cms_code)}`}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-xs"
                  >
                    Conduct Audit Now
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
