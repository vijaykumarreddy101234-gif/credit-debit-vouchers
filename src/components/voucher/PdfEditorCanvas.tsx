import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Save,
  RotateCcw,
  ImagePlus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Palette,
  Building2,
  ScrollText,
  Eye,
  Printer,
} from 'lucide-react';
import { voucherStorage, PdfBrandingSettings, DEFAULT_PDF_BRANDING } from '../../utils/voucherStorage';
import { buildVoucherPdf, savePdfFile, PdfBrandingOptions } from '../../utils/pdfGenerator';
import { CreditVoucher, DebitVoucher, InVoucher } from '../../types/voucher';
import { PdfPreview } from './PdfPreview';

interface PdfEditorCanvasProps {
  onNotify: (msg: string) => void;
  initialVoucher?: InVoucher;
}

const THEMES: Array<{ id: PdfBrandingSettings['headerTheme']; label: string; swatch: string }> = [
  { id: 'navy', label: 'Navy', swatch: '#0f2044' },
  { id: 'slate', label: 'Slate', swatch: '#1e293b' },
  { id: 'emerald', label: 'Emerald', swatch: '#064e3b' },
  { id: 'dark', label: 'Onyx', swatch: '#0a0a0c' },
];

/** Shrinks an uploaded logo so it fits comfortably in browser storage and the PDF. */
const fileToLogoDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const src = String(reader.result);
      const img = new window.Image();
      img.onerror = () => reject(new Error('Not a valid image'));
      img.onload = () => {
        const max = 480;
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';
const labelCls = 'mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
    <h4 className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200">{icon}</span>
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </section>
);

