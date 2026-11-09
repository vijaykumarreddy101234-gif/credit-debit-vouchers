import { useAccess } from '../AccessContext';
import React, { useState } from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  Building2,
  ShieldCheck,
  FileText,
  BadgePercent,
  Edit3,
  Paperclip,
  X,
  FileUp,
  Files
} from 'lucide-react';
import { InVoucher, CreditVoucher, DebitVoucher } from '../../types/voucher';
import { formatIndianCurrency, numberToIndianWords } from '../../utils/numberToWordsIndian';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { voucherStorage } from '../../utils/voucherStorage';

interface PrintableVoucherProps {
  voucher: InVoucher;
  onBack: () => void;
  onEdit?: () => void;
}

export const PrintableVoucher: React.FC<PrintableVoucherProps> = ({
  voucher: initialVoucher,
  onBack,
  onEdit,
}) => {
  const [voucher, setVoucher] = useState<InVoucher>(initialVoucher);
  const isOut = voucher.voucherType === 'OUT(Debit)';
  const { can } = useAccess();
  const storedBranding = voucherStorage.getPdfBrandingSettings();
  const headerHex =
    ({ navy: '#0f2044', slate: '#1e293b', emerald: '#064e3b', dark: '#0a0a0c' } as Record<string, string>)[storedBranding.headerTheme] || '#0f2044';

  // Editable Header Details State
  const [companyName, setCompanyName] = useState(storedBranding.companyName || 'RAVIRAJA INDUSTRIES PRIVATE LIMITED');
  const [companySubtitle, setCompanySubtitle] = useState(storedBranding.companySubtitle || 'Manufacturers & Suppliers of Heavy Engineering & Industrial Equipment');
  const [companyAddress, setCompanyAddress] = useState(storedBranding.companyAddress || 'Plot No. 44 & 45, Phase III, IDA Jeedimetla, Hyderabad - 500055, Telangana, India');
  const [cinNumber, setCinNumber] = useState(storedBranding.cin || 'U28112TG2015PTC099412');
  const [gstinNumber, setGstinNumber] = useState(storedBranding.gstin || '36AABCR1234F1Z8');
  const [panNumber, setPanNumber] = useState(storedBranding.pan || 'AABCR1234F');
  
  // Left and Right Logo Labels
  const [leftLogoText, setLeftLogoText] = useState(storedBranding.leftLogoText || 'RIL');
  const [rightBadgeTop, setRightBadgeTop] = useState(storedBranding.rightSealTitle || 'ERP VERIFIED');
  const [rightBadgeCenter, setRightBadgeCenter] = useState(isOut ? 'DEBIT' : 'CREDIT');
  const [rightBadgeBottom, setRightBadgeBottom] = useState('Raviraja CRM');

  // Editable Terms and Conditions
  const [termsText, setTermsText] = useState(
    storedBranding.terms?.length
      ? storedBranding.terms.join('\n')
      : '1. Subject to Hyderabad jurisdiction.\n2. Payment acknowledged subject to realization of cheque / RTGS.\n3. This voucher is valid only when bearing authorized sign-off and official company seal.'
  );

  // Editable Footer
  const [footerDisclaimer, setFooterDisclaimer] = useState(
    storedBranding.footerText || 'Raviraja CRM Accounts Desk • Authenticated Voucher'
  );

  // Print Mode Options Modal
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'print' | 'pdf'>('print');
  const [printWithAttachments, setPrintWithAttachments] = useState<boolean>(true);
  const [printAttachmentOnly, setPrintAttachmentOnly] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  const getBrandingOptions = () => ({
    companyName,
    companySubtitle,
    companyAddress,
    cin: cinNumber,
    gstin: gstinNumber,
    pan: panNumber,
    leftLogoText,
    rightBadgeTop,
    rightBadgeCenter,
    rightBadgeBottom,
    terms: termsText.split('\n').filter(Boolean),
    footerDisclaimer,
  });

  const handleSaveChanges = () => {
    // 1. Update voucher in storage
    if (voucher.voucherType === 'OUT(Debit)') {
      voucherStorage.saveDebitVoucher(voucher as DebitVoucher);
    } else {
      voucherStorage.saveCreditVoucher(voucher as CreditVoucher);
    }

    // 2. Update branding in storage
    voucherStorage.savePdfBrandingSettings({
      companyName,
      companySubtitle,
      companyAddress,
      cin: cinNumber,
      gstin: gstinNumber,
      pan: panNumber,
      leftLogoText,
      rightSealTitle: rightBadgeTop,
      terms: termsText.split('\n').filter(Boolean),
      footerText: footerDisclaimer,
    });

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleFieldChange = (field: string, value: any) => {
    setVoucher((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'amount') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          updated.amountInWords = numberToIndianWords(num);
        }
      }
      return updated as InVoucher;
    });
  };

  const openPrintOptions = (action: 'print' | 'pdf') => {
    handleSaveChanges();
    // If voucher has attachments, ask how user wants to print
    if (voucher.attachments && voucher.attachments.length > 0) {
      setPendingAction(action);
      setShowPrintModal(true);
    } else {
      // Direct print / pdf if no attachments
      if (action === 'pdf') {
        generateVoucherPdf(voucher, false, getBrandingOptions());
      } else {
        setPrintWithAttachments(false);
        setPrintAttachmentOnly(false);
        setTimeout(() => window.print(), 100);
      }
    }
  };

  const executeAction = (includeDocs: boolean, docsOnly: boolean = false) => {
    setShowPrintModal(false);
    if (pendingAction === 'pdf') {
      generateVoucherPdf(voucher, includeDocs, getBrandingOptions());
    } else {
      setPrintWithAttachments(includeDocs);
      setPrintAttachmentOnly(docsOnly);
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const inputClasses = "w-full p-0 border-none bg-transparent focus:ring-0 focus:outline-none print:placeholder-transparent leading-normal";
  const labelClasses = "font-bold text-slate-500 uppercase text-[10px] tracking-wider";

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification for Saving */}
      {showSavedToast && (
        <div className="no-print fixed top-16 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Voucher and corporate branding changes saved successfully!</span>
        </div>
      )}

      {/* Top Action Bar (hidden in print) */}
      <div className="no-print bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              handleSaveChanges();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Register</span>
          </button>
          <div>
            <span className="text-[10px] text-blue-700 font-black block tracking-wider uppercase">
              100% Fully Editable Print View
            </span>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="font-mono text-blue-700">{voucher.voucherNo}</span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                voucher.approvalStatus === 'Approved'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {voucher.approvalStatus}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="Save changes to voucher and corporate branding"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Save Edits</span>
          </button>

          {onEdit && can(isOut ? 'out.edit' : 'in.edit') && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Form Editor</span>
            </button>
          )}

          {can('pdf.download') && (
<button
            type="button"
            onClick={() => openPrintOptions('pdf')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
)}

          {can('pdf.download') && (
<button
            type="button"
            onClick={() => openPrintOptions('print')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print (A4)</span>
          </button>
)}
        </div>
      </div>

      {/* PRINT PROMPT MODAL: Asks whether to print with upload or separate */}
      {showPrintModal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Print & Filing Options</h3>
                  <p className="text-[11px] text-slate-500">Supporting documents attached: {voucher.attachments?.length || 0}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                How would you like to print this voucher and its uploaded attachments?
              </p>

              {/* Option 1: Voucher + Attachment Together */}
              <button
                type="button"
                onClick={() => executeAction(true, false)}
                className="w-full p-3.5 rounded-xl border-2 border-blue-600 bg-blue-50/50 hover:bg-blue-100/60 text-left transition-all flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Files className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-blue-900 block group-hover:underline">
                    Voucher + Attached Document/Photo Together (Recommended)
                  </span>
                  <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
                    Appends supporting invoices & photos right after the voucher. Easy for physical filing!
                  </span>
                </div>
              </button>

              {/* Option 2: Voucher Only */}
              <button
                type="button"
                onClick={() => executeAction(false, false)}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block group-hover:underline">
                    Print Voucher Only
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Prints single-page official voucher without appended attachment sheets.
                  </span>
                </div>
              </button>

              {/* Option 3: Attached Documents Separately */}
              {pendingAction === 'print' && (
                <button
                  type="button"
                  onClick={() => executeAction(true, true)}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-purple-300 bg-white hover:bg-purple-50 text-left transition-all flex items-start gap-3 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-900 block group-hover:underline">
                      Print Attached Documents Separately
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Prints only the uploaded invoices and photos on separate filing sheets.
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAN A4 PRINT CONTAINER (Borderless Executive Layout) */}
      <div className="flex justify-center overflow-x-auto pb-6">
        <div
          className="printable-voucher-container w-full max-w-[210mm] bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] print:shadow-none print:w-full print:max-w-none print:m-0 rounded-2xl print:rounded-none overflow-hidden text-slate-900 min-w-[320px] ring-1 ring-slate-200 print:ring-0"
          style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
        >

          {/* PAGE 1: OFFICIAL VOUCHER (mirrors the PDF layout exactly) */}
          <div className={printAttachmentOnly ? 'print:hidden' : ''}>

            {/* HEADER BAND */}
            <div className="px-5 sm:px-8 py-5 text-white" style={{ background: headerHex, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-[72px] h-[72px] shrink-0 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1.5">
                  {storedBranding.leftLogoImage ? (
                    <img src={storedBranding.leftLogoImage} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <input
                      type="text"
                      maxLength={4}
                      value={leftLogoText}
                      onChange={(e) => setLeftLogoText(e.target.value.toUpperCase())}
                      className="w-full text-center bg-transparent border-none font-black text-xl p-0 focus:ring-0 focus:outline-none"
                      style={{ color: headerHex }}
                      title="Editable logo initials"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-base sm:text-lg font-extrabold text-white tracking-tight border-none p-0 focus:ring-0 focus:outline-none bg-transparent leading-snug"
                    title="Editable Company Name"
                  />
                  <input
                    type="text"
                    value={companySubtitle}
                    onChange={(e) => setCompanySubtitle(e.target.value)}
                    className="w-full text-[11px] text-slate-200 font-semibold border-none p-0 focus:ring-0 focus:outline-none bg-transparent"
                    title="Editable Subtitle"
                  />
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full text-[10.5px] text-slate-300 border-none p-0 focus:ring-0 focus:outline-none bg-transparent"
                    title="Editable Registered Address"
                  />
                  <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-cyan-200 pt-0.5">
                    <span>CIN:</span>
                    <input value={cinNumber} onChange={(e) => setCinNumber(e.target.value)} className="w-[9.5rem] font-bold text-cyan-200 border-none p-0 focus:ring-0 focus:outline-none bg-transparent" />
                    <span className="text-slate-500">|</span>
                    <span>PAN:</span>
                    <input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} className="w-24 font-bold text-cyan-200 border-none p-0 focus:ring-0 focus:outline-none bg-transparent" />
                  </div>
                </div>

                <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                  {storedBranding.rightLogoImage ? (
                    <img src={storedBranding.rightLogoImage} alt="" className="max-h-16 max-w-[160px] object-contain" />
                  ) : (
                    <>
                      <input
                        type="text"
                        value={rightBadgeTop}
                        onChange={(e) => setRightBadgeTop(e.target.value)}
                        className="w-28 sm:text-right text-[9px] font-bold uppercase tracking-[0.2em] border-none p-0 focus:ring-0 bg-transparent text-slate-300"
                      />
                      <input
                        type="text"
                        value={rightBadgeCenter}
                        onChange={(e) => setRightBadgeCenter(e.target.value.toUpperCase())}
                        className={`w-28 text-center text-[11px] font-extrabold tracking-[0.18em] text-white rounded-full py-1.5 border-none focus:ring-0 ${isOut ? 'bg-rose-600' : 'bg-emerald-600'}`}
                        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                      />
                      <input
                        type="text"
                        value={rightBadgeBottom}
                        onChange={(e) => setRightBadgeBottom(e.target.value)}
                        className="w-28 sm:text-right text-[9px] text-slate-300 border-none p-0 focus:ring-0 bg-transparent"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* two-tone hairline */}
            <div className="flex h-1" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <div className={`${isOut ? 'bg-rose-600' : 'bg-emerald-600'} w-[62%]`} />
              <div className={`${isOut ? 'bg-orange-600' : 'bg-blue-600'} w-[38%]`} />
            </div>

            <div className="px-5 sm:px-8 pt-6 pb-6">

              {/* TITLE ROW */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                    {isOut ? 'Payment Voucher' : 'Receipt Voucher'}
                  </h2>
                  <p className={`mt-1.5 text-[10.5px] font-bold tracking-[0.2em] ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isOut ? 'OUT · DEBIT' : 'IN · CREDIT'}
                  </p>
                </div>
                <span
                  className={`px-3.5 py-1.5 rounded-full text-[10.5px] font-extrabold tracking-wider ${
                    voucher.approvalStatus === 'Approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : voucher.approvalStatus === 'Pending'
                      ? 'bg-amber-100 text-amber-700'
                      : voucher.approvalStatus === 'Rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                  style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  {voucher.approvalStatus.toUpperCase()}
                </span>
              </div>

              {/* DETAILS: 6 coloured cards (same as PDF) */}
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                {([
                  { label: 'Voucher Number', c: isOut ? 'rose' : 'emerald', node: (
                    <input className={`${inputClasses} font-extrabold text-sm ${isOut ? 'text-rose-600' : 'text-emerald-600'}`} value={voucher.voucherNo} onChange={(e) => handleFieldChange('voucherNo', e.target.value)} />
                  ) },
                  { label: 'Voucher Date', c: 'blue', node: (
                    <input type="date" className={`${inputClasses} font-bold text-sm text-slate-900`} value={voucher.date} onChange={(e) => handleFieldChange('date', e.target.value)} />
                  ) },
                  { label: isOut ? 'Payment Mode' : 'Receipt Mode', c: 'violet', node: (
                    <select className={`${inputClasses} font-bold text-sm text-slate-900 appearance-none cursor-pointer`}
                      value={isOut ? (voucher as DebitVoucher).paymentMode : (voucher as CreditVoucher).receiptMode}
                      onChange={(e) => handleFieldChange(isOut ? 'paymentMode' : 'receiptMode', e.target.value)}>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI</option>
                      <option value="Other">Other</option>
                    </select>
                  ) },
                  { label: isOut ? 'Expenses Bill / Ref' : 'Invoice No / Ref', c: 'amber', node: (
                    <input className={`${inputClasses} font-bold text-sm text-slate-900`} placeholder="N/A"
                      value={isOut ? ((voucher as DebitVoucher).originalPurchaseBill || '') : (voucher.invoiceNumber || (voucher as CreditVoucher).referenceDetails || '')}
                      onChange={(e) => handleFieldChange(isOut ? 'originalPurchaseBill' : 'invoiceNumber', e.target.value)} />
                  ) },
                  { label: isOut ? 'Expenses Date' : 'Invoice Date', c: 'teal', node: (
                    <input type="date" className={`${inputClasses} font-bold text-sm text-slate-900`}
                      value={isOut ? ((voucher as DebitVoucher).purchaseBillDate || '') : (voucher.invoiceDate || voucher.referenceDate || '')}
                      onChange={(e) => handleFieldChange(isOut ? 'purchaseBillDate' : 'invoiceDate', e.target.value)} />
                  ) },
                  { label: 'Accountant', c: 'slate', node: (
                    <input className={`${inputClasses} font-bold text-sm text-slate-900`} placeholder="Staff Accountant"
                      value={voucher.accountantName || ''} onChange={(e) => handleFieldChange('accountantName', e.target.value)} />
                  ) },
                ] as const).map((cell) => {
                  const palette: Record<string, string> = {
                    rose: 'bg-rose-50 border-rose-600 text-rose-600',
                    emerald: 'bg-emerald-50 border-emerald-600 text-emerald-600',
                    blue: 'bg-blue-50 border-blue-600 text-blue-600',
                    violet: 'bg-violet-50 border-violet-600 text-violet-600',
                    amber: 'bg-amber-50 border-amber-600 text-amber-600',
                    teal: 'bg-teal-50 border-teal-600 text-teal-600',
                    slate: 'bg-slate-50 border-slate-600 text-slate-600',
                  };
                  return (
                    <div key={cell.label} className={`rounded-lg border-l-[3px] px-3.5 py-2.5 ${palette[cell.c]}`}>
                      <span className="block text-[9px] font-extrabold uppercase tracking-[0.18em]">{cell.label}</span>
                      <div className="mt-1 text-slate-900">{cell.node}</div>
                    </div>
                  );
                })}
              </div>

              {/* SECTION: PARTICULARS */}
              <div
                className={`flex items-center gap-2.5 rounded-lg border-l-[3px] px-3.5 py-2 mb-1 text-[10.5px] font-extrabold uppercase tracking-[0.18em] ${isOut ? 'bg-rose-50 border-rose-600 text-rose-600' : 'bg-emerald-50 border-emerald-600 text-emerald-600'}`}
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                Particulars & Transaction Specification
              </div>

              <div className="text-xs mb-6">
                {(() => {
                  const row = (label: string, node: React.ReactNode, main = false) => (
                    <div key={label} className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-2 py-2.5 border-b border-slate-200 ${main ? 'bg-blue-50' : ''}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <span className={`w-44 shrink-0 pt-0.5 text-[10px] font-extrabold uppercase tracking-wider ${main ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span>
                      <div className="flex-1 min-w-0">{node}</div>
                    </div>
                  );
                  return (
                    <>
                      {isOut ? (
                        <>
                          {row('Supplier / Payee', <input className={`${inputClasses} font-extrabold text-sm text-slate-950`} value={(voucher as DebitVoucher).supplierName} onChange={(e) => handleFieldChange('supplierName', e.target.value)} />, true)}
                        </>
                      ) : (
                        <>
                          {row('Customer / Party', <input className={`${inputClasses} font-extrabold text-sm text-slate-950`} value={(voucher as CreditVoucher).customerName} onChange={(e) => handleFieldChange('customerName', e.target.value)} />, true)}
                        </>
                      )}
                      {row(isOut ? 'Payment Purpose' : 'Receipt Purpose', <textarea rows={2} className={`${inputClasses} text-slate-900 leading-relaxed resize-none font-medium`} value={voucher.description} onChange={(e) => handleFieldChange('description', e.target.value)} />)}
                      {voucher.noteReason && row('Note / Reason', <input className={`${inputClasses} text-slate-700 italic font-medium`} value={voucher.noteReason || ''} onChange={(e) => handleFieldChange('noteReason', e.target.value)} />)}
                    </>
                  );
                })()}

                {voucher.items && voucher.items.length > 0 && (
                  <div className="pt-5">
                    <div className="overflow-x-auto rounded-lg">
                      <table className="w-full text-xs text-left border-collapse min-w-[420px]">
                        <thead>
                          <tr className="text-white text-[9.5px] uppercase tracking-wider" style={{ background: headerHex, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <th className="py-2 px-3 font-bold rounded-l-lg w-8">#</th>
                            <th className="py-2 px-2 font-bold">Description</th>
                            <th className="py-2 px-2 text-right font-bold">Qty</th>
                            <th className="py-2 px-2 text-right font-bold">Rate</th>
                            <th className="py-2 px-3 text-right font-bold rounded-r-lg">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voucher.items.map((it, idx) => (
                            <tr key={idx} className={`border-b border-slate-100 ${idx % 2 ? 'bg-slate-50' : ''}`}>
                              <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-2 font-medium text-slate-900">{it.name}</td>
                              <td className="py-2 px-2 text-right tabular-nums">{it.qty || 1}{it.unit ? ` ${it.unit}` : ''}</td>
                              <td className="py-2 px-2 text-right tabular-nums">{it.rate ? formatIndianCurrency(it.rate) : '-'}</td>
                              <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-950">{formatIndianCurrency(it.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* AMOUNT CARD */}
              <div
                className={`rounded-2xl border-2 px-5 py-4 mb-6 ${isOut ? 'bg-rose-50 border-rose-600' : 'bg-emerald-50 border-emerald-600'}`}
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                <span className={`block text-[10px] font-extrabold uppercase tracking-[0.2em] ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                  Total Amount {isOut ? 'Paid' : 'Received'}
                </span>
                <div className="flex items-center gap-2 mt-1 text-3xl font-extrabold text-slate-950 tracking-tight">
                  <span>₹</span>
                  <input
                    type="number"
                    className="w-full max-w-[16rem] border-none bg-transparent p-0 focus:ring-0 font-extrabold text-3xl text-slate-950"
                    value={voucher.amount}
                    onChange={(e) => handleFieldChange('amount', e.target.value)}
                  />
                </div>
                <div className="text-[11px] font-bold text-slate-500 tabular-nums">
                  ₹ {Number(voucher.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="block mt-3 text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-500">Amount in words</span>
                <textarea
                  rows={1}
                  className={`${inputClasses} text-sm font-semibold text-slate-950 italic resize-none leading-relaxed`}
                  value={voucher.amountInWords}
                  onChange={(e) => handleFieldChange('amountInWords', e.target.value)}
                />
              </div>

              {/* TERMS */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <div className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-amber-600 mb-1">Terms & Conditions</div>
                <textarea
                  rows={3}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  className="w-full text-[11px] text-slate-600 border-none bg-transparent p-0 focus:ring-0 focus:outline-none resize-none leading-relaxed font-medium"
                  title="Editable terms and conditions"
                />
              </div>

              {/* SIGNATURES: 3 coloured boxes */}
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3 text-xs mb-6" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                {([
                  { role: 'Approved By', tone: isOut ? 'bg-rose-50 border-rose-600 text-rose-600' : 'bg-emerald-50 border-emerald-600 text-emerald-600', node: (
                    <input className={`${inputClasses} font-extrabold text-slate-950 text-xs`} value={voucher.approvedBy || ''} placeholder="Authorized Manager" onChange={(e) => handleFieldChange('approvedBy', e.target.value)} />
                  ), sub: 'Authorised Signatory & Seal' },
                  { role: isOut ? 'Cashier / Payee' : 'Received By', tone: 'bg-violet-50 border-violet-600 text-violet-600', node: (
                    <input className={`${inputClasses} font-extrabold text-slate-950 text-xs`} placeholder="Name"
                      value={isOut ? ((voucher as DebitVoucher).cashierName || '') : ((voucher as CreditVoucher).receivedBy || '')}
                      onChange={(e) => handleFieldChange(isOut ? 'cashierName' : 'receivedBy', e.target.value)} />
                  ), sub: 'Acknowledgement Signature' },
                ] as const).map((sig) => (
                  <div key={sig.role} className={`rounded-xl px-4 pt-14 pb-3 ${sig.tone.split(' ').slice(0, 1).join(' ')}`}>
                    <div className={`border-t-2 pt-2 ${sig.tone.split(' ').slice(1, 2).join(' ')}`}>
                      <span className={`block text-[9px] font-extrabold uppercase tracking-[0.2em] ${sig.tone.split(' ')[2]}`}>{sig.role}</span>
                      <div className="mt-1">{sig.node}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{sig.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-400">
                <input
                  type="text"
                  value={footerDisclaimer}
                  onChange={(e) => setFooterDisclaimer(e.target.value)}
                  className="w-full sm:w-3/4 border-none bg-transparent p-0 text-[10px] text-slate-400 focus:ring-0"
                  title="Editable Footer Disclaimer"
                />
                <span className="shrink-0 font-semibold text-slate-500">Page 1</span>
              </div>
            </div>
            <div className="flex h-1.5" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <div className={`${isOut ? 'bg-rose-600' : 'bg-emerald-600'} w-[62%]`} />
              <div className={`${isOut ? 'bg-orange-600' : 'bg-blue-600'} w-[38%]`} />
            </div>
          </div>

          {/* PAGE 2+: UPLOADED DOCUMENTS & PHOTOS */}
          {printWithAttachments && voucher.attachments && voucher.attachments.length > 0 && (
            <div className="mx-5 sm:mx-8 mb-8 mt-2 pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page">
              <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    SUPPORTING DOCUMENT / INVOICE FILING SHEET
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Attached to Voucher No: <strong className="font-mono text-slate-800">{voucher.voucherNo}</strong> • Date: {voucher.date}
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                  {voucher.attachments.length} Document(s)
                </span>
              </div>

              <div className="space-y-6">
                {voucher.attachments.map((att, idx) => (
                  <div key={att.id} className="rounded-xl p-4 bg-slate-50/50 print:bg-transparent border border-slate-100">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">Doc #{idx + 1}: {att.name}</span>
                        <span className="text-[10px] text-slate-500">
                          Type: {att.type} • Uploaded: {new Date(att.uploadedAt).toLocaleString()} • Size: {(att.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                        ERP VERIFIED ATTACHMENT
                      </span>
                    </div>

                    {/* Image preview */}
                    {att.mimeType.startsWith('image/') ? (
                      <div className="flex justify-center p-2 bg-white rounded-lg">
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="max-h-[500px] w-auto max-w-full object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="p-6 bg-white rounded-lg border border-slate-200 text-center space-y-2">
                        <FileText className="w-12 h-12 mx-auto text-rose-500 stroke-1" />
                        <p className="text-xs font-bold text-slate-800">{att.name}</p>
                        <p className="text-[10px] text-slate-500">PDF electronic document securely recorded with this voucher.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200 text-[10px] text-slate-400 text-right">
                Filing Attachment Page • Raviraja Industries Pvt Ltd
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
