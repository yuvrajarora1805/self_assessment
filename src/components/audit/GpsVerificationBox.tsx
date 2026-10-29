'use client';

import React, { useState } from 'react';
import { Compass, RefreshCw, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

interface GpsVerificationProps {
  gpsCoords: string;
  gpsAddress: string;
  gpsAccuracy: number | null;
  onGpsUpdate: (coords: string, address: string, accuracy: number) => void;
}

export default function GpsVerificationBox({
  gpsCoords,
  gpsAddress,
  gpsAccuracy,
  onGpsUpdate
}: GpsVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-acquire on mount if permission was already granted
  React.useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        if (status.state === 'granted' && !gpsCoords) {
          acquireGPS();
        }
      }).catch(() => {});
    }
  }, []);

  const acquireGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation sensor is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    const onPosSuccess = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy);
      const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      let addr = 'Location Coordinates Acquired';
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await res.json();
        if (data && data.display_name) addr = data.display_name;
      } catch (e) {
        console.warn('Reverse geocode fallback:', e);
      }

      onGpsUpdate(coordsStr, addr, accuracy);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      (err) => {
        if (err.code === 1) {
          setLoading(false);
          setError('Location access denied. Please click the Lock icon in your browser URL bar and allow Location.');
          return;
        }
        // If high accuracy times out (e.g. indoors/laptops), fallback to cellular/WiFi positioning
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          (err2) => {
            setLoading(false);
            if (err2.code === 1) {
              setError('Location access denied. Please allow GPS permission in your browser.');
            } else if (err2.code === 2) {
              setError('Location unavailable. Ensure device Location/GPS is turned on.');
            } else {
              setError('Location request timed out. Please tap retry.');
            }
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              gpsCoords ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
              Outlet Physical GPS Geofence & Location Stamp
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory on-site verification before audit submission
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={acquireGPS}
          disabled={loading}
          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Acquiring GPS...' : gpsCoords ? 'Re-lock GPS' : 'Lock Live GPS'}</span>
        </button>
      </div>

      <div className="mt-3">
        {gpsCoords ? (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-emerald-950 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>📍 GPS Locked: {gpsCoords}</span>
              {gpsAccuracy && (
                <span className="font-normal text-[11px] text-emerald-700">
                  (Accuracy: &plusmn;{gpsAccuracy}m)
                </span>
              )}
            </div>
            {gpsAddress && (
              <div className="text-[11px] text-emerald-800 font-medium pl-6 leading-relaxed">
                {gpsAddress}
              </div>
            )}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Location Verification Failed</span>
            </div>
            <div className="text-xs text-rose-600 pl-6">{error}</div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-center text-xs text-slate-500">
            ⏳ Tap "Lock Live GPS" to verify you are currently present at the retail outlet.
          </div>
        )}
      </div>
    </div>
  );
}
