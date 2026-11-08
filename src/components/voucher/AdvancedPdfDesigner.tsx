import React, { useState, useRef } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Upload,
  Check,
  ShieldCheck,
  Building2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Download,
  Eye,
  Sliders,
  Sparkles,
  Layout,
  Move,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { voucherStorage, PdfBrandingSettings } from '../../utils/voucherStorage';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { CreditVoucher, DebitVoucher, InVoucher } from '../../types/voucher';

interface CanvasElement {
  id: string;
  type: 'logo-left' | 'logo-right' | 'header' | 'ribbon' | 'metadata' | 'table' | 'amount' | 'terms' | 'signatures' | 'custom-text';
  label: string;
  x: number; // percentage (0 - 100)
  y: number; // px from top (0 - 842)
  width: number; // percentage
  height: number; // px
  fontSize: number;
  fontFamily: string;
  color: string;
  bgColor: string;
  alignment: 'left' | 'center' | 'right';
  isLocked: boolean;
  content?: string;
}

const DEFAULT_CANVAS_ELEMENTS: CanvasElement[] = [
  { id: 'el-left-logo', type: 'logo-left', label: 'Left Logo', x: 4, y: 18, width: 18, height: 26, fontSize: 12, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'center', isLocked: false },
  { id: 'el-header', type: 'header', label: 'Company Header', x: 25, y: 18, width: 50, height: 26, fontSize: 11, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-right-logo', type: 'logo-right', label: 'Right Seal / Stamp', x: 78, y: 18, width: 18, height: 26, fontSize: 8, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'center', isLocked: false },
  { id: 'el-ribbon', type: 'ribbon', label: 'Voucher Title Ribbon', x: 4, y: 52, width: 92, height: 35, fontSize: 10, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-metadata', type: 'metadata', label: 'Voucher Metadata Grid', x: 4, y: 95, width: 92, height: 75, fontSize: 8, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-table', type: 'table', label: 'Particulars & Items Table', x: 4, y: 178, width: 92, height: 60, fontSize: 8, fontFamily: 'helvetica', color: '#1e293b', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-amount', type: 'amount', label: 'Total Amount & Words', x: 4, y: 246, width: 92, height: 65, fontSize: 10, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-terms', type: 'terms', label: 'Terms & Conditions', x: 4, y: 320, width: 92, height: 45, fontSize: 7, fontFamily: 'helvetica', color: '#475569', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-signatures', type: 'signatures', label: 'Signatures (3 Columns)', x: 4, y: 374, width: 92, height: 85, fontSize: 8, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
];

interface AdvancedPdfDesignerProps {
  onNotify: (msg: string) => void;
}

export const AdvancedPdfDesigner: React.FC<AdvancedPdfDesignerProps> = ({ onNotify }) => {
  const [templateType, setTemplateType] = useState<'IN' | 'OUT'>('IN');
  const [settings, setSettings] = useState<PdfBrandingSettings>(() => voucherStorage.getPdfBrandingSettings());
  const [elements, setElements] = useState<CanvasElement[]>(DEFAULT_CANVAS_ELEMENTS);
  const [selectedElementId, setSelectedElementId] = useState<string>('el-header');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeToolTab, setActiveToolTab] = useState<'toolbox' | 'properties' | 'Layers' | 'templates'>('toolbox');
  const [history, setHistory] = useState<CanvasElement[][]>([DEFAULT_CANVAS_ELEMENTS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Mouse Drag State
  const [dragInfo, setDragInfo] = useState<{ id: string; startMouseX: number; startMouseY: number; startElemX: number; startElemY: number } | null>(null);
  const a4CanvasRef = useRef<HTMLDivElement>(null);

  // Real Database Voucher Selection for Live Preview
  const creditVouchers = voucherStorage.getCreditVouchers();
  const debitVouchers = voucherStorage.getDebitVouchers();
  const availableVouchers = templateType === 'IN' ? creditVouchers : debitVouchers;
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>(availableVouchers[0]?.id || '');

  const activeVoucher = availableVouchers.find(v => v.id === selectedVoucherId) || availableVouchers[0] || {
    id: 'test-sample-001',
    voucherNo: templateType === 'IN' ? 'IN-0001' : 'OUT-0001',
    date: new Date().toISOString().split('T')[0],
    voucherType: templateType === 'IN' ? 'IN(Credit)' : 'OUT(Debit)',
    receiptMode: 'Bank',
    paymentMode: 'Bank',
    amount: 1550000,
    amountInWords: 'Fifteen Lakh Fifty Thousand Rupees Only',
    customerName: 'Tata Projects Limited',
    supplierName: 'Steel Authority of India Ltd (SAIL)',
    description: 'Advance against supply of heavy industrial machinery',
    invoiceNumber: 'TPL/HYD/PO/2026/8942',
    invoiceDate: new Date().toISOString().split('T')[0],
    approvedBy: 'Lakshmi Narayana',
    approvalStatus: 'Approved',
    receivedBy: 'Suresh Kumar',
    cashierName: 'Suresh Kumar',
    attachments: [],
    createdBy: 'Suresh Kumar',
  };

  const selectedElement = elements.find(el => el.id === selectedElementId) || elements[0];

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const updated = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    setElements(updated);
    const newHist = history.slice(0, historyIndex + 1);
    setHistory([...newHist, updated]);
    setHistoryIndex(newHist.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
      onNotify('Action undone.');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
      onNotify('Action redone.');
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    if (el.isLocked) return;
    e.stopPropagation();
    setSelectedElementId(el.id);
    setDragInfo({
      id: el.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElemX: el.x,
      startElemY: el.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragInfo || !a4CanvasRef.current) return;
    const currentScale = zoomLevel / 100;
    const dxPx = (e.clientX - dragInfo.startMouseX) / currentScale;
    const dyPx = (e.clientY - dragInfo.startMouseY) / currentScale;

    // Convert dxPx to percentage of 595px A4 width
    const dxPercent = (dxPx / 595) * 100;
    const targetEl = elements.find(el => el.id === dragInfo.id);
    if (!targetEl) return;

    const newX = Math.max(0, Math.min(100 - targetEl.width, dragInfo.startElemX + dxPercent));
    const newY = Math.max(0, Math.min(800 - targetEl.height, dragInfo.startElemY + dyPx));

    setElements(prev => prev.map(el => el.id === dragInfo.id ? { ...el, x: newX, y: newY } : el));
  };

  const handleMouseUp = () => {
    if (dragInfo) {
      setDragInfo(null);
      // Save state to history
      const newHist = history.slice(0, historyIndex + 1);
      setHistory([...newHist, elements]);
      setHistoryIndex(newHist.length);
    }
  };

  const handleAddCustomText = () => {
    const newEl: CanvasElement = {
      id: `el-custom-${Date.now()}`,
      type: 'custom-text',
      label: 'Custom Text Block',
      x: 10,
      y: 460,
      width: 40,
      height: 35,
      fontSize: 9,
      fontFamily: 'helvetica',
      color: '#0f172a',
      bgColor: 'transparent',
      alignment: 'left',
      isLocked: false,
      content: 'Enter custom text note here...'
    };
    const updated = [...elements, newEl];
    setElements(updated);
    setSelectedElementId(newEl.id);
    onNotify('Added custom text block to canvas.');
  };

  const handleAddShape = () => {
    const newEl: CanvasElement = {
      id: `el-shape-${Date.now()}`,
      type: 'custom-text',
      label: 'Divider Box',
      x: 4,
      y: 460,
      width: 92,
      height: 8,
      fontSize: 8,
      fontFamily: 'helvetica',
      color: '#cbd5e1',
      bgColor: '#cbd5e1',
      alignment: 'center',
      isLocked: false,
    };
    const updated = [...elements, newEl];
    setElements(updated);
    setSelectedElementId(newEl.id);
    onNotify('Added shape divider box.');
  };

  const handleSaveTemplate = () => {
    voucherStorage.savePdfBrandingSettings(settings);
    onNotify(`Successfully saved ${templateType} Voucher PDF Template and layout settings!`);
  };

  const handleTestDownload = () => {
    voucherStorage.savePdfBrandingSettings(settings);
    try {
      generateVoucherPdf(activeVoucher as any, false);
      onNotify(`Exported ${templateType} Voucher PDF for ${activeVoucher.voucherNo} successfully!`);
    } catch (err: any) {
      onNotify(`Error generating PDF: ${err?.message || 'Please check settings.'}`);
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setTemplateType('IN'); onNotify('Switched to IN Voucher Template Studio'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${templateType === 'IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              IN Voucher Template
            </button>
            <button
              type="button"
              onClick={() => { setTemplateType('OUT'); onNotify('Switched to OUT Voucher Template Studio'); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${templateType === 'OUT' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              OUT Voucher Template
            </button>
          </div>

          {/* Real Voucher Preview Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Preview Voucher:</span>
            <select
              value={selectedVoucherId}
              onChange={(e) => setSelectedVoucherId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
            >
              {availableVouchers.map(v => (
                <option key={v.id} value={v.id}>
                  {v.voucherNo} - {(v as any).customerName || (v as any).supplierName || 'Voucher'} (₹{v.amount?.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
            <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30" title="Undo">
              <Undo2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30" title="Redo">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestDownload}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleSaveTemplate}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      {/* Main Two-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Panel: Toolbox & Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[820px]">
          
          {/* Subtabs */}
          <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 p-1.5 text-center text-xs font-bold text-slate-600">
            <button type="button" onClick={() => setActiveToolTab('toolbox')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'toolbox' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Toolbox</button>
            <button type="button" onClick={() => setActiveToolTab('properties')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'properties' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Inspect</button>
            <button type="button" onClick={() => setActiveToolTab('Layers')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'Layers' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Layers</button>
            <button type="button" onClick={() => setActiveToolTab('templates')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'templates' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Presets</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            
            {activeToolTab === 'toolbox' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wide text-[10px]">Add Custom Canvas Elements</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={handleAddCustomText} className="p-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-1.5 transition-all">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Add Text Block</span>
                    </button>
                    <button type="button" onClick={handleAddShape} className="p-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-1.5 transition-all">
                      <Square className="w-5 h-5 text-purple-600" />
                      <span>Add Divider Line</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Company Header & Logos</h4>
                  
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block font-bold text-slate-700">Company Name</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => {
                        voucherStorage.savePdfBrandingSettings({ ...settings, companyName: e.target.value });
                        setSettings({ ...settings, companyName: e.target.value });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />

                    <label className="block font-bold text-slate-700 pt-1">Left Logo Abbreviation / Image</label>
                    <input
                      type="text"
                      value={settings.leftLogoText}
                      onChange={(e) => {
                        voucherStorage.savePdfBrandingSettings({ ...settings, leftLogoText: e.target.value });
                        setSettings({ ...settings, leftLogoText: e.target.value });
                      }}
                      className="w-full px-3 py-1.5 font-mono uppercase bg-white border border-slate-300 rounded-lg font-bold"
                    />
                    <label className="cursor-pointer block text-center py-2 bg-white border border-blue-200 text-blue-700 font-bold rounded-lg hover:bg-blue-50">
                      Upload Left Logo Image
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const res = ev.target?.result as string;
                          if (res) {
                            voucherStorage.savePdfBrandingSettings({ ...settings, leftLogoImage: res });
                            setSettings({ ...settings, leftLogoImage: res });
                            onNotify('Left logo uploaded successfully!');
                          }
                        };
                        reader.readAsDataURL(file);
                      }} className="hidden" />
                    </label>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block font-bold text-slate-700">Right Seal Title</label>
                    <input
                      type="text"
                      value={settings.rightSealTitle}
                      onChange={(e) => {
                        voucherStorage.savePdfBrandingSettings({ ...settings, rightSealTitle: e.target.value });
                        setSettings({ ...settings, rightSealTitle: e.target.value });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                    <label className="cursor-pointer block text-center py-2 bg-white border-blue-200 text-blue-700 font-bold rounded-lg hover:bg-blue-50 border">
                      Upload Stamp / Seal Image
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const res = ev.target?.result as string;
                          if (res) {
                            voucherStorage.savePdfBrandingSettings({ ...settings, rightLogoImage: res });
                            setSettings({ ...settings, rightLogoImage: res });
                            onNotify('Right seal uploaded successfully!');
                          }
                        };
                        reader.readAsDataURL(file);
                      }} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeToolTab === 'properties' && selectedElement && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-black text-slate-900 uppercase tracking-wide text-xs">Inspector: {selectedElement.label}</h4>
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                    className={`p-1.5 rounded-lg border ${selectedElement.isLocked ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {selectedElement.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {selectedElement.content !== undefined && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Text Content</label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg h-20"
                    />
                  </div>
                )}

                {/* Manual Nudge Controls */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-700 text-center">Manual Precision Nudge (Move)</label>
                  <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                    <div />
                    <button type="button" onClick={() => updateElement(selectedElement.id, { y: Math.max(0, selectedElement.y - 4) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <div />
                    <button type="button" onClick={() => updateElement(selectedElement.id, { x: Math.max(0, selectedElement.x - 2) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowLeft className="w-3.5 h-3.5" /></button>
                    <div className="flex items-center justify-center text-[10px] font-mono text-slate-500 font-bold">Move</div>
                    <button type="button" onClick={() => updateElement(selectedElement.id, { x: Math.min(95, selectedElement.x + 2) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowRight className="w-3.5 h-3.5" /></button>
                    <div />
                    <button type="button" onClick={() => updateElement(selectedElement.id, { y: Math.min(800, selectedElement.y + 4) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <div />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">X Position (%)</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Y Position (px)</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Width (%)</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Font Size: {selectedElement.fontSize}pt</label>
                  <input
                    type="range"
                    min="6"
                    max="24"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-700">Alignment:</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button type="button" onClick={() => updateElement(selectedElement.id, { alignment: 'left' })} className={`p-1.5 rounded ${selectedElement.alignment === 'left' ? 'bg-white shadow-xs' : ''}`}><AlignLeft className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => updateElement(selectedElement.id, { alignment: 'center' })} className={`p-1.5 rounded ${selectedElement.alignment === 'center' ? 'bg-white shadow-xs' : ''}`}><AlignCenter className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => updateElement(selectedElement.id, { alignment: 'right' })} className={`p-1.5 rounded ${selectedElement.alignment === 'right' ? 'bg-white shadow-xs' : ''}`}><AlignRight className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )}

            {activeToolTab === 'Layers' && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px] mb-2">Canvas Elements Stack</h4>
                {elements.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedElementId === el.id ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                  >
                    <span className="truncate">{el.label}</span>
                    <span className="text-[10px] font-mono opacity-60">X:{Math.round(el.x)} Y:{Math.round(el.y)}</span>
                  </div>
                ))}
              </div>
            )}

            {activeToolTab === 'templates' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Saved Layout Templates</h4>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 space-y-2">
                  <p className="font-bold">Active Template: <span className="uppercase">{templateType} Voucher Standard</span></p>
                  <p className="text-[11px] text-slate-600">All canvas dimensions, element positions, and logos are linked to database persistence.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setElements(DEFAULT_CANVAS_ELEMENTS); onNotify('Reset canvas template to factory defaults.'); }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Current Template
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right Panel: Interactive Visual A4 Drag Canvas & Preview (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[820px] relative overflow-hidden select-none">
          
          {/* Canvas Toolbar with Interactive Zoom Controls */}
          <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-3 z-30 text-xs shadow-lg">
            <span className="text-slate-400 font-bold">A4 Canvas Zoom:</span>
            <button type="button" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600 text-white font-bold transition-all"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="font-mono font-bold text-emerald-400 w-12 text-center">{zoomLevel}%</span>
            <button type="button" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600 text-white font-bold transition-all"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => setZoomLevel(100)} className="px-2 py-1 bg-slate-700 rounded-lg hover:bg-slate-600 text-[10px] font-bold text-slate-300">100%</button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium mb-3 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-emerald-400" /> Direct Drag & Drop: Click and drag any element on the A4 sheet below to move it!
          </p>

          {/* Interactive A4 Sheet Container */}
          <div
            ref={a4CanvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="bg-white rounded-lg shadow-2xl relative transition-transform duration-150 overflow-hidden border-2 border-slate-300"
            style={{
              width: '595px',
              height: '842px',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {elements.map((el) => {
              const isSelected = selectedElementId === el.id;
              const isOutVoucher = activeVoucher.voucherType === 'OUT(Debit)';

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el)}
                  className={`absolute p-1 transition-shadow cursor-move rounded-md ${
                    isSelected ? 'ring-2 ring-blue-600 ring-offset-2 z-30 shadow-xl bg-blue-50/10' : 'hover:ring-1 hover:ring-slate-400'
                  }`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}px`,
                    width: `${el.width}%`,
                    height: `${el.height}px`,
                    fontSize: `${el.fontSize}pt`,
                    fontFamily: el.fontFamily,
                    color: el.color,
                    backgroundColor: el.bgColor,
                    textAlign: el.alignment,
                  }}
                >
                  {/* Visual Drag Handle Tag */}
                  {isSelected && (
                    <div className="absolute -top-5 left-0 bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-bold shadow-md flex items-center gap-1 z-40 pointer-events-none">
                      <Move className="w-2.5 h-2.5" />
                      {el.label} (Drag to Move)
                    </div>
                  )}

                  {el.type === 'logo-left' && (
                    <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-black rounded text-xs overflow-hidden">
                      {settings.leftLogoImage ? (
                        <img src={settings.leftLogoImage} alt="Left Logo" className="w-full h-full object-contain bg-white p-0.5 rounded" />
                      ) : (
                        <span className="tracking-widest">{settings.leftLogoText || 'RIL'}</span>
                      )}
                    </div>
                  )}

                  {el.type === 'header' && (
                    <div className="w-full h-full bg-white text-slate-900 p-2 flex flex-col justify-center overflow-hidden">
                      <div className="font-black text-[10px] text-slate-950 truncate">{settings.companyName}</div>
                      <div className="text-[7.5px] text-slate-600 font-medium truncate">{settings.companySubtitle}</div>
                      <div className="text-[7px] text-slate-500 truncate">{settings.companyAddress}</div>
                      <div className="text-[7px] text-blue-700 font-mono font-bold truncate">CIN: {settings.cin} • GSTIN: {settings.gstin}</div>
                    </div>
                  )}

                  {el.type === 'logo-right' && (
                    <div className="w-full h-full bg-white text-slate-900 flex flex-col items-center justify-center p-1 overflow-hidden">
                      {settings.rightLogoImage ? (
                        <img src={settings.rightLogoImage} alt="Stamp" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <span className="text-[7px] font-extrabold text-slate-500 uppercase">{settings.rightSealTitle}</span>
                          <span className="text-[9px] font-black text-slate-900">{isOutVoucher ? 'DEBIT' : 'CREDIT'}</span>
                          <span className="text-[6.5px] text-slate-400">Raviraja CRM</span>
                        </>
                      )}
                    </div>
                  )}

                  {el.type === 'ribbon' && (
                    <div className="w-full h-full bg-white border-b border-slate-200 px-2 flex items-center justify-between font-bold text-slate-950 text-[9px]">
                      <span className="uppercase">{isOutVoucher ? 'OUT VOUCHER (DEBIT)' : 'IN VOUCHER (CREDIT)'}</span>
                      <span className="text-slate-700 text-[8px] font-black uppercase">STATUS: {activeVoucher.approvalStatus || 'APPROVED'}</span>
                    </div>
                  )}

                  {el.type === 'metadata' && (
                    <div className="w-full h-full bg-white border-b border-slate-200 py-1.5 grid grid-cols-2 text-[8px] text-slate-700 gap-x-4 gap-y-0.5">
                      <div className="flex justify-between"><strong className="text-slate-500">Voucher No:</strong> <span className="font-bold text-slate-900">{activeVoucher.voucherNo}</span></div>
                      <div className="flex justify-between"><strong className="text-slate-500">{isOutVoucher ? 'Expenses Bill:' : 'Invoice No:'}</strong> {(activeVoucher as any).invoiceNumber || (activeVoucher as any).originalPurchaseBill || '-'}</div>
                      <div className="flex justify-between"><strong className="text-slate-500">Date:</strong> {activeVoucher.date}</div>
                      <div className="flex justify-between"><strong className="text-slate-500">{isOutVoucher ? 'Payment Mode:' : 'Receipt Mode:'}</strong> <span className="font-bold text-blue-700">{(activeVoucher as any).paymentMode || (activeVoucher as any).receiptMode || 'Bank'}</span></div>
                      <div className="flex justify-between"><strong className="text-slate-500">Accountant:</strong> {activeVoucher.createdBy}</div>
                      <div className="flex justify-between"><strong className="text-slate-500">GSTIN:</strong> {(activeVoucher as any).customerGstin || (activeVoucher as any).supplierGstin || '-'}</div>
                    </div>
                  )}

                  {el.type === 'table' && (
                    <div className="w-full h-full bg-white py-1 text-[8px]">
                      <div className="font-bold border-b border-slate-200 pb-0.5 text-slate-700 uppercase">PARTICULARS & TRANSACTION SPECIFICATION</div>
                      <div className="text-slate-800 pt-1 flex justify-between">
                        <strong className="text-slate-500">{(isOutVoucher ? 'Supplier / Payee: ' : 'Customer / Party: ')}</strong>
                        <span className="font-bold text-slate-900">{(activeVoucher as any).customerName || (activeVoucher as any).supplierName || '-'}</span>
                      </div>
                      <div className="text-slate-600 pt-0.5 truncate">
                        <span className="text-slate-500 font-bold">Purpose: </span>{activeVoucher.description || 'Corporate voucher entry'}
                      </div>
                    </div>
                  )}

                  {el.type === 'amount' && (
                    <div className="w-full h-full bg-white border-y border-slate-200 py-1.5 text-[8px] text-slate-900 flex flex-col justify-center">
                      <div className="font-bold text-[9px] flex justify-between items-center text-slate-700">
                        <span>{isOutVoucher ? 'TOTAL AMOUNT PAID (INR): ' : 'TOTAL AMOUNT RECEIVED (INR): '}</span>
                        <span className="text-xs font-black text-slate-950 font-mono">₹{activeVoucher.amount?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[7.5px] italic text-slate-600 mt-0.5">
                        Amount in Words: {activeVoucher.amountInWords || 'Zero Rupees Only'}
                      </div>
                    </div>
                  )}

                  {el.type === 'terms' && (
                    <div className="w-full h-full bg-white border-b border-slate-200 py-1 text-[7px] text-slate-600">
                      <strong className="text-slate-500 uppercase block mb-0.5">TERMS & CONDITIONS:</strong>
                      {settings.terms.slice(0, 3).map((t, i) => (
                        <div key={i} className="truncate">{t}</div>
                      ))}
                    </div>
                  )}

                  {el.type === 'signatures' && (
                    <div className="w-full h-full grid grid-cols-3 gap-2 pt-1">
                      <div className="border-t border-slate-800 pt-1 text-[7px]">
                        <strong className="text-slate-500 block uppercase">PREPARED BY</strong>
                        <span className="font-bold text-slate-900">{activeVoucher.createdBy}</span>
                      </div>
                      <div className="border-t border-slate-800 pt-1 text-[7px]">
                        <strong className="text-slate-500 block uppercase">APPROVED BY</strong>
                        <span className="font-bold text-slate-900">{activeVoucher.approvedBy || 'Authorised Manager'}</span>
                      </div>
                      <div className="border-t border-slate-800 pt-1 text-[7px]">
                        <strong className="text-slate-500 block uppercase">{isOutVoucher ? 'CASHIER / PAYEE' : 'RECEIVED BY'}</strong>
                        <span className="font-bold text-slate-900">{(activeVoucher as any).receivedBy || (activeVoucher as any).cashierName || 'Staff'}</span>
                      </div>
                    </div>
                  )}

                  {el.type === 'custom-text' && (
                    <div className="w-full h-full flex items-center font-semibold">
                      {el.content || el.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
