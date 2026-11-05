import { useState, useEffect } from 'react';
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
import { InVoucher, CreditVoucher, DebitVoucher } from '../../types/voucher';
import { formatIndianCurrency, numberToIndianWords } from '../../utils/numberToWordsIndian';
import { generateVoucherPdf } from '../../utils/pdfGenerator';

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

  const handleFieldChange = (field: string, value: any) => {
    setVoucher(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-update amount in words if amount changes
      if (field === 'amount') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          updated.amountInWords = numberToIndianWords(num);
        }
      }
      
      return updated as InVoucher;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateVoucherPdf(voucher);
  };

  const inputClasses = "w-full p-0 border-none bg-transparent focus:ring-0 focus:outline-none print:placeholder-transparent";
  const labelClasses = "font-semibold text-slate-600";

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back to Register</span>
            <span className="xs:hidden">Back</span>
          </button>
          <div>
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold block sm:inline">EDITABLE PRINT PREVIEW</span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-blue-700">{voucher.voucherNo}</span>
              <span className="text-[9px] sm:text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-300">
                {voucher.approvalStatus}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2 overflow-x-auto">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              Full Editor
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print (A4)
          </button>
        </div>
      </div>

      {/* A4 Document Container */}
      <div className="flex justify-center overflow-x-auto pb-6">
        <div className="printable-voucher-container w-full max-w-[210mm] bg-white shadow-lg print:shadow-none print:w-full print:max-w-none print:m-0 rounded-xl print:rounded-none border border-slate-300 print:border-none p-4 sm:p-8 print:p-6 text-slate-900 min-w-[320px]">
          
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
                  isOut ? 'border-rose-600 bg-rose-50/50' : 'border-emerald-600 bg-emerald-50/50'
                }`}>
                  <span className={`block text-[10px] font-bold uppercase tracking-widest ${
                    isOut ? 'text-rose-800' : 'text-emerald-800'
                  }`}>
                    FINANCE DEPT
                  </span>
                  <span className={`block text-xs font-black ${
                    isOut ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {isOut ? 'DEBIT VOUCHER' : 'CREDIT VOUCHER'}
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
              {isOut ? 'OUT VOUCHER (DEBIT / PAYMENT)' : 'IN VOUCHER (CREDIT / RECEIPT)'}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>TYPE: <span className={`font-mono ${isOut ? 'text-rose-700' : 'text-emerald-700'}`}>
                {voucher.voucherType}
              </span></span>
              <span>|</span>
              <span>ORIGINAL COPY</span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 border border-slate-300 rounded-md overflow-hidden text-xs mb-5">
            <div className="p-3 border-r border-slate-300 space-y-2 bg-slate-50/40 print:bg-transparent">
              <div className="flex justify-between items-center gap-2">
                <span className={labelClasses}>Voucher Number:</span>
                <input 
                  className={`${inputClasses} font-mono font-bold text-slate-900 text-sm text-right`}
                  value={voucher.voucherNo}
                  onChange={(e) => handleFieldChange('voucherNo', e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className={labelClasses}>Voucher Date:</span>
                <input 
                  type="date"
                  className={`${inputClasses} font-medium text-slate-900 text-right`}
                  value={voucher.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className={labelClasses}>Accountant Name:</span>
                <input 
                  className={`${inputClasses} font-bold text-slate-900 text-right`}
                  value={voucher.accountantName || ''}
                  placeholder="N/A"
                  onChange={(e) => handleFieldChange('accountantName', e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className={labelClasses}>{isOut ? 'Expenses Bill:' : 'Reference Details:'}</span>
                <input 
                  className={`${inputClasses} font-medium text-slate-900 text-right`}
                  value={isOut ? (voucher as DebitVoucher).originalPurchaseBill || '' : (voucher as CreditVoucher).referenceDetails || ''}
                  placeholder="N/A"
                  onChange={(e) => handleFieldChange(isOut ? 'originalPurchaseBill' : 'referenceDetails', e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className={labelClasses}>{isOut ? 'Expenses Bill Date:' : 'Reference Date:'}</span>
                <input 
                  type="date"
                  className={`${inputClasses} font-medium text-slate-900 text-right`}
                  value={isOut ? (voucher as DebitVoucher).purchaseBillDate || '' : voucher.referenceDate || ''}
                  onChange={(e) => handleFieldChange(isOut ? 'purchaseBillDate' : 'referenceDate', e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className={labelClasses}>{isOut ? 'Payment Mode:' : 'Receipt Mode:'}</span>
                <select 
                  className={`${inputClasses} font-bold text-blue-800 text-right appearance-none`}
                  value={isOut ? (voucher as DebitVoucher).paymentMode : (voucher as CreditVoucher).receiptMode}
                  onChange={(e) => handleFieldChange(isOut ? 'paymentMode' : 'receiptMode', e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detailed Voucher Content Table */}
          <table className="w-full border-collapse border border-slate-300 text-xs mb-5">
            <tbody>
              {/* Conditional Rows based on Voucher Type */}
              {isOut ? (
                /* OUT Voucher Fields */
                <>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Supplier / Payee Name :-
                    </td>
                    <td className="p-3">
                      <input 
                        className={`${inputClasses} font-semibold text-slate-900 text-sm`}
                        value={(voucher as DebitVoucher).supplierName}
                        onChange={(e) => handleFieldChange('supplierName', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Supplier GSTIN
                    </td>
                    <td className="p-3">
                      <input 
                        className={`${inputClasses} font-bold text-slate-900`}
                        value={(voucher as DebitVoucher).supplierGstin || ''}
                        placeholder="-"
                        onChange={(e) => handleFieldChange('supplierGstin', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Payment Purpose
                    </td>
                    <td className="p-3">
                      <textarea 
                        rows={2}
                        className={`${inputClasses} text-slate-800 resize-none`}
                        value={voucher.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                      />
                    </td>
                  </tr>
                </>
              ) : (
                /* IN Voucher Fields */
                <>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Customer / Party Name
                    </td>
                    <td className="p-3">
                      <input 
                        className={`${inputClasses} font-bold text-emerald-900 text-sm`}
                        value={(voucher as CreditVoucher).customerName}
                        onChange={(e) => handleFieldChange('customerName', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Customer GSTIN
                    </td>
                    <td className="p-3">
                      <input 
                        className={`${inputClasses} font-bold text-slate-900`}
                        value={(voucher as CreditVoucher).customerGstin || ''}
                        placeholder="-"
                        onChange={(e) => handleFieldChange('customerGstin', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                      Receipt Purpose
                    </td>
                    <td className="p-3">
                      <textarea 
                        rows={2}
                        className={`${inputClasses} text-slate-800 leading-relaxed resize-none`}
                        value={voucher.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                      />
                    </td>
                  </tr>
                </>
              )}

              <tr className="border-b border-slate-300">
                <td className="p-3 bg-slate-50 font-bold text-slate-700 border-r border-slate-300">
                  Note / Reason
                </td>
                <td className="p-3">
                  <input 
                    className={`${inputClasses} text-slate-700 italic`}
                    value={voucher.noteReason || ''}
                    placeholder="Enter reason..."
                    onChange={(e) => handleFieldChange('noteReason', e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount Box */}
          <div className="border-2 border-slate-900 rounded-lg p-4 mb-6 bg-slate-50/70 print:bg-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  Amount {isOut ? 'Paid' : 'Received'} (in figures):
                </span>
                <div className="flex items-center gap-1 text-2xl font-black text-slate-900 font-mono tracking-tight">
                  <span>₹</span>
                  <input 
                    type="number"
                    className="w-40 border-none bg-transparent p-0 focus:ring-0 font-mono"
                    value={voucher.amount}
                    onChange={(e) => handleFieldChange('amount', e.target.value)}
                  />
                </div>
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
              <textarea 
                rows={1}
                className={`${inputClasses} text-xs sm:text-sm font-bold text-slate-900 italic mt-0.5 resize-none h-auto`}
                value={voucher.amountInWords}
                onChange={(e) => handleFieldChange('amountInWords', e.target.value)}
              />
            </div>
          </div>

          {/* Sign-Off Details Section (3 Signatures Columns) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden grid grid-cols-3 text-center text-xs mb-6">
            {/* Prepared By */}
            <div className="p-4 border-r border-slate-300 flex flex-col justify-between h-36">
              <span className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                PREPARED BY
              </span>
              <div className="py-2">
                <input 
                  className={`${inputClasses} font-semibold text-slate-900 text-xs text-center`}
                  value={voucher.createdBy || ''}
                  placeholder="Name"
                  onChange={(e) => handleFieldChange('createdBy', e.target.value)}
                />
                <div className="text-[10px] text-slate-500">Finance & Accounts</div>
              </div>
              <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500 font-medium">
                Signature & Date: {voucher.date}
              </div>
            </div>

            {/* Approved By */}
            <div className="p-4 border-r border-slate-300 flex flex-col justify-between h-36 bg-slate-50/30 print:bg-transparent">
              <span className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                APPROVED BY
              </span>
              <div className="py-2">
                <input 
                  className={`${inputClasses} font-semibold text-slate-900 text-xs text-center`}
                  value={voucher.approvedBy || ''}
                  placeholder="Manager Name"
                  onChange={(e) => handleFieldChange('approvedBy', e.target.value)}
                />
                <div className="text-[10px] text-emerald-700 font-bold">
                  ✓ Verified & Authorized
                </div>
              </div>
              <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500 font-medium">
                Official Signature & Seal
              </div>
            </div>

            {/* Receiver / Cashier */}
            <div className="p-4 flex flex-col justify-between h-36">
              <span className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                {isOut ? 'CASHIER / PAYEE' : 'RECEIVED BY'}
              </span>
              <div className="py-2">
                <input 
                  className={`${inputClasses} font-semibold text-slate-900 text-xs text-center`}
                  value={isOut ? (voucher as DebitVoucher).cashierName || '' : (voucher as CreditVoucher).receivedBy || ''}
                  placeholder="Name"
                  onChange={(e) => handleFieldChange(isOut ? 'cashierName' : 'receivedBy', e.target.value)}
                />
              </div>
              <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500 font-medium">
                Acknowledgement Signature
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

