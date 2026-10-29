'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check } from 'lucide-react';

interface SignatureProps {
  signatureData: string;
  onSaveSignature: (base64: string) => void;
}

export default function SignaturePadModal({
  signatureData,
  onSaveSignature
}: SignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#002855';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = signatureData;
    }
  }, [signatureData]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    const mouseEvt = e as React.MouseEvent;
    return {
      x: (mouseEvt.clientX - rect.left) * scaleX,
      y: (mouseEvt.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSaveSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSaveSignature('');
  };

  return (
    <div id="signature-container" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <PenTool className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-extrabold text-slate-900 text-base leading-tight">
              6. Franchisee Representative Signature
            </h2>
            <p className="text-xs text-slate-500">
              By signing below, you certify that this self-assessment is authentic and verifiable.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          <span>Clear Signature</span>
        </button>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[180px] cursor-crosshair touch-none"
        />
        {!hasDrawn && !signatureData && (
          <div className="absolute pointer-events-none text-slate-400 text-xs font-semibold flex items-center space-x-1.5">
            <PenTool className="w-4 h-4 opacity-50" />
            <span>Sign with finger or stylus here</span>
          </div>
        )}
      </div>

      {signatureData && (
        <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
          <Check className="w-3.5 h-3.5" />
          <span>Signature recorded & ready for submission.</span>
        </div>
      )}
    </div>
  );
}
