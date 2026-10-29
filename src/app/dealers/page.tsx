'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  Map as MapIcon,
  PlusCircle,
  Menu,
  Image as ImageIcon,
  LogOut,
  X
} from 'lucide-react';
import { DealerItem, DealerTable } from '@/components/dealers/DealerTable';
import { DealerStatsHeader } from '@/components/dealers/DealerStatsHeader';
import { DealerFilterBar } from '@/components/dealers/DealerFilterBar';
import { DealerDrawerModal } from '@/components/dealers/DealerDrawerModal';
import { AddDealerModal } from '@/components/dealers/AddDealerModal';

interface ZoneStat {
  zone: string;
  total_ro: number;
  audited_ro: number;
  avg_score: number | null;
}

export default function DealersManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dealers, setDealers] = useState<DealerItem[]>([]);
  const [zoneStats, setZoneStats] = useState<ZoneStat[]>([]);
  const [selectedZone, setSelectedZone] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // RO Detail & History Drawer State
  const [selectedDealerForDetail, setSelectedDealerForDetail] = useState<DealerItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'submissions' | 'documents' | 'profile'>('submissions');
  const [dealerSubmissions, setDealerSubmissions] = useState<any[]>([]);
  const [dealerProfileData, setDealerProfileData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ title: string; url: string } | null>(null);

  const [formData, setFormData] = useState({
    cmsCode: '',
    roName: '',
    dealerName: '',
    dealerMobile: '',
    zone: 'North',
    salesArea: '',
    latitude: '28.6139',
    longitude: '77.2090',
    address: '',
    brandType: 'Nayara Retail',
    hasCanopy: 'Yes',
    tsmName: ''
  });

  const loadDealers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dealers?zone=${selectedZone}&status=${statusFilter}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setDealers(data.dealers);
        if (data.zoneStats) setZoneStats(data.zoneStats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, [selectedZone, statusFilter, search]);

  const openDealerDetails = async (dealer: DealerItem, defaultTab: 'submissions' | 'documents' | 'profile' = 'submissions') => {
    setSelectedDealerForDetail(dealer);
    setDetailTab(defaultTab);
    setIsDetailDrawerOpen(true);
    setLoadingDetails(true);

    try {
      const subRes = await fetch(`/api/audits?cmsCode=${dealer.cms_code}`);
      const subData = await subRes.json();
      if (subData.success) setDealerSubmissions(subData.audits || []);

      const profRes = await fetch(`/api/dealer/monthly-profile?cmsCode=${dealer.cms_code}`);
      const profData = await profRes.json();
      if (profData.success) setDealerProfileData(profData);
    } catch (err) {
      console.error('Failed to load dealer detail data:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Dealer created successfully with auto-generated credentials!');
        setIsModalOpen(false);
        setFormData({
          cmsCode: '',
          roName: '',
          dealerName: '',
          dealerMobile: '',
          zone: 'North',
          salesArea: '',
          latitude: '28.6139',
          longitude: '77.2090',
          address: '',
          brandType: 'Nayara Retail',
          hasCanopy: 'Yes',
          tsmName: ''
        });
        loadDealers();
      } else {
        alert('Failed to create dealer: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const certifiedCount = dealers.filter(d => d.approval_status === 'APPROVED').length;
  const pendingApprovalCount = dealers.filter(d => Boolean(d.latest_audit_id) && d.approval_status !== 'APPROVED' && d.approval_status !== 'REJECTED' && d.approval_status !== 'REVISION_REQUIRED').length;
  const reuploadPendingCount = dealers.filter(d => (d.pending_reuploads || 0) > 0).length;
  const reuploadDoneCount = dealers.filter(d => (d.resolved_reuploads || 0) > 0).length;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex text-slate-800">
      <Sidebar isOpen={sidebarOpen} dealerCount={dealers.length} />

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
              <h1 className="text-base font-bold text-slate-900 bg-transparent p-0 m-0">Dealers &amp; Retail Outlets</h1>
              <p className="text-xs text-slate-400">Zone-wise dealership management, audit progress, and contact directory</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/map"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700 font-semibold hover:bg-emerald-100 transition"
            >
              <MapIcon className="w-3.5 h-3.5 mr-1.5" />
              Live Map View
            </Link>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 bg-[#002855] hover:bg-[#001e40] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Add New RO
            </button>

            <button
              type="button"
              onClick={async () => {
                try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) { }
                try { localStorage.removeItem('fuel_user'); } catch (e) { }
                window.location.replace('/login');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Sign Out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="p-6 md:p-8 space-y-6">
          <DealerStatsHeader
            totalOutlets={dealers.length}
            certifiedCount={certifiedCount}
            pendingApprovalCount={pendingApprovalCount}
            reuploadPendingCount={reuploadPendingCount}
            reuploadDoneCount={reuploadDoneCount}
          />

          <DealerFilterBar
            search={search}
            setSearch={setSearch}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            zoneStats={zoneStats}
          />

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading retail outlets...</div>
          ) : (
            <DealerTable dealers={dealers} onOpenDetails={openDealerDetails} />
          )}
        </main>
      </div>

      {/* RO Inspection Drawer */}
      <DealerDrawerModal
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        dealer={selectedDealerForDetail}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        dealerSubmissions={dealerSubmissions}
        dealerProfileData={dealerProfileData}
        loadingDetails={loadingDetails}
        onPreviewPhoto={(photo) => setPreviewPhoto(photo)}
        onTanksUpdated={(newTanks) => {
          setDealerProfileData((prev: any) => ({ ...prev, tanks: newTanks }));
        }}
      />

      {/* Add New Dealer Modal */}
      <AddDealerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateDealer}
      />

      {/* Lightbox Photo Preview */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#002855] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-300" />
                <h4 className="text-sm font-bold text-white m-0 p-0">{previewPhoto.title}</h4>
              </div>
              <button type="button" onClick={() => setPreviewPhoto(null)} className="text-white hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-900 max-h-[75vh] overflow-hidden">
              <img src={previewPhoto.url} alt={previewPhoto.title} className="max-h-[70vh] max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
