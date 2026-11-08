import React, { useState } from 'react';
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
  Layout
} from 'lucide-react';
import { voucherStorage, PdfBrandingSettings } from '../../utils/voucherStorage';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { CreditVoucher } from '../../types/voucher';

interface PdfEditorTabProps {
  onNotify: (msg: string) => void;
}

export const PdfEditorTab: React.FC<PdfEditorTabProps> = ({ onNotify }) => {
  const [settings, setSettings] = useState<PdfBrandingSettings>(() => voucherStorage.getPdfBrandingSettings());
  const [newTerm, setNewTerm] = useState('');

  const handleChange = (field: keyof PdfBrandingSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyLogoPreset = (type: 'left' | 'right', size: 'small' | 'medium' | 'large') => {
    if (type === 'left') {
      const dims = size === 'small' ? { w: 15, h: 20 } : size === 'medium' ? { w: 20, h: 24 } : { w: 26, h: 30 };
      setSettings(prev => ({ ...prev, leftLogoSize: size, leftLogoWidth: dims.w, leftLogoHeight: dims.h }));
    } else {
      const dims = size === 'small' ? { w: 22, h: 20 } : size === 'medium' ? { w: 32, h: 24 } : { w: 40, h: 30 };
      setSettings(prev => ({ ...prev, rightLogoSize: size, rightLogoWidth: dims.w, rightLogoHeight: dims.h }));
    }
  };

  const handleLeftLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify('Please upload a valid image file for the left logo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        handleChange('leftLogoImage', res);
        onNotify('Left company logo uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRightLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify('Please upload a valid image file for the right stamp.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        handleChange('rightLogoImage', res);
        onNotify('Right seal logo uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setSettings(prev => ({
      ...prev,
      terms: [...prev.terms, newTerm.trim()]
    }));
    setNewTerm('');
  };

  const handleRemoveTerm = (index: number) => {
    setSettings(prev => ({
      ...prev,
      terms: prev.terms.filter((_, idx) => idx !== index)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    voucherStorage.savePdfBrandingSettings(settings);
    onNotify('Professional PDF & Excel branding configuration saved successfully!');
  };

  const handleReset = () => {
    const defaultSet = voucherStorage.resetPdfBrandingSettings();
    setSettings(defaultSet);
    onNotify('PDF branding reset to Raviraja Industries default enterprise standards.');
  };

  const handleTestPrint = () => {
    voucherStorage.savePdfBrandingSettings(settings);
    const sampleVoucher: CreditVoucher = {
      id: 'test-sample-001',
      voucherNo: 'IN-TEST-999',
      date: new Date().toISOString().split('T')[0],
      voucherType: 'IN(Credit)',
      receiptMode: 'Bank',
      amount: 1250000,
      amountInWords: 'Twelve Lakh Fifty Thousand Rupees Only',
      customerName: 'Tata Projects Limited',
      receiptType: 'Party Payment',
      description: 'Sample preview test voucher for layout inspection',
      invoiceNumber: 'TPL/INV/2026/TEST',
      invoiceDate: new Date().toISOString().split('T')[0],
      approvedBy: 'Lakshmi Narayana',
      approvalStatus: 'Approved',
      receivedBy: 'Suresh Kumar',
      remarks: 'Test sample print preview',
      attachments: [],
      auditTrail: [],
      createdBy: 'Suresh Kumar',
      createdAt: new Date().toISOString(),
      updatedBy: 'Suresh Kumar',
      updatedAt: new Date().toISOString(),
    };
    try {
      generateVoucherPdf(sampleVoucher, false);
      onNotify('Sample test PDF generated and downloaded successfully!');
    } catch (err) {
      onNotify('Error generating sample PDF. Please check configuration.');
    }
  };

  const getThemeBg = () => {
    switch (settings.headerTheme) {
      case 'slate': return 'bg-slate-800';
      case 'emerald': return 'bg-emerald-900';
      case 'dark': return 'bg-zinc-950';
      default: return 'bg-blue-950';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Document Desk</span>
            <span>/</span>
            <span className="font-semibold text-blue-700">Enterprise PDF Layout & Branding Studio</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center text-sm font-black shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            Professional ERP PDF & Header Customization Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise letterheads, professional logo presets, secure seals, and statutory terms & conditions with live responsive preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleTestPrint}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Main Split Workbench: Left Controls (7 cols) | Right Live Preview (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Panel: Professional Controls */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Theme & Header Style */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-100 pb-3">
              <Layout className="w-4 h-4" />
              <span>1. Corporate Header Theme & Letterhead Info</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Header Theme Palette</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'navy', label: 'Classic Navy', bg: 'bg-blue-950' },
                    { id: 'slate', label: 'Enterprise Slate', bg: 'bg-slate-800' },
                    { id: 'emerald', label: 'Emerald Corporate', bg: 'bg-emerald-900' },
                    { id: 'dark', label: 'Obsidian Dark', bg: 'bg-zinc-950' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleChange('headerTheme', t.id)}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all ${
                        settings.headerTheme === t.id
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 text-blue-900'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full ${t.bg} shadow-xs`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-900"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Subtitle / Tagline</label>
                <input
                  type="text"
                  value={settings.companySubtitle}
                  onChange={(e) => handleChange('companySubtitle', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Office Address & Location</label>
                <input
                  type="text"
                  value={settings.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CIN</label>
                <input
                  type="text"
                  value={settings.cin}
                  onChange={(e) => handleChange('cin', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Left Logo Setup & Professional Presets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-100 pb-3">
              <ImageIcon className="w-4 h-4" />
              <span>2. Left Logo Setup & Professional Size Presets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Left Logo Text (if no image)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={settings.leftLogoText}
                  onChange={(e) => handleChange('leftLogoText', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Left Logo Image</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleLeftLogoUpload} className="hidden" />
                  </label>
                  {settings.leftLogoImage && (
                    <button
                      type="button"
                      onClick={() => handleChange('leftLogoImage', '')}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 rounded-md border border-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Left Logo Size Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Compact (15mm)' },
                    { id: 'medium', label: 'Standard (20mm)' },
                    { id: 'large', label: 'Large (26mm)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyLogoPreset('left', p.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        settings.leftLogoSize === p.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Right Stamp / Seal Setup & Presets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>3. Right Seal / Stamp Setup & Size Presets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Right Seal Title</label>
                <input
                  type="text"
                  value={settings.rightSealTitle}
                  onChange={(e) => handleChange('rightSealTitle', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Right Stamp Image</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Stamp</span>
                    <input type="file" accept="image/*" onChange={handleRightLogoUpload} className="hidden" />
                  </label>
                  {settings.rightLogoImage && (
                    <button
                      type="button"
                      onClick={() => handleChange('rightLogoImage', '')}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 rounded-md border border-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Right Seal Size Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Compact (22mm)' },
                    { id: 'medium', label: 'Standard (32mm)' },
                    { id: 'large', label: 'Large (40mm)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyLogoPreset('right', p.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        settings.rightLogoSize === p.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Terms & Conditions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4" />
              <span>4. Terms & Conditions Clauses</span>
            </div>

            <div className="space-y-2">
              {settings.terms.map((term, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => {
                      const updated = [...settings.terms];
                      updated[index] = e.target.value;
                      setSettings(prev => ({ ...prev, terms: updated }));
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add new clause..."
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTerm(); } }}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

        </div>

        {/* Right Panel: Clean Responsive A4 Preview */}
        <div className="xl:col-span-5 space-y-4 sticky top-5">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Live Enterprise A4 Document Preview</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              Perfect Layout
            </span>
          </div>

          {/* Simulated A4 Sheet */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-2xl space-y-4 text-[11px] text-slate-800 font-sans relative overflow-hidden">
            
            {/* Header with Left & Right Logos (Clean white, no background box) */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              
              {/* Left Logo Preview */}
              <div 
                className="flex items-center justify-center font-bold text-slate-900 shrink-0"
                style={{ width: settings.leftLogoSize === 'small' ? '44px' : settings.leftLogoSize === 'large' ? '70px' : '56px' }}
              >
                {settings.leftLogoImage ? (
                  <img src={settings.leftLogoImage} alt="Left Logo" className="w-full h-full object-contain rounded" />
                ) : (
                  <span className="text-xl font-black tracking-widest text-slate-950">{settings.leftLogoText || 'RIL'}</span>
                )}
              </div>

              {/* Center Corporate Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-tight truncate">{settings.companyName}</h4>
                <p className="text-[9px] text-slate-600 font-medium mt-0.5 truncate">{settings.companySubtitle}</p>
                <p className="text-[8px] text-slate-500 mt-0.5 truncate">{settings.companyAddress}</p>
                <p className="text-[8px] text-blue-700 mt-1 font-mono font-bold">CIN: {settings.cin} • GSTIN: {settings.gstin}</p>
              </div>

              {/* Right Seal Preview */}
              <div 
                className="text-right shrink-0"
                style={{ width: settings.rightLogoSize === 'small' ? '65px' : settings.rightLogoSize === 'large' ? '95px' : '80px' }}
              >
                {settings.rightLogoImage ? (
                  <img src={settings.rightLogoImage} alt="Right Stamp" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">{settings.rightSealTitle}</span>
                    <span className="text-[10px] font-black text-slate-900 block">CREDIT (IN)</span>
                    <span className="text-[7px] text-slate-400 block">Raviraja ERP</span>
                  </>
                )}
              </div>

            </div>

            {/* Voucher Title Ribbon (Clean text, no colored box) */}
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between font-bold text-slate-950">
              <span className="text-xs font-black uppercase">IN VOUCHER (CREDIT)</span>
              <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider">STATUS: APPROVED</span>
            </div>

            {/* Metadata Grid (Clean 2-col rows, no box) */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 py-1 border-b border-slate-200 text-[9.5px]">
              <div className="flex justify-between border-b border-slate-100 pb-0.5"><strong className="text-slate-500 uppercase text-[8px]">Voucher No:</strong> <span className="font-bold text-slate-900">IN-0001</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5"><strong className="text-slate-500 uppercase text-[8px]">Invoice No:</strong> <span className="font-bold text-slate-900">INV/2026/01</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5"><strong className="text-slate-500 uppercase text-[8px]">Date:</strong> <span>2026-11-06</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5"><strong className="text-slate-500 uppercase text-[8px]">Receipt Mode:</strong> <span className="font-bold text-blue-700">Bank</span></div>
              <div className="flex justify-between"><strong className="text-slate-500 uppercase text-[8px]">Party Name:</strong> <span className="font-bold text-slate-900">Tata Projects Ltd</span></div>
              <div className="flex justify-between"><strong className="text-slate-500 uppercase text-[8px]">Amount:</strong> <span className="font-bold text-slate-900">₹12,50,000</span></div>
            </div>

            {/* Terms Preview */}
            <div className="py-2 border-b border-slate-200 text-[8.5px] text-slate-600 space-y-0.5">
              <strong className="text-slate-500 uppercase tracking-wide text-[8px] block">Terms & Conditions:</strong>
              {settings.terms.slice(0, 3).map((t, idx) => (
                <div key={idx} className="truncate">• {t}</div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-[8px] text-slate-400 text-center pt-2">
              {settings.footerText} • Page 1 of 1
            </div>

          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Apply Layout Settings
          </button>
        </div>

      </div>
    </div>
  );
};