export const PdfEditorCanvas: React.FC<PdfEditorCanvasProps> = ({ onNotify, initialVoucher }) => {
  const [templateType, setTemplateType] = useState<'IN' | 'OUT'>(initialVoucher?.voucherType === 'OUT(Debit)' ? 'OUT' : 'IN');
  const [settings, setSettings] = useState<PdfBrandingSettings>(() => voucherStorage.getPdfBrandingSettings());
  const [panel, setPanel] = useState<'edit' | 'preview'>('preview'); // mobile/tablet toggle
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [includeDocs, setIncludeDocs] = useState(false);
  const leftFile = useRef<HTMLInputElement>(null);
  const rightFile = useRef<HTMLInputElement>(null);

  const creditVouchers = voucherStorage.getCreditVouchers();
  const debitVouchers = voucherStorage.getDebitVouchers();
  const available = templateType === 'IN' ? creditVouchers : debitVouchers;
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>(initialVoucher?.id || available[0]?.id || '');

  const sample = useMemo<InVoucher>(() => {
    const today = new Date().toISOString().split('T')[0];
    const base = {
      id: `sample-${templateType}`,
      date: today,
      amount: 1550000,
      amountInWords: 'Fifteen Lakh Fifty Thousand Rupees Only',
      description:
        templateType === 'IN'
          ? 'Advance payment against supply of heavy industrial profiles'
          : 'Payment for high-grade industrial structural steel supply',
      approvalStatus: 'Approved' as const,
      approvedBy: 'Lakshmi Narayana',
      attachments: [],
      auditTrail: [],
      createdBy: 'Suresh Kumar',
      createdAt: today,
      updatedBy: 'Suresh Kumar',
      updatedAt: today,
      accountantName: 'Staff Accountant',
    };
    return templateType === 'IN'
      ? ({
          ...base,
          voucherNo: 'IN-0001',
          voucherType: 'IN(Credit)',
          receiptMode: 'Bank',
          receiptType: 'Party Payment',
          customerName: 'Tata Projects Limited',
          customerGstin: '36AABCT2345M1Z2',
          invoiceNumber: 'TPL/HYD/PO/2026/8942',
          invoiceDate: today,
          receivedBy: 'Suresh Kumar',
        } as CreditVoucher)
      : ({
          ...base,
          voucherNo: 'OUT-0001',
          voucherType: 'OUT(Debit)',
          paymentMode: 'Bank',
          supplierDetails: 'Supplier',
          supplierName: 'Steel Authority of India Ltd (SAIL)',
          supplierGstin: '20AAACS2501F1ZY',
          originalPurchaseBill: 'SAIL/BOK/2026/9102',
          purchaseBillDate: today,
          cashierName: 'Suresh Kumar',
        } as DebitVoucher);
  }, [templateType]);

  const activeVoucher: InVoucher = available.find((v) => v.id === selectedVoucherId) || available[0] || sample;

  const pdfOptions = (s: PdfBrandingSettings): PdfBrandingOptions => ({
    companyName: s.companyName,
    companySubtitle: s.companySubtitle,
    companyAddress: s.companyAddress,
    cin: s.cin,
    gstin: s.gstin,
    pan: s.pan,
    leftLogoText: s.leftLogoText,
    leftLogoImage: s.leftLogoImage,
    rightLogoImage: s.rightLogoImage,
    rightBadgeTop: s.rightSealTitle,
    terms: s.terms,
    footerDisclaimer: s.footerText,
    headerTheme: s.headerTheme,
  });

  // Live preview: regenerate (debounced) whenever the voucher or branding changes
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const { doc } = buildVoucherPdf(activeVoucher, includeDocs, pdfOptions(settings));
        setPdfData(doc.output('arraybuffer'));
      } catch (e) {
        console.error('Preview build failed', e);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, activeVoucher.id, templateType, includeDocs]);

  const update = (patch: Partial<PdfBrandingSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    voucherStorage.savePdfBrandingSettings(next);
  };

  const switchType = (t: 'IN' | 'OUT') => {
    setTemplateType(t);
    const list = t === 'IN' ? creditVouchers : debitVouchers;
    setSelectedVoucherId(list[0]?.id || '');
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToLogoDataUrl(file);
      update(side === 'left' ? { leftLogoImage: dataUrl } : { rightLogoImage: dataUrl });
      onNotify(side === 'left' ? 'Company logo updated.' : 'Right stamp image updated.');
    } catch (err: any) {
      onNotify(err?.message || 'Could not use that image.');
    }
  };

  const handleDownload = () => {
    try {
      const { doc, fileName } = buildVoucherPdf(activeVoucher, includeDocs, pdfOptions(settings));
      savePdfFile(doc, fileName);
      onNotify(`Downloaded ${fileName}`);
    } catch (err: any) {
      console.error(err);
      onNotify(`Error generating PDF: ${err?.message || 'Check fields'}`);
    }
  };

  const handleOpen = () => {
    const { doc } = buildVoucherPdf(activeVoucher, includeDocs, pdfOptions(settings));
    window.open(String(doc.output('bloburl')), '_blank');
  };

  const handleReset = () => {
    const fresh = voucherStorage.resetPdfBrandingSettings();
    setSettings({ ...DEFAULT_PDF_BRANDING, ...fresh });
    onNotify('PDF branding reset to defaults.');
  };

  const isOut = templateType === 'OUT';
  const hasAttachments = (activeVoucher.attachments?.length || 0) > 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 pb-10">
      {/* Header / actions */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_-18px_rgba(15,23,42,0.25)]">
        <div className={`h-1.5 w-full ${isOut ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">PDF Studio</p>
            <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Voucher PDF Management</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Edit branding once — every IN and OUT voucher PDF updates, exactly as shown below.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchType('IN')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${!isOut ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" /> IN (Credit)
              </button>
              <button
                type="button"
                onClick={() => switchType('OUT')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${isOut ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> OUT (Debit)
              </button>
            </div>

            <select
              aria-label="Voucher to preview"
              value={activeVoucher.id}
              onChange={(e) => setSelectedVoucherId(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 shadow-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-auto sm:max-w-[320px]"
            >
              {available.length === 0 && <option value={activeVoucher.id}>Sample {templateType} voucher</option>}
              {available.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.voucherNo} · {(v as any).customerName || (v as any).supplierName || 'Voucher'} (₹{v.amount?.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Printer className="h-3.5 w-3.5" /> Open / Print
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset branding
          </button>
          {hasAttachments && (
            <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={includeDocs} onChange={(e) => setIncludeDocs(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
              Append attached documents
            </label>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 sm:ml-0">
            <Save className="h-3.5 w-3.5" /> Changes save automatically
          </span>
        </div>
      </div>

      {/* Mobile / tablet segmented toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-xs lg:hidden">
        {(
          [
            ['preview', 'Live Preview', <Eye key="e" className="h-3.5 w-3.5" />],
            ['edit', 'Edit Branding', <Palette key="p" className="h-3.5 w-3.5" />],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanel(id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${panel === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Branding controls */}
        <div className={`${panel === 'edit' ? 'block' : 'hidden'} space-y-4 lg:col-span-5 lg:block xl:col-span-4`}>
          <Section icon={<Building2 className="h-3.5 w-3.5" />} title="Company details">
            <div>
              <label className={labelCls}>Company name</label>
              <input className={field} value={settings.companyName} onChange={(e) => update({ companyName: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input className={field} value={settings.companySubtitle} onChange={(e) => update({ companySubtitle: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Registered address</label>
              <textarea rows={2} className={field} value={settings.companyAddress} onChange={(e) => update({ companyAddress: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
              {(
                [
                  ['CIN', 'cin'],
                  ['GSTIN', 'gstin'],
                  ['PAN', 'pan'],
                ] as const
              ).map(([lbl, key]) => (
                <div key={key}>
                  <label className={labelCls}>{lbl}</label>
                  <input className={`${field} font-mono uppercase`} value={settings[key]} onChange={(e) => update({ [key]: e.target.value } as any)} />
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<ImagePlus className="h-3.5 w-3.5" />} title="Logo & stamp">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['Company logo', settings.leftLogoImage, leftFile, 'left'],
                  ['Right stamp', settings.rightLogoImage, rightFile, 'right'],
                ] as const
              ).map(([lbl, img, ref, side]) => (
                <div key={side}>
                  <label className={labelCls}>{lbl}</label>
                  <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
                    {img ? (
                      <img src={img} alt={lbl} className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <span className="px-2 text-center text-[11px] font-medium text-slate-400">{side === 'left' ? 'Shows initials' : 'Shows ERP badge'}</span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => ref.current?.click()}
                      className="flex-1 rounded-lg bg-indigo-50 px-2 py-2 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Upload
                    </button>
                    {img && (
                      <button
                        type="button"
                        aria-label={`Remove ${lbl}`}
                        onClick={() => update(side === 'left' ? { leftLogoImage: '' } : { rightLogoImage: '' })}
                        className="rounded-lg bg-rose-50 px-2.5 py-2 text-rose-600 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e, side)} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Logo initials</label>
                <input className={field} maxLength={4} value={settings.leftLogoText} onChange={(e) => update({ leftLogoText: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Badge caption</label>
                <input className={field} value={settings.rightSealTitle} onChange={(e) => update({ rightSealTitle: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section icon={<Palette className="h-3.5 w-3.5" />} title="Header colour">
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update({ headerTheme: t.id })}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] font-bold transition ${
                    settings.headerTheme === t.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-500/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="h-6 w-full rounded-md" style={{ background: t.swatch }} />
                  {t.label}
                </button>
              ))}
            </div>
          </Section>

          <Section icon={<ScrollText className="h-3.5 w-3.5" />} title="Terms & footer">
            <div>
              <label className={labelCls}>Terms (one per line)</label>
              <textarea
                rows={4}
                className={field}
                value={(settings.terms || []).join('\n')}
                onChange={(e) => update({ terms: e.target.value.split('\n') })}
                onBlur={(e) => update({ terms: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean) })}
              />
            </div>
            <div>
              <label className={labelCls}>Footer text</label>
              <input className={field} value={settings.footerText} onChange={(e) => update({ footerText: e.target.value })} />
            </div>
          </Section>
        </div>

        {/* Live PDF preview */}
        <div className={`${panel === 'preview' ? 'block' : 'hidden'} lg:col-span-7 lg:block xl:col-span-8 lg:sticky lg:top-0`}>
          <div className="rounded-3xl bg-gradient-to-b from-slate-200/70 to-slate-300/50 p-3 sm:p-5 ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <Eye className="h-3.5 w-3.5" /> Live preview · A4 · {activeVoucher.voucherNo}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${isOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isOut ? 'OUT · Debit' : 'IN · Credit'}
              </span>
            </div>
            <div className="mx-auto w-full max-w-[760px] lg:max-h-[calc(100vh-170px)] lg:overflow-y-auto lg:pr-1">
              <PdfPreview data={pdfData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
