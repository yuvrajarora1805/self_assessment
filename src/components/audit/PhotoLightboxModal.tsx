'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react';

interface PhotoLightboxModalProps {
  title: string;
  imageUrl: string;
  onClose: () => void;
}

export default function PhotoLightboxModal({
  title,
  imageUrl,
  onClose
}: PhotoLightboxModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomLevel]);

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  const zoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full h-[95vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Interactive Zoom Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white select-none">
          <div className="flex items-center space-x-2 min-w-0">
            <Maximize2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-bold truncate text-slate-100">{title || 'Photo Evidence'}</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoomLevel <= 1}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-slate-700"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white transition rounded hover:bg-slate-700 flex items-center gap-1"
                title="Reset Zoom (0)"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoomLevel >= 4}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition rounded hover:bg-slate-700"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Download Button */}
            <a
              href={imageUrl}
              download={`${title || 'photo'}.jpg`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title="Download High-Res Original"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition border border-slate-700"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zoomable & Draggable Image Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className={`flex-1 flex items-center justify-center bg-black/80 overflow-hidden relative ${
            zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              transformOrigin: 'center center'
            }}
            className="flex items-center justify-center max-h-full max-w-full select-none"
          >
            <img
              src={imageUrl}
              alt={title}
              draggable={false}
              className="max-h-[82vh] w-auto max-w-full object-contain shadow-2xl rounded"
            />
          </div>

          {/* Quick Helper Overlay */}
          <div className="absolute bottom-3 left-4 bg-slate-900/80 backdrop-blur-xs text-[11px] text-slate-400 px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-none flex items-center gap-2">
            <span>🔍 Scroll or click buttons to zoom up to 400%</span>
            {zoomLevel > 1 && <span>• ✋ Click &amp; drag to pan to GPS watermark</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
