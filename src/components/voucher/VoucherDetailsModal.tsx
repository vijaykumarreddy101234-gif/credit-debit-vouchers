import { useAccess } from '../AccessContext';
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
  CheckCircle2,
  Briefcase,
  Trash2
} from 'lucide-react';
import { InVoucher, CreditVoucher, DebitVoucher } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { DocumentUploadSection } from './DocumentUploadSection';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface VoucherDetailsModalProps {
  voucher: InVoucher | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (voucher: InVoucher) => void;
  onEdit?: (voucher: InVoucher) => void;
  onDelete?: (voucher: InVoucher) => void;
}

export const VoucherDetailsModal: React.FC<VoucherDetailsModalProps> = ({
  voucher,
  isOpen,
  onClose,
  onPrint,
  onEdit,
  onDelete,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  if (!isOpen || !voucher) return null;
  const isOut = voucher.voucherType === 'OUT(Debit)';
  const { can } = useAccess();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-lg text-white flex items-center justify-center font-black text-xs ${
              isOut ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              {isOut ? 'OUT' : 'IN'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {voucher.voucherNo}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isOut
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {voucher.voucherType}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                   voucher.approvalStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                   voucher.approvalStatus === 'Rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                   'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {voucher.approvalStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created by {voucher.createdBy} on {new Date(voucher.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && can(isOut ? 'out.edit' : 'in.edit') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(voucher);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}
            {onDelete && can(isOut ? 'out.delete' : 'in.delete') && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Delete this voucher permanently"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            )}
            {can('pdf.download') && (
<button
              type="button"
              onClick={() => generateVoucherPdf(voucher)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
)}
            {can('pdf.download') && (
<button
              type="button"
              onClick={() => {
                onClose();
                onPrint(voucher);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
)}
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
                {voucher.date}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">{isOut ? 'Payment Mode' : 'Receipt Mode'}</span>
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                <CreditCard className="w-3.5 h-3.5" />
                {isOut ? (voucher as DebitVoucher).paymentMode : (voucher as CreditVoucher).receiptMode}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Invoice Number</span>
              <span className="text-xs font-semibold text-slate-800 truncate block mt-0.5" title={voucher.invoiceNumber}>
                {voucher.invoiceNumber || 'None'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Total Amount</span>
              <span className={`text-sm font-mono font-black block mt-0.5 ${isOut ? 'text-rose-700' : 'text-emerald-700'}`}>
                {formatIndianCurrency(voucher.amount)}
              </span>
            </div>
          </div>

          {/* Amount In Words Ribbon */}
          <div className={`${isOut ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-3.5 text-xs`}>
            <span className={`${isOut ? 'text-rose-800' : 'text-emerald-800'} font-bold uppercase text-[10px] tracking-wider block`}>
              Amount in Words (INR):
            </span>
            <p className={`${isOut ? 'text-rose-950' : 'text-emerald-950'} font-semibold italic mt-0.5`}>
              "{voucher.amountInWords}"
            </p>
          </div>

          {/* Detailed Fields Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              {isOut ? 'Supplier & Payment Details' : 'Customer & Receipt Details'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-400 text-[11px] block">{isOut ? 'Supplier Name' : 'Customer Name'}:</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {isOut ? (voucher as DebitVoucher).supplierName : (voucher as CreditVoucher).customerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{isOut ? 'Supplier GSTIN' : 'Customer GSTIN'}:</span>
                <span className="font-bold text-slate-700">
                  {isOut ? (voucher as DebitVoucher).supplierGstin || '-' : (voucher as CreditVoucher).customerGstin || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Person Name:</span>
                <span className="font-semibold text-slate-800">{voucher.personName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Accountant Name:</span>
                <span className="font-semibold text-slate-800">{voucher.accountantName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Reference Date:</span>
                <span className="font-semibold text-slate-800">{voucher.referenceDate || '-'}</span>
              </div>
              {isOut ? (
                <>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Expenses Bill No:</span>
                    <span className="font-semibold text-slate-800">{(voucher as DebitVoucher).originalPurchaseBill || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Expenses Bill Date:</span>
                    <span className="font-semibold text-slate-800">{(voucher as DebitVoucher).purchaseBillDate || '-'}</span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-slate-400 text-[11px] block">Reference Details:</span>
                  <span className="font-semibold text-slate-800">{voucher.referenceDetails || '-'}</span>
                </div>
              )}
              {isOut && (voucher as DebitVoucher).prepaidAmount && (
                <div>
                  <span className="text-slate-400 text-[11px] block">Prepaid Amount:</span>
                  <span className="font-bold text-rose-600">{formatIndianCurrency((voucher as DebitVoucher).prepaidAmount || 0)}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <span className="text-slate-400 text-[11px] block">Note / Reason:</span>
              <p className="text-slate-800 mt-0.5 font-medium leading-relaxed italic">
                {voucher.noteReason || 'No specific reason provided.'}
              </p>
            </div>

            <div className="pt-2">
              <span className="text-slate-400 text-[11px] block">Purpose / Description:</span>
              <p className="text-slate-800 mt-0.5 font-medium leading-relaxed">{voucher.description}</p>
            </div>

            {voucher.remarks && (
              <div className="pt-1">
                <span className="text-slate-400 text-[11px] block">Additional Remarks:</span>
                <p className="text-slate-600 italic mt-0.5">{voucher.remarks}</p>
              </div>
            )}

            {voucher.items && voucher.items.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-[11px] block mb-1">Itemized Particulars ({voucher.items.length} items):</span>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">Item / Description</th>
                        <th className="py-1.5 px-2 text-center">Qty</th>
                        <th className="py-1.5 px-2 text-right">Rate (₹)</th>
                        <th className="py-1.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {voucher.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-medium text-slate-800">{it.name}</td>
                          <td className="py-1.5 px-2 text-center font-mono">{it.qty || 1}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{it.rate ? formatIndianCurrency(it.rate) : '-'}</td>
                          <td className="py-1.5 px-3 text-right font-bold font-mono text-slate-900">{formatIndianCurrency(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Signatures & Authorizations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Internal Authorizations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Prepared By</span>
                <span className="font-bold text-slate-900 block mt-1">{voucher.createdBy}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Date: {voucher.date}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Approved By</span>
                <span className="font-bold text-slate-900 block mt-1">{voucher.approvedBy || 'Pending'}</span>
                <span className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${voucher.approvalStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {voucher.approvalStatus === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {voucher.approvalStatus}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{isOut ? 'Cashier Name' : 'Received By'}</span>
                <span className="font-bold text-slate-900 block mt-1">
                  {isOut ? (voucher as DebitVoucher).cashierName : (voucher as CreditVoucher).receivedBy}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block italic">Electronic Signature recorded</span>
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
                Audit Trail & Log
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
            System ID: <code className="font-mono text-slate-700">{voucher.id}</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>

      {/* In-App Confirmation Modal for Voucher Deletion */}
      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        title="Delete Voucher"
        message={`Are you sure you want to permanently delete ${voucher.voucherType} "${voucher.voucherNo}"?`}
        details={`Party / Vendor: ${voucher.personName || (voucher as any).supplierName || (voucher as any).customerName || '-'} • Amount: ${formatIndianCurrency(voucher.amount)} • Date: ${voucher.date}`}
        confirmLabel="Delete Voucher"
        onConfirm={() => {
          setShowConfirmDelete(false);
          if (onDelete) onDelete(voucher);
          onClose();
        }}
        onClose={() => setShowConfirmDelete(false)}
      />
    </div>
  );
};

