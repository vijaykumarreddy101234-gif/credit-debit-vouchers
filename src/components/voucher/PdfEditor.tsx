import React, { useState, useRef, useEffect } from 'react';
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
  Maximize2,
  Copy,
  Table as TableIcon,
  PenTool,
  Type,
  Palette,
  CheckCircle2,
  X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { voucherStorage, PdfBrandingSettings } from '../../utils/voucherStorage';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { CreditVoucher, DebitVoucher, InVoucher } from '../../types/voucher';

export interface EditorElement {
  id: string;
  type: 'logo-left' | 'logo-right' | 'header' | 'ribbon' | 'metadata' | 'table' | 'amount' | 'terms' | 'signatures' | 'custom-text' | 'shape' | 'signature-pad';
  label: string;
  x: number; // percentage (0 - 100)
  y: number; // px from top (0 - 842)
  width: number; // percentage
  height: number; // px
  fontSize: number;
  fontFamily: string;
  color: string;
  bgColor: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  alignment: 'left' | 'center' | 'right';
  isLocked: boolean;
  content?: string;
}

const DEFAULT_EDITOR_ELEMENTS: EditorElement[] = [
  { id: 'el-left-logo', type: 'logo-left', label: 'Left Company Logo', x: 4, y: 18, width: 17, height: 84, fontSize: 12, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'center', isLocked: false },
  { id: 'el-header', type: 'header', label: 'Company Header', x: 23, y: 18, width: 53, height: 84, fontSize: 11, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-right-logo', type: 'logo-right', label: 'Right Seal / Stamp', x: 78, y: 18, width: 18, height: 84, fontSize: 8, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'center', isLocked: false },
  { id: 'el-ribbon', type: 'ribbon', label: 'Voucher Title Ribbon', x: 4, y: 110, width: 92, height: 36, fontSize: 10, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-metadata', type: 'metadata', label: 'Voucher Details Grid', x: 4, y: 154, width: 92, height: 75, fontSize: 8, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-table', type: 'table', label: 'Particulars Table', x: 4, y: 237, width: 92, height: 85, fontSize: 8, fontFamily: 'helvetica', color: '#1e293b', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-amount', type: 'amount', label: 'Total Amount & Words', x: 4, y: 330, width: 92, height: 65, fontSize: 10, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-terms', type: 'terms', label: 'Terms & Conditions', x: 4, y: 403, width: 92, height: 65, fontSize: 7, fontFamily: 'helvetica', color: '#475569', bgColor: '#ffffff', alignment: 'left', isLocked: false },
  { id: 'el-signatures', type: 'signatures', label: '3 Signatures Section', x: 4, y: 476, width: 92, height: 85, fontSize: 8, fontFamily: 'helvetica', color: '#0f172a', bgColor: '#ffffff', alignment: 'left', isLocked: false },
];

interface PdfEditorProps {
  onNotify: (msg: string) => void;
  initialVoucher?: InVoucher;
}

export const PdfEditor: React.FC<PdfEditorProps> = ({ onNotify, initialVoucher }) => {
  const [templateType, setTemplateType] = useState<'IN' | 'OUT'>(initialVoucher?.voucherType === 'OUT(Debit)' ? 'OUT' : 'IN');
  const [settings, setSettings] = useState<PdfBrandingSettings>(() => voucherStorage.getPdfBrandingSettings());
  const [elements, setElements] = useState<EditorElement[]>(DEFAULT_EDITOR_ELEMENTS);
  const [selectedElementId, setSelectedElementId] = useState<string>('el-header');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeToolTab, setActiveToolTab] = useState<'toolbox' | 'properties' | 'branding' | 'layers'>('toolbox');
  const [history, setHistory] = useState<EditorElement[][]>([DEFAULT_EDITOR_ELEMENTS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Mouse Drag & Resize State
  const [dragInfo, setDragInfo] = useState<{ id: string; type: 'move' | 'resize'; startMouseX: number; startMouseY: number; startElemX: number; startElemY: number; startW: number; startH: number } | null>(null);
  const a4CanvasRef = useRef<HTMLDivElement>(null);

  // Real Database Voucher Selection
  const creditVouchers = voucherStorage.getCreditVouchers();
  const debitVouchers = voucherStorage.getDebitVouchers();
  const availableVouchers = templateType === 'IN' ? creditVouchers : debitVouchers;
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>(initialVoucher?.id || availableVouchers[0]?.id || '');

  const activeVoucher = (initialVoucher && initialVoucher.id === selectedVoucherId ? initialVoucher : availableVouchers.find(v => v.id === selectedVoucherId)) || availableVouchers[0] || {
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
    description: 'Advance against supply of heavy industrial gearboxes',
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

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
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

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent, el: EditorElement, type: 'move' | 'resize' = 'move') => {
    if (el.isLocked) return;
    e.stopPropagation();
    setSelectedElementId(el.id);
    setDragInfo({
      id: el.id,
      type,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElemX: el.x,
      startElemY: el.y,
      startW: el.width,
      startH: el.height
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragInfo || !a4CanvasRef.current) return;
    const currentScale = zoomLevel / 100;
    const dxPx = (e.clientX - dragInfo.startMouseX) / currentScale;
    const dyPx = (e.clientY - dragInfo.startMouseY) / currentScale;
    const dxPercent = (dxPx / 595) * 100;

    const targetEl = elements.find(el => el.id === dragInfo.id);
    if (!targetEl) return;

    if (dragInfo.type === 'move') {
      const newX = Math.max(0, Math.min(100 - targetEl.width, dragInfo.startElemX + dxPercent));
      const newY = Math.max(0, Math.min(800 - targetEl.height, dragInfo.startElemY + dyPx));
      setElements(prev => prev.map(el => el.id === dragInfo.id ? { ...el, x: newX, y: newY } : el));
    } else if (dragInfo.type === 'resize') {
      const newW = Math.max(10, Math.min(100 - targetEl.x, dragInfo.startW + dxPercent));
      const newH = Math.max(15, Math.min(400, dragInfo.startH + dyPx));
      setElements(prev => prev.map(el => el.id === dragInfo.id ? { ...el, width: newW, height: newH } : el));
    }
  };

  const handleMouseUp = () => {
    if (dragInfo) {
      setDragInfo(null);
      const newHist = history.slice(0, historyIndex + 1);
      setHistory([...newHist, elements]);
      setHistoryIndex(newHist.length);
    }
  };

  const handleAddCustomText = () => {
    const newEl: EditorElement = {
      id: `el-text-${Date.now()}`,
      type: 'custom-text',
      label: 'Custom Text Block',
      x: 10,
      y: 450,
      width: 45,
      height: 35,
      fontSize: 10,
      fontFamily: 'helvetica',
      color: '#0f172a',
      bgColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      borderRadius: 6,
      alignment: 'left',
      isLocked: false,
      content: 'Enter custom voucher note or legal text here...'
    };
    const updated = [...elements, newEl];
    setElements(updated);
    setSelectedElementId(newEl.id);
    onNotify('Added new custom text block.');
  };

  const handleAddShape = () => {
    const newEl: EditorElement = {
      id: `el-shape-${Date.now()}`,
      type: 'shape',
      label: 'Divider Line / Box',
      x: 4,
      y: 450,
      width: 92,
      height: 6,
      fontSize: 8,
      fontFamily: 'helvetica',
      color: '#0284c7',
      bgColor: '#0284c7',
      borderRadius: 3,
      alignment: 'center',
      isLocked: false,
    };
    const updated = [...elements, newEl];
    setElements(updated);
    setSelectedElementId(newEl.id);
    onNotify('Added divider line shape.');
  };

  const handleDuplicateElement = (el: EditorElement) => {
    const dup: EditorElement = {
      ...el,
      id: `el-copy-${Date.now()}`,
      label: `${el.label} (Copy)`,
      x: Math.min(80, el.x + 3),
      y: Math.min(750, el.y + 15),
      isLocked: false
    };
    const updated = [...elements, dup];
    setElements(updated);
    setSelectedElementId(dup.id);
    onNotify(`Duplicated element: ${dup.label}`);
  };

  const handleDeleteElement = (id: string) => {
    if (elements.length <= 1) {
      onNotify('At least one element must remain on canvas.');
      return;
    }
    const updated = elements.filter(el => el.id !== id);
    setElements(updated);
    setSelectedElementId(updated[0]?.id || '');
    onNotify('Element removed from canvas.');
  };

  const handleSaveTemplate = () => {
    voucherStorage.savePdfBrandingSettings(settings);
    onNotify(`Saved ${templateType} Voucher Template layout & settings!`);
  };

  // Direct Crisp Vector PDF Download Engine
  const handleDownloadPdf = () => {
    voucherStorage.savePdfBrandingSettings(settings);
    onNotify('Generating vector-crisp official A4 PDF...');

    try {
      generateVoucherPdf(activeVoucher as any, false, {
        companyName: settings.companyName,
        companySubtitle: settings.companySubtitle,
        companyAddress: settings.companyAddress,
        cin: settings.cin,
        gstin: settings.gstin,
        pan: settings.pan,
        leftLogoText: settings.leftLogoText,
        leftLogoImage: settings.leftLogoImage,
        rightBadgeTop: settings.rightSealTitle,
        rightBadgeCenter: templateType === 'OUT' ? 'DEBIT' : 'CREDIT',
        rightBadgeBottom: 'Raviraja CRM',
        terms: settings.terms,
        footerDisclaimer: settings.footerText,
      });
      onNotify(`Downloaded PDF for ${activeVoucher.voucherNo} successfully!`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      onNotify(`Error exporting PDF: ${err?.message || 'Please check input fields.'}`);
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
              onClick={() => {
                setTemplateType('IN');
                setSelectedVoucherId(creditVouchers[0]?.id || '');
                onNotify('Switched to IN (Credit) Voucher Template Editor');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${templateType === 'IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              IN (Credit) Template
            </button>
            <button
              type="button"
              onClick={() => {
                setTemplateType('OUT');
                setSelectedVoucherId(debitVouchers[0]?.id || '');
                onNotify('Switched to OUT (Debit) Voucher Template Editor');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${templateType === 'OUT' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              OUT (Debit) Template
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
            onClick={() => {
              setElements(DEFAULT_EDITOR_ELEMENTS);
              setHistory([DEFAULT_EDITOR_ELEMENTS]);
              setHistoryIndex(0);
              onNotify('Reset canvas elements to default clean corporate layout!');
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all"
            title="Reset element positions and sizes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating PDF...' : 'Download PDF'}
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

      {/* Split-Pane Layout: Left Sidebar Controls (4 cols) & Right Canvas (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Sidebar Pane: Toolbox, Inspector, Branding */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[820px]">
          
          <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 p-1.5 text-center text-xs font-bold text-slate-600">
            <button type="button" onClick={() => setActiveToolTab('toolbox')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'toolbox' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Toolbox</button>
            <button type="button" onClick={() => setActiveToolTab('properties')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'properties' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Inspect</button>
            <button type="button" onClick={() => setActiveToolTab('branding')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'branding' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Branding</button>
            <button type="button" onClick={() => setActiveToolTab('layers')} className={`py-2 rounded-lg transition-all ${activeToolTab === 'layers' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}>Layers</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            
            {/* Toolbox */}
            {activeToolTab === 'toolbox' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wide text-[10px]">Add PDF Elements</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={handleAddCustomText} className="p-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-1.5 transition-all">
                      <Type className="w-5 h-5 text-blue-600" />
                      <span>Add Text Block</span>
                    </button>
                    <button type="button" onClick={handleAddShape} className="p-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-1.5 transition-all">
                      <Square className="w-5 h-5 text-purple-600" />
                      <span>Add Divider Line</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Company Header & Stamp Uploads</h4>
                  
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block font-bold text-slate-700">Company Name</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => {
                        const updated = { ...settings, companyName: e.target.value };
                        voucherStorage.savePdfBrandingSettings(updated);
                        setSettings(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />

                    <label className="block font-bold text-slate-700 pt-1">Left Logo Abbreviation / Image</label>
                    <input
                      type="text"
                      value={settings.leftLogoText}
                      onChange={(e) => {
                        const updated = { ...settings, leftLogoText: e.target.value };
                        voucherStorage.savePdfBrandingSettings(updated);
                        setSettings(updated);
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
                            const updated = { ...settings, leftLogoImage: res };
                            voucherStorage.savePdfBrandingSettings(updated);
                            setSettings(updated);
                            onNotify('Left logo image uploaded!');
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
                        const updated = { ...settings, rightSealTitle: e.target.value };
                        voucherStorage.savePdfBrandingSettings(updated);
                        setSettings(updated);
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
                            const updated = { ...settings, rightLogoImage: res };
                            voucherStorage.savePdfBrandingSettings(updated);
                            setSettings(updated);
                            onNotify('Right seal uploaded!');
                          }
                        };
                        reader.readAsDataURL(file);
                      }} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Inspector */}
            {activeToolTab === 'properties' && selectedElement && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-black text-slate-900 uppercase tracking-wide text-xs">Inspector: {selectedElement.label}</h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateElement(selectedElement)}
                      className="p-1.5 rounded-lg border bg-slate-50 text-slate-600 hover:bg-slate-100"
                      title="Duplicate Element"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                      className={`p-1.5 rounded-lg border ${selectedElement.isLocked ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-600'}`}
                      title={selectedElement.isLocked ? 'Unlock Element' : 'Lock Element'}
                    >
                      {selectedElement.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(selectedElement.id)}
                      className="p-1.5 rounded-lg border bg-red-50 text-red-600 hover:bg-red-100"
                      title="Delete Element"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {selectedElement.content !== undefined && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Text Content</label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg h-20 text-xs font-medium"
                    />
                  </div>
                )}

                {/* Manual Precision Nudge */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-700 text-center">Manual Precision Nudge (Move)</label>
                  <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                    <div />
                    <button type="button" onClick={() => updateElement(selectedElement.id, { y: Math.max(0, selectedElement.y - 4) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowUp className="w-3.5 h-3.5 text-slate-700" /></button>
                    <div />
                    <button type="button" onClick={() => updateElement(selectedElement.id, { x: Math.max(0, selectedElement.x - 2) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowLeft className="w-3.5 h-3.5 text-slate-700" /></button>
                    <div className="flex items-center justify-center text-[10px] font-mono text-slate-500 font-bold">Nudge</div>
                    <button type="button" onClick={() => updateElement(selectedElement.id, { x: Math.min(95, selectedElement.x + 2) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowRight className="w-3.5 h-3.5 text-slate-700" /></button>
                    <div />
                    <button type="button" onClick={() => updateElement(selectedElement.id, { y: Math.min(800, selectedElement.y + 4) })} className="p-2 bg-white hover:bg-slate-200 border rounded-lg shadow-xs flex items-center justify-center"><ArrowDown className="w-3.5 h-3.5 text-slate-700" /></button>
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

            {/* Branding */}
            {activeToolTab === 'branding' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Corporate Letterhead Setup</h4>
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Address</label>
                  <textarea
                    value={settings.companyAddress}
                    onChange={(e) => {
                      const updated = { ...settings, companyAddress: e.target.value };
                      voucherStorage.savePdfBrandingSettings(updated);
                      setSettings(updated);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CIN</label>
                    <input
                      type="text"
                      value={settings.cin}
                      onChange={(e) => {
                        const updated = { ...settings, cin: e.target.value };
                        voucherStorage.savePdfBrandingSettings(updated);
                        setSettings(updated);
                      }}
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={settings.gstin}
                      onChange={(e) => {
                        const updated = { ...settings, gstin: e.target.value };
                        voucherStorage.savePdfBrandingSettings(updated);
                        setSettings(updated);
                      }}
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Layers */}
            {activeToolTab === 'layers' && (
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

          </div>
        </div>

        {/* Right Panel: Interactive Visual A4 Canvas & Real-time Live Preview */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[820px] relative overflow-hidden select-none">
          
          {/* Zoom Toolbar */}
          <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-3 z-30 text-xs shadow-lg">
            <span className="text-slate-400 font-bold">Canvas Zoom:</span>
            <button type="button" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600 text-white font-bold transition-all"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="font-mono font-bold text-emerald-400 w-12 text-center">{zoomLevel}%</span>
            <button type="button" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600 text-white font-bold transition-all"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => setZoomLevel(100)} className="px-2 py-1 bg-slate-700 rounded-lg hover:bg-slate-600 text-[10px] font-bold text-slate-300">100%</button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium mb-3 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-emerald-400" /> Interactive Canvas: Drag elements to move, or drag the blue bottom-right handle to resize!
          </p>

          {/* Interactive A4 Sheet Canvas Container */}
          <div
            ref={a4CanvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            id="a4-pdf-canvas-element"
            className="bg-white rounded-lg shadow-2xl relative transition-transform duration-150 overflow-hidden border-2 border-slate-300"
            style={{
              width: '595px',
              height: '842px',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {elements.map((el) => {
              const isSelected = !isExporting && selectedElementId === el.id;
              const isOutVoucher = activeVoucher.voucherType === 'OUT(Debit)';

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el, 'move')}
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
                  {/* Interactive Canvas Element Action Toolbar with Direct Delete Option */}
                  {isSelected && (
                    <div className="absolute -top-7 left-0 bg-slate-900 text-white rounded-md text-[9px] font-bold shadow-xl flex items-center gap-1 z-40 p-0.5 border border-slate-700 select-none">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px]">
                        <Move className="w-2.5 h-2.5" />
                        <span className="max-w-[80px] truncate">{el.label}</span>
                      </div>
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(el.id, { isLocked: !el.isLocked });
                        }}
                        className={`p-1 rounded hover:bg-slate-800 ${el.isLocked ? 'text-amber-400 font-bold' : 'text-slate-300'}`}
                        title={el.isLocked ? 'Unlock Element' : 'Lock Element'}
                      >
                        {el.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateElement(el);
                        }}
                        className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
                        title="Duplicate Element"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(el.id);
                        }}
                        className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1 text-[8px]"
                        title="Delete Element Direct"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}

                  {/* Corner Resize Handle */}
                  {isSelected && !el.isLocked && (
                    <div
                      onMouseDown={(e) => handleMouseDown(e, el, 'resize')}
                      className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-md z-50 flex items-center justify-center hover:scale-125 transition-transform"
                      title="Drag to Resize"
                    />
                  )}

                  {el.type === 'logo-left' && (
                    <div className="w-full h-full bg-white text-slate-900 flex items-center justify-center font-black rounded-lg p-1 overflow-hidden">
                      {settings.leftLogoImage ? (
                        <img src={settings.leftLogoImage} alt="Left Logo" className="w-full h-full object-contain p-0.5 rounded" />
                      ) : (
                        <span className="tracking-widest text-slate-900 text-sm">{settings.leftLogoText || 'RIL'}</span>
                      )}
                    </div>
                  )}

                  {el.type === 'header' && (
                    <div className="w-full h-full bg-white text-slate-900 px-3 py-1 flex flex-col justify-center gap-1 overflow-visible">
                      <div className="font-black text-[13px] leading-tight text-slate-950 tracking-wide">{settings.companyName}</div>
                      <div className="text-[9px] leading-snug text-slate-600 font-semibold">{settings.companySubtitle}</div>
                      <div className="text-[8.5px] leading-snug text-slate-500 font-medium">{settings.companyAddress}</div>
                      <div className="text-[8px] leading-snug text-blue-700 font-mono font-bold">CIN: {settings.cin} • GSTIN: {settings.gstin} • PAN: {settings.pan}</div>
                    </div>
                  )}

                  {el.type === 'logo-right' && (
                    <div className="w-full h-full bg-white text-slate-900 flex flex-col items-center justify-center p-1 overflow-hidden">
                      {settings.rightLogoImage ? (
                        <img src={settings.rightLogoImage} alt="Stamp" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <span className="text-[7.5px] font-extrabold tracking-wider uppercase text-slate-500">{settings.rightSealTitle || 'ERP VERIFIED'}</span>
                          <span className="text-[10px] font-black tracking-widest text-slate-900">{isOutVoucher ? 'DEBIT' : 'CREDIT'}</span>
                          <span className="text-[6.5px] font-semibold text-slate-400">Raviraja CRM</span>
                        </>
                      )}
                    </div>
                  )}

                  {el.type === 'ribbon' && (
                    <div className="w-full h-full bg-white border-b border-slate-200 px-1 py-1 flex items-center justify-between font-bold text-[10px]">
                      <span className="truncate pr-2 font-black tracking-wide text-slate-950 uppercase">{isOutVoucher ? 'OUT VOUCHER (DEBIT)' : 'IN VOUCHER (CREDIT)'}</span>
                      <span className="text-slate-800 text-[9px] font-black uppercase tracking-wider">STATUS: {activeVoucher.approvalStatus?.toUpperCase() || 'APPROVED'}</span>
                    </div>
                  )}

                  {el.type === 'metadata' && (
                    <div className="w-full h-full bg-white border-b border-slate-200 py-1 grid grid-cols-2 text-[8px] text-slate-800 gap-x-6 gap-y-1 leading-normal">
                      <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-500 font-bold uppercase text-[7.5px]">Voucher No:</span> <span className="font-extrabold text-slate-950">{activeVoucher.voucherNo}</span></div>
                      <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-500 font-bold uppercase text-[7.5px]">{isOutVoucher ? 'Expenses Bill / Ref:' : 'Invoice No / Ref:'}</span> <span className="font-bold text-slate-900">{(activeVoucher as any).originalPurchaseBill || (activeVoucher as any).invoiceNumber || '-'}</span></div>
                      <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-500 font-bold uppercase text-[7.5px]">Voucher Date:</span> <span className="font-bold text-slate-900">{activeVoucher.date}</span></div>
                      <div className="flex justify-between border-b border-slate-100 pb-0.5"><span className="text-slate-500 font-bold uppercase text-[7.5px]">{isOutVoucher ? 'Expenses Date:' : 'Invoice Date:'}</span> <span className="font-bold text-slate-900">{(activeVoucher as any).purchaseBillDate || (activeVoucher as any).invoiceDate || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-[7.5px]">Accountant:</span> <span className="font-bold text-slate-900">{activeVoucher.accountantName || activeVoucher.createdBy || 'Staff'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-[7.5px]">{isOutVoucher ? 'Payment Mode:' : 'Receipt Mode:'}</span> <span className="font-extrabold text-blue-700">{(activeVoucher as any).paymentMode || (activeVoucher as any).receiptMode || 'Bank'}</span></div>
                    </div>
                  )}

                  {el.type === 'table' && (
                    <div className="w-full h-full bg-white text-[8.5px] flex flex-col justify-between leading-normal">
                      <div className="font-extrabold border-b border-slate-200 pb-1 text-slate-700 uppercase tracking-wider text-[8px]">PARTICULARS & TRANSACTION SPECIFICATION</div>
                      <div className="text-slate-800 pt-1 font-medium flex justify-between border-b border-slate-100 pb-0.5">
                        <span className="text-slate-500 font-bold">{isOutVoucher ? 'Supplier / Payee Name :-' : 'Customer / Party Name :-'}</span>
                        <span className="font-extrabold text-slate-950">{(activeVoucher as any).supplierName || (activeVoucher as any).customerName || '-'}</span>
                      </div>
                      <div className="text-slate-800 font-medium flex justify-between border-b border-slate-100 pb-0.5">
                        <span className="text-slate-500 font-bold">{isOutVoucher ? 'Supplier GSTIN :-' : 'Customer GSTIN :-'}</span>
                        <span className="font-mono font-bold text-slate-900">{(activeVoucher as any).supplierGstin || (activeVoucher as any).customerGstin || '-'}</span>
                      </div>
                      <div className="text-slate-700 pt-0.5 font-medium leading-relaxed">
                        <span className="text-slate-500 font-bold">Purpose / Description :- </span>{activeVoucher.description || 'Corporate voucher transaction'}
                      </div>
                    </div>
                  )}

                  {el.type === 'amount' && (
                    <div className="w-full h-full bg-white border-y border-slate-200 py-2 text-[9px] flex flex-col justify-center leading-normal">
                      <div className="font-bold text-[10px] flex items-center justify-between pb-1">
                        <span className="text-slate-600 uppercase text-[8px] font-bold">{isOutVoucher ? 'AMOUNT PAID (IN FIGURES):' : 'AMOUNT RECEIVED (IN FIGURES):'}</span>
                        <span className="text-sm font-black text-slate-950 font-mono">₹{activeVoucher.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-[8.5px] italic text-slate-800 pt-1 border-t border-slate-100 font-medium">
                        <span className="text-slate-500 not-italic uppercase text-[7.5px] font-bold mr-1">Amount in Words:</span> {activeVoucher.amountInWords || 'Zero Rupees Only'}
                      </div>
                    </div>
                  )}

                  {el.type === 'terms' && (
                    <div className="w-full h-full bg-white border-b border-slate-200 py-1 text-[7.5px] text-slate-600 flex flex-col justify-between leading-relaxed">
                      <strong className="text-slate-500 uppercase tracking-wide font-extrabold text-[8px]">TERMS & CONDITIONS:</strong>
                      {settings.terms.slice(0, 3).map((t, i) => (
                        <div key={i} className="py-0.2 leading-normal font-medium">{t}</div>
                      ))}
                    </div>
                  )}

                  {el.type === 'signatures' && (
                    <div className="w-full h-full grid grid-cols-3 gap-6 pt-2">
                      <div className="border-t-2 border-slate-800 pt-1 text-[8px] flex flex-col justify-between">
                        <strong className="text-slate-500 uppercase tracking-wider text-[7.5px] font-bold">PREPARED BY</strong>
                        <div className="font-extrabold text-slate-950 text-[9.5px] my-0.5">{activeVoucher.createdBy || 'Staff'}</div>
                        <div className="text-[7px] text-slate-400 font-medium">Date: {activeVoucher.date}</div>
                      </div>
                      <div className="border-t-2 border-slate-800 pt-1 text-[8px] flex flex-col justify-between">
                        <strong className="text-slate-500 uppercase tracking-wider text-[7.5px] font-bold">APPROVED BY</strong>
                        <div className="font-extrabold text-slate-950 text-[9.5px] my-0.5">{activeVoucher.approvedBy || 'Authorised Manager'}</div>
                        <div className="text-[7px] text-slate-500 font-medium">Authorised Signatory & Seal</div>
                      </div>
                      <div className="border-t-2 border-slate-800 pt-1 text-[8px] flex flex-col justify-between">
                        <strong className="text-slate-500 uppercase tracking-wider text-[7.5px] font-bold">{isOutVoucher ? 'CASHIER / PAYEE' : 'RECEIVED BY'}</strong>
                        <div className="font-extrabold text-slate-950 text-[9.5px] my-0.5">{(activeVoucher as any).cashierName || (activeVoucher as any).receivedBy || 'Staff'}</div>
                        <div className="text-[7px] text-slate-400 font-medium">Acknowledgement Signature</div>
                      </div>
                    </div>
                  )}

                  {el.type === 'shape' && (
                    <div className="w-full h-full bg-blue-600 rounded" />
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
