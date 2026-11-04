import React from 'react';
import {
  X,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Building2,
  User,
  Clock,
  ShieldCheck,
  FileText,
  History,
  CheckCircle2
} from 'lucide-react';
import { InVoucher } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { DocumentUploadSection } from './DocumentUploadSection';

interface VoucherDetailsModalProps {
  voucher: InVoucher | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (voucher: InVoucher) => void;
  onEdit?: (voucher: InVoucher) => void;
}

export const VoucherDetailsModal: React.FC<VoucherDetailsModalProps> = ({
  voucher,
  isOpen,
  onClose,
  onPrint,
  onEdit,
}) => {
  if (!isOpen || !voucher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-lg text-white flex items-center justify-center font-black text-xs ${
              voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'OUT' : 'IN'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {voucher.voucherNo}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? 'OUT(Debit)' : 'IN(Credit)'}
                </span>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {voucher.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created by {voucher.createdBy} on {new Date(voucher.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(voucher);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => generateVoucherPdf(voucher)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onPrint(voucher);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Quick Summary Banner */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Voucher Date</span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {voucher.voucherDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Payment Mode</span>
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                <CreditCard className="w-3.5 h-3.5" />
                {voucher.paymentMode}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Reference</span>
              <span className="text-xs font-semibold text-slate-800 truncate block mt-0.5" title={voucher.referenceDetails}>
                {voucher.referenceDetails || 'None'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Total Received</span>
              <span className="text-sm font-mono font-black text-emerald-700 block mt-0.5">
                {formatIndianCurrency(voucher.amount)}
              </span>
            </div>
          </div>

          {/* Amount In Words Ribbon */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs">
            <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider block">
              Amount in Words (INR):
            </span>
            <p className="font-semibold text-emerald-950 italic mt-0.5">
              "{voucher.amountInWords}"
            </p>
          </div>

          {/* Detailed Fields Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Accounting & Party Details
            </h4>
            
            {/* Conditional Content based on Voucher Type */}
            {voucher.voucherType === 'OUT' || voucher.voucherType === 'OUT(Debit)' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-slate-400 text-[11px] block">Person Name :-</span>
                  <span className="font-semibold text-slate-900 text-sm">{voucher.personName || voucher.receivedFrom}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Supplier GSTIN:</span>
                  <span className="font-mono font-bold text-slate-900">{voucher.supplierGstin || 'Not Provided / Unregistered'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Original Purchase Bill:</span>
                  <span className="font-semibold text-blue-900">{voucher.originalPurchaseBill || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Purchase Bill Date:</span>
                  <span className="font-medium text-slate-800">{voucher.purchaseBillDate || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-slate-400 text-[11px] block">Accountant Name (Account of A/C):</span>
                  <span className="font-bold text-blue-900 text-sm">{voucher.accountName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Reference Details:</span>
                  <span className="font-semibold text-slate-800">{voucher.referenceDetails || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Reference Date:</span>
                  <span className="font-medium text-slate-800">{voucher.referenceDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Payment Particulars:</span>
                  <span className="font-medium text-slate-800">{voucher.paymentParticulars || '-'}</span>
                </div>
              </div>
            )}

            <div className="pt-1">
              <span className="text-slate-400 text-[11px] block">Note / Reason:</span>
              <p className="text-slate-800 mt-0.5">{voucher.noteReason || '-'}</p>
            </div>

            {voucher.particularsNotes && (
              <div className="pt-1">
                <span className="text-slate-400 text-[11px] block">Internal Notes:</span>
                <p className="text-slate-600 italic mt-0.5">{voucher.particularsNotes}</p>
              </div>
            )}
          </div>

          {/* Signatures & Authorizations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Signatures & Authorizations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Prepared By</span>
                <span className="font-bold text-slate-900 block mt-1">{voucher.preparedBy}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Date: {voucher.voucherDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Passed / Authorized By</span>
                <span className="font-bold text-slate-900 block mt-1">{voucher.passedBy}</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved & Passed
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Receiver's Signature</span>
                <div className="h-12 flex items-center justify-center my-1 bg-white rounded border border-slate-200 overflow-hidden">
                  {voucher.receiverSignature && voucher.receiverSignature.startsWith('data:image') ? (
                    <img src={voucher.receiverSignature} alt="Receiver Sign" className="max-h-10 object-contain" />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Signature on Record</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <DocumentUploadSection
            attachments={voucher.attachments || []}
            onChange={() => {}}
            readOnly={true}
          />

          {/* Audit History Timeline */}
          {voucher.auditTrail && voucher.auditTrail.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2 text-xs">
                <History className="w-4 h-4 text-slate-600" />
                Audit Trail & History Log
              </h4>
              <div className="space-y-3">
                {voucher.auditTrail.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs border-l-2 border-blue-500 pl-3 py-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        By <strong className="text-slate-700">{log.performedBy}</strong> ({log.role})
                        {log.details && ` - ${log.details}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Internal ID: <code className="font-mono text-slate-700">{voucher.id}</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
