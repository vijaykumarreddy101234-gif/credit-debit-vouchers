import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Hash,
  User,
  CreditCard,
  IndianRupee,
  Save,
  Printer,
  RotateCcw,
  X,
  PlusCircle,
  Building,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  FileUp,
  Paperclip
} from 'lucide-react';
import {
  CreditVoucher,
  ReceiptMode,
  UserProfile,
  VoucherStatus,
  VoucherAttachment
} from '../../types/voucher';
import { numberToIndianWords, formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { voucherStorage } from '../../utils/voucherStorage';

interface CreditVoucherFormProps {
  initialVoucher?: CreditVoucher | null;
  currentUser: UserProfile;
  onSaveSuccess: (savedVoucher: CreditVoucher, andPrint?: boolean) => void;
  onCancel: () => void;
  onSwitchToDebit?: () => void;
}

export const CreditVoucherForm: React.FC<CreditVoucherFormProps> = ({
  initialVoucher,
  currentUser,
  onSaveSuccess,
  onCancel,
  onSwitchToDebit,
}) => {
  const isEditing = Boolean(initialVoucher?.id);
  const canApprove = currentUser.role === 'Admin' || currentUser.role === 'Authorized Accounts Manager';

  // Form State
  const [voucherNo, setVoucherNo] = useState<string>(initialVoucher?.voucherNo || '');
  const [date, setDate] = useState<string>(
    initialVoucher?.date || new Date().toISOString().split('T')[0]
  );
  const [accountantName, setAccountantName] = useState<string>(initialVoucher?.accountantName || '');
  const [referenceDate, setReferenceDate] = useState<string>(initialVoucher?.referenceDate || '');
  const [personName, setPersonName] = useState<string>(initialVoucher?.personName || '');
  const [customerGstin, setCustomerGstin] = useState<string>(initialVoucher?.customerGstin || '');
  const [referenceDetails, setReferenceDetails] = useState<string>(initialVoucher?.referenceDetails || '');
  const [noteReason, setNoteReason] = useState<string>(initialVoucher?.noteReason || '');

  const [receiptMode, setReceiptMode] = useState<ReceiptMode>(initialVoucher?.receiptMode || 'Bank');
  const [amount, setAmount] = useState<string>(initialVoucher?.amount ? String(initialVoucher.amount) : '');
  const [amountInWords, setAmountInWords] = useState<string>(initialVoucher?.amountInWords || '');
  
  const [customerName, setCustomerName] = useState<string>(initialVoucher?.customerName || '');
  const [receiptType, setReceiptType] = useState<CreditVoucher['receiptType']>(
    initialVoucher?.receiptType || 'Party Payment'
  );
  const [description, setDescription] = useState<string>(initialVoucher?.description || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initialVoucher?.invoiceNumber || '');
  const [invoiceDate, setInvoiceDate] = useState<string>(initialVoucher?.invoiceDate || '');
  const [approvedBy, setApprovedBy] = useState<string>(initialVoucher?.approvedBy || '');
  const [approvalStatus, setApprovalStatus] = useState<VoucherStatus>(
    initialVoucher?.approvalStatus || 'Pending'
  );
  const [receivedBy, setReceivedBy] = useState<string>(initialVoucher?.receivedBy || currentUser.name);
  const [remarks, setRemarks] = useState<string>(initialVoucher?.remarks || '');
  const [attachments, setAttachments] = useState<VoucherAttachment[]>(initialVoucher?.attachments || []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setVoucherNo(voucherStorage.getNextCreditVoucherNumber());
    }
  }, [isEditing]);

  useEffect(() => {
    const num = parseFloat(amount);
    if (!isNaN(num) && num > 0) {
      setAmountInWords(numberToIndianWords(num));
    } else {
      setAmountInWords('');
    }
  }, [amount]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newAttachment: VoucherAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'Photo' : 'Invoice',
        size: file.size,
        mimeType: file.type,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = 'Date is required';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Valid positive amount is required';
    }
    if (!customerName.trim()) newErrors.customerName = 'Customer Name is required';
    if (!description.trim()) newErrors.description = 'Purpose / Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (andPrint: boolean = false) => {
    if (!validateForm()) return;

    // Check for documents if user wants to print
    if (andPrint && attachments.length === 0) {
      const confirmPrintWithoutDocs = window.confirm(
        'No documents or photos have been uploaded. Do you want to upload a document before printing?'
      );
      if (confirmPrintWithoutDocs) {
        // Scroll to upload section and don't proceed with save
        fileInputRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const voucherData: Partial<CreditVoucher> = {
        id: initialVoucher?.id,
        voucherNo,
        date,
        accountantName,
        referenceDate,
        personName,
        customerGstin,
        referenceDetails,
        noteReason,
        receiptMode,
        amount: parseFloat(amount),
        amountInWords,
        customerName,
        receiptType,
        description,
        invoiceNumber,
        invoiceDate,
        approvedBy: approvalStatus === 'Approved' ? (approvedBy || currentUser.name) : approvedBy,
        approvalStatus,
        receivedBy,
        remarks,
        attachments,
      };

      const saved = voucherStorage.saveCreditVoucher(voucherData);
      onSaveSuccess(saved, andPrint);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-12 px-1 sm:px-2">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-white to-emerald-50/30">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Module: IN – Credit Voucher
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Credit Voucher' : 'New Credit Voucher Entry'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium font-serif italic">Record incoming receipts, sales payments, and customer advances</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Sequence No</span>
            <span className="font-mono text-base sm:text-lg font-black text-emerald-700">{voucherNo || '...'}</span>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column: Basic Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</div>
                A. Voucher Details
              </h3>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-tight">IN(Credit) Voucher</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-tighter">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  1. Voucher Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all px-4 py-2.5"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Default: Today's Date</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-tighter">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  2. Voucher Type *
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    className="flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg bg-emerald-600 text-white shadow-sm transition-all"
                  >
                    IN(Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchToDebit) {
                        onSwitchToDebit();
                      }
                    }}
                    className="flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Switch to OUT (Debit) Voucher"
                  >
                    OUT(Debit)
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">Click to switch between IN & OUT voucher</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-tighter text-blue-700">
                  <Hash className="w-3.5 h-3.5" />
                  3. Voucher Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={voucherNo}
                    readOnly
                    className="w-full text-sm font-black text-emerald-700 rounded-xl border-emerald-200 bg-emerald-50/50 px-4 py-2.5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">AUTO GENERATED</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-tighter">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  4. Accountant Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter Accountant Name..."
                    value={accountantName}
                    onChange={(e) => setAccountantName(e.target.value)}
                    className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 px-4 py-2.5"
                    required
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800">
                    <PlusCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-tighter">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  5. Reference Date
                </label>
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Person Name:</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Customer GSTIN:</label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Reference Details:</label>
                <input
                  type="text"
                  placeholder="Invoice / Bill / Supporting Documents"
                  value={referenceDetails}
                  onChange={(e) => setReferenceDetails(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                />
              </div>

              {/* Added Document/Photo upload here as requested */}
              <div className="space-y-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                >
                  <FileUp className="w-8 h-8 group-hover:scale-110 transition-transform text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">+ Add Document or Photo</span>
                </button>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-700 truncate">{att.name}</span>
                        </div>
                        <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-rose-500 hover:text-rose-700 p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Note / Reason:</label>
              <textarea
                rows={2}
                value={noteReason}
                onChange={(e) => setNoteReason(e.target.value)}
                className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2 resize-none"
                placeholder="Reason for receipt..."
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">2</div>
              B. Payment Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    Amount (₹) *
                  </span>
                  {amount && <span className="text-[10px] font-black text-emerald-700">{formatIndianCurrency(amount)}</span>}
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-lg font-black text-slate-900 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all px-4 py-2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount in Words</label>
                <div className="w-full min-h-[46px] p-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 text-xs font-bold text-emerald-900 italic flex items-center">
                  {amountInWords ? `"${amountInWords}"` : 'Enter amount to see words...'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Receipt Mode *</label>
                <select
                  value={receiptMode}
                  onChange={(e) => setReceiptMode(e.target.value as ReceiptMode)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI / Digital</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Name *</label>
                <input
                  type="text"
                  placeholder="Enter customer name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Receipt Purpose *</label>
              <textarea
                rows={3}
                placeholder="Details of the receipt transaction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5 resize-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column: Approvals & Sign-Off */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">3</div>
              C. Sign-Off Details
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Approved By:</label>
              <input
                type="text"
                placeholder="Authorized sign-off name"
                value={approvedBy}
                readOnly={!canApprove}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Approval Status:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pending', 'Approved', 'Rejected'] as VoucherStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={!canApprove && status !== 'Pending'}
                    onClick={() => setApprovalStatus(status)}
                    className={`py-2 text-[8px] font-black uppercase rounded-lg border transition-all ${
                      approvalStatus === status
                        ? status === 'Approved' ? 'bg-emerald-600 text-white border-emerald-700' : 
                          status === 'Rejected' ? 'bg-rose-600 text-white border-rose-700' :
                          'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    } disabled:opacity-40`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Received By:</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => { if(confirm('Clear form fields?')) { setAmount(''); setCustomerName(''); setDescription(''); } }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 sm:px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Save & Print Voucher
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-black text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Processing...' : isEditing ? 'Update Credit Voucher' : 'Save Voucher'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
