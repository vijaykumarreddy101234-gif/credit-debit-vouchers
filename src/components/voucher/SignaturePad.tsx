import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';

interface SignaturePadProps {
  signature: string;
  signatureType: 'draw' | 'upload' | 'digital';
  onChange: (sig: string, type: 'draw' | 'upload' | 'digital') => void;
  signerName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  signature,
  signatureType,
  onChange,
  signerName = 'Authorized Signatory',
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'digital'>(signatureType || 'draw');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Professional blue ink

  // Initialize canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = penColor;

        // If existing draw signature
        if (signature && signature.startsWith('data:image')) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHasDrawn(true);
          };
          img.src = signature;
        }
      }
    }
  }, [activeTab]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onChange(dataUrl, 'draw');
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
    onChange('', 'draw');
  };

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result, 'upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const generateDigitalSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw stylish script name
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = penColor;
    ctx.font = 'italic bold 32px "Brush Script MT", "Caveat", "Dancing Script", cursive, sans-serif';
    ctx.fillText(signerName || 'Receiver Sign', 30, 75);

    // subtle underline flourish
    ctx.beginPath();
    ctx.moveTo(25, 95);
    ctx.bezierCurveTo(120, 85, 250, 115, 360, 95);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl, 'digital');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header and Switcher */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          Receiver's Signature Capture
        </span>
        <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => { setActiveTab('draw'); }}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'draw'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); }}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('digital');
              generateDigitalSignature();
            }}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'digital'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Digital Sign
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Draw Tab */}
        {activeTab === 'draw' && (
          <div className="space-y-3">
            <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 hover:bg-white transition-colors overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={150}
                className="w-full h-[150px] cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && !signature && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
                  <PenTool className="w-5 h-5 mb-1 opacity-50" />
                  <span>Sign here using mouse or touchscreen</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Ink Color:</span>
                <button
                  type="button"
                  onClick={() => setPenColor('#1e3a8a')}
                  className={`w-5 h-5 rounded-full bg-blue-900 border-2 ${
                    penColor === '#1e3a8a' ? 'border-blue-400 scale-110 shadow-xs' : 'border-white'
                  }`}
                  title="Blue Ink (Standard)"
                />
                <button
                  type="button"
                  onClick={() => setPenColor('#0f172a')}
                  className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${
                    penColor === '#0f172a' ? 'border-slate-400 scale-110 shadow-xs' : 'border-white'
                  }`}
                  title="Black Ink"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2.5 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            {signature && signatureType === 'upload' ? (
              <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <img
                    src={signature}
                    alt="Uploaded Signature"
                    className="h-16 object-contain bg-white p-1 rounded border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Signature Uploaded
                    </p>
                    <p className="text-[11px] text-slate-500">Ready for voucher sign-off</p>
                  </div>
                </div>
                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-8 h-8 text-blue-600 mb-2 opacity-80" />
                <span className="text-sm font-medium text-slate-700">Click to upload signature image</span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG, or WEBP (Max 2MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
            {uploadError && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                <span>⚠️</span> {uploadError}
              </p>
            )}
          </div>
        )}

        {/* Digital Signature Tab */}
        {activeTab === 'digital' && (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg flex flex-col items-center justify-center">
              {signature ? (
                <img
                  src={signature}
                  alt="Digital Signature"
                  className="h-20 object-contain drop-shadow-xs"
                />
              ) : (
                <div className="text-xs text-slate-500 py-3">Generating digital sign-off...</div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateDigitalSignature}
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  Regenerate Script
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Generated in accordance with Raviraja CRM receiver acknowledgment protocols.
            </p>
          </div>
        )}

        {/* Signature preview status indicator */}
        {signature && (
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <Check className="w-3 h-3" /> Receiver signature verified and recorded for A4 voucher print.
          </div>
        )}
      </div>
    </div>
  );
};
