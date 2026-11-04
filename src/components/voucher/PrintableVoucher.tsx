import React from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  Building2,
  ShieldCheck,
  FileText,
  BadgePercent
} from 'lucide-react';
import { InVoucher } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { generateVoucherPdf } from '../../utils/pdfGenerator';

interface PrintableVoucherProps {
  voucher: InVoucher;
  onBack: () => void;
  onEdit?: () => void;
}

export const PrintableVoucher: React.FC<PrintableVoucherProps> = ({
  voucher,
  onBack,
  onEdit,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateVoucherPdf(voucher);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Register
          </button>
          <div>
            <span className="text-xs text-slate-500">Print Preview Mode</span>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Voucher: <span className="font-mono text-blue-700">{voucher.voucherNo}</span>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                {voucher.status}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            >
              Edit Voucher
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Voucher (A4)
          </button>
        </div>
      </div>

      {/* A4 Document Container */}
      <div className="flex justify-center">
        <div className="printable-voucher-container w-full max-w-[210mm] bg-white shadow-lg print:shadow-none print:w-full print:max-w-none print:m-0 rounded-xl print:rounded-none border border-slate-300 print:border-none p-8 print:p-6 text-slate-900">
          
          {/* Company Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-2xl tracking-tighter shadow-sm print:border print:border-black">
                  RIL
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    RAVIRAJA INDUSTRIES PRIVATE LIMITED
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Manufacturers & Suppliers of Heavy Engineering & Industrial Equipment
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Plot No. 44 & 45, Phase III, IDA Jeedimetla, Hyderabad - 500055, Telangana, India
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 text-[10px] font-semibold text-slate-700 mt-1">
                    <span>CIN: <strong className="font-mono">U28112TG2015PTC099412</strong></span>
                    <span>•</span>
                    <span>GSTIN: <strong className="font-mono">36AABCR1234F1Z8</strong></span>
                    <span>•</span>
                    <span>PAN: <strong className="font-mono">AABCR1234F</strong></span>
                  </div>
                </div>
              </div>

              {/* Verified Receipt / Payment Stamp */}
              <div className="text-right shrink-0">
                <div className={`inline-block border-2 rounded-lg p-2 text-center print:bg-transparent ${
                  voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)'
                    ? 'border-rose-600 bg-rose-50/50'
                    : 'border-emerald-600 bg-emerald-50/50'
                }`}>
                  <span className={`block text-[10px] font-bold uppercase tracking-widest ${
                    voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'text-rose-800' : 'text-emerald-800'
                  }`}>
                    FINANCE DEPT
                  </span>
                  <span className={`block text-xs font-black ${
                    voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'DEBIT VOUCHER' : 'CREDIT VOUCHER'}
                  </span>
                  <span className="block text-[9px] font-medium text-slate-600">
                    RAVIRAJA CRM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="bg-slate-100 print:bg-slate-200 border-y border-slate-300 py-2 px-4 mb-5 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">
              {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)'
                ? 'OUT VOUCHER (DEBIT / PAYMENT)'
                : 'IN VOUCHER (CREDIT / RECEIPT)'}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>TYPE: <span className={`font-mono ${voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'text-rose-700' : 'text-emerald-700'}`}>
                {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'OUT(Debit)' : 'IN(Credit)'}
              </span></span>
              <span>|</span>
              <span>ORIGINAL COPY</span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 border border-slate-300 rounded-md overflow-hidden text-xs mb-5">
            <div className="p-3 border-r border-slate-300 space-y-2 bg-slate-50/40 print:bg-transparent">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Voucher Number:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{voucher.voucherNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Voucher Date:</span>
                <span className="font-medium text-slate-900">{voucher.voucherDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Voucher Type:</span>
                <span className={`font-bold ${
                  voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'OUT(Debit)' : 'IN(Credit)'}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Reference Details:</span>
                <span className="font-medium text-slate-900 text-right">{voucher.referenceDetails || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Reference Date:</span>
                <span className="font-medium text-slate-900">{voucher.referenceDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Payment Mode:</span>
                <span className="font-bold text-blue-800">
                  {voucher.paymentMode}
                  {voucher.paymentModeDetails?.chequeNo && ` (Chq: ${voucher.paymentModeDetails.chequeNo})`}
                  {voucher.paymentModeDetails?.transactionRef && ` (Ref: ${voucher.paymentModeDetails.transactionRef})`}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Voucher Content Table */}
          <table className="w-full border-collapse border border-slate-300 text-xs mb-5">
            <tbody>
              {/* Conditional Rows based on Voucher Type */}
              {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? (
                /* OUT Voucher Sketch Fields */
                <>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Person Name :-
                    </td>
                    <td className="p-3 font-semibold text-slate-900 text-sm">
                      {voucher.personName || voucher.receivedFrom}
                    </td>
                  </tr>
                  {voucher.supplierGstin && (
                    <tr className="border-b border-slate-300">
                      <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                        Supplier GSTIN
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {voucher.supplierGstin}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Original Purchase Bill & Date
                    </td>
                    <td className="p-3 text-slate-900 font-medium">
                      {voucher.originalPurchaseBill || 'N/A'}{' '}
                      {voucher.purchaseBillDate && `[Bill Date: ${voucher.purchaseBillDate}]`}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Note / Reason (OUT)
                    </td>
                    <td className="p-3 text-slate-800">
                      {voucher.noteReason || 'Payment recorded per internal corporate accounting audit procedure.'}
                    </td>
                  </tr>
                </>
              ) : (
                /* IN Voucher Original Fields */
                <>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Accountant Name (Account of A/C)
                    </td>
                    <td className="p-3 font-bold text-blue-900 text-sm">
                      {voucher.accountName}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Reference Details & Date
                    </td>
                    <td className="p-3 text-slate-900 font-medium">
                      {voucher.referenceDetails || 'N/A'}{' '}
                      {voucher.referenceDate && `[Ref Date: ${voucher.referenceDate}]`}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Payment Particulars
                    </td>
                    <td className="p-3 text-slate-800 leading-relaxed">
                      {voucher.paymentParticulars || 'Being payment received towards commercial supply order / ledger settlement.'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Note / Reason (IN)
                    </td>
                    <td className="p-3 text-slate-800">
                      {voucher.noteReason || 'Receipt recorded per internal corporate accounting audit procedure.'}
                    </td>
                  </tr>
                </>
              )}

              {voucher.particularsNotes && (
                <tr className="border-b border-slate-300">
                  <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                    Internal Particulars / Notes
                  </td>
                  <td className="p-3 text-slate-700 italic">
                    {voucher.particularsNotes}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Amount Box */}
          <div className="border-2 border-slate-900 rounded-lg p-4 mb-6 bg-slate-50/70 print:bg-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  Amount Received (in figures):
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatIndianCurrency(voucher.amount)}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded">
                  INR {Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <span className="text-[11px] font-bold uppercase text-slate-600 block">
                Amount in Words (Indian Rupees):
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 italic mt-0.5">
                "{voucher.amountInWords}"
              </p>
            </div>
          </div>

          {/* Attached Documents Notice (if any) */}
          {voucher.attachments && voucher.attachments.length > 0 && (
            <div className="mb-6 p-2.5 border border-dashed border-slate-300 rounded text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">Supporting Attachments Recorded:</span>{' '}
              {voucher.attachments.map((a, i) => (
                <span key={a.id} className="inline-block mr-2">
                  [{a.type}] {a.name}{i < voucher.attachments.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Sign-Off Details Section (3 Signatures Columns) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden grid grid-cols-3 text-center text-xs mb-6">
            {/* Prepared By */}
            <div className="p-4 border-r border-slate-300 flex flex-col justify-between h-36">
              <span className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                Prepared By
              </span>
              <div className="py-2">
                <div className="font-semibold text-slate-900 text-xs">
                  {voucher.preparedBy || 'Accounts Officer'}
                </div>
                <div className="text-[10px] text-slate-500">Finance & Accounts</div>
              </div>
              <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500 font-medium">
                Signature & Date: {voucher.voucherDate}
              </div>
            </div>

            {/* Passed By */}
            <div className="p-4 border-r border-slate-300 flex flex-col justify-between h-36 bg-slate-50/30 print:bg-transparent">
              <span className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                Passed By / Authorized Signatory
              </span>
              <div className="py-2">
                <div className="font-semibold text-slate-900 text-xs">
                  {voucher.passedBy || 'Accounts Manager'}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  ✓ Verified & Authorized
                </div>
              </div>
              <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500 font-medium">
                Official Signature & Seal
              </div>
            </div>

            {/* Receiver's Signature */}
            <div className="p-4 flex flex-col justify-between h-36">
              <span className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                Receiver's Signature
              </span>
              <div className="flex items-center justify-center py-1">
                {voucher.receiverSignature && voucher.receiverSignature.startsWith('data:image') ? (
                  <img
                    src={voucher.receiverSignature}
                    alt="Receiver Signature"
                    className="max-h-14 max-w-full object-contain"
                  />
                ) : (
                  <span className="italic text-slate-400 text-xs font-serif">
                    (Receiver Signature on Record)
                  </span>
                )}
              </div>
              <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500 font-medium">
                Customer / Payee Acknowledgment
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500">
            <span>
              Generated under Raviraja CRM Voucher Desk • System Authenticated Voucher ID: {voucher.id}
            </span>
            <span className="font-mono mt-1 sm:mt-0">
              Page 1 of 1 • Raviraja Industries Pvt Ltd
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
