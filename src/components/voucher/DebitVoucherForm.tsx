import React, { useState, useEffect, useRef } from 'react';
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
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileUp
} from 'lucide-react';
import {
  DebitVoucher,
  PaymentMode,
  VoucherAttachment,
  UserProfile,
  VoucherStatus
} from '../../types/voucher';
import { numberToIndianWords, formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { voucherStorage } from '../../utils/voucherStorage';

interface DebitVoucherFormProps {
  initialVoucher?: DebitVoucher | null;
  currentUser: UserProfile;
  onSaveSuccess: (savedVoucher: DebitVoucher, andPrint?: boolean) => void;
  onCancel: () => void;
  onSwitchToCredit?: () => void;
}

export const DebitVoucherForm: React.FC<DebitVoucherFormProps> = ({
  initialVoucher,
  currentUser,
  onSaveSuccess,
  onCancel,
  onSwitchToCredit,
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
  const [supplierGstin, setSupplierGstin] = useState<string>(initialVoucher?.supplierGstin || '');
  const [originalPurchaseBill, setOriginalPurchaseBill] = useState<string>(initialVoucher?.originalPurchaseBill || '');
  const [purchaseBillDate, setPurchaseBillDate] = useState<string>(initialVoucher?.purchaseBillDate || '');
  const [noteReason, setNoteReason] = useState<string>(initialVoucher?.noteReason || '');

  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialVoucher?.paymentMode || 'Bank');
  const [amount, setAmount] = useState<string>(initialVoucher?.amount ? String(initialVoucher.amount) : '');
  const [amountInWords, setAmountInWords] = useState<string>(initialVoucher?.amountInWords || '');
  
  const [supplierDetails, setSupplierDetails] = useState<DebitVoucher['supplierDetails']>(
    initialVoucher?.supplierDetails || 'Supplier'
  );
  const [supplierName, setSupplierName] = useState<string>(initialVoucher?.supplierName || '');
  const [description, setDescription] = useState<string>(initialVoucher?.description || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initialVoucher?.invoiceNumber || '');
  const [invoiceDate, setInvoiceDate] = useState<string>(initialVoucher?.invoiceDate || '');
  const [prepaidAmount, setPrepaidAmount] = useState<string>(
    initialVoucher?.prepaidAmount ? String(initialVoucher.prepaidAmount) : ''
  );
  const [approvedBy, setApprovedBy] = useState<string>(initialVoucher?.approvedBy || '');
  const [approvalStatus, setApprovalStatus] = useState<VoucherStatus>(
    initialVoucher?.approvalStatus || 'Pending'
  );
  const [cashierName, setCashierName] = useState<string>(initialVoucher?.cashierName || currentUser.name);
  const [remarks, setRemarks] = useState<string>(initialVoucher?.remarks || '');
  const [attachments, setAttachments] = useState<VoucherAttachment[]>(initialVoucher?.attachments || []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setVoucherNo(voucherStorage.getNextDebitVoucherNumber());
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
    if (!supplierName.trim()) newErrors.supplierName = 'Supplier Name is required';
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
      const voucherData: Partial<DebitVoucher> = {
        id: initialVoucher?.id,
        voucherNo,
        date,
        accountantName,
        referenceDate,
        personName,
        supplierGstin,
        originalPurchaseBill,
        purchaseBillDate,
        noteReason,
        paymentMode,
        amount: parseFloat(amount),
        amountInWords,
        supplierDetails,
        supplierName,
        description,
        invoiceNumber,
        invoiceDate,
        prepaidAmount: prepaidAmount ? parseFloat(prepaidAmount) : undefined,
        approvedBy: approvalStatus === 'Approved' ? (approvedBy || currentUser.name) : approvedBy,
        approvalStatus,
        cashierName,
        remarks,
        attachments,
      };

      const saved = voucherStorage.saveDebitVoucher(voucherData);
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
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-white to-slate-50">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-widest mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            Module: OUT – Debit Voucher
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Debit Voucher' : 'New Debit Voucher Entry'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium font-serif italic">Record outgoing payments and supplier disbursements</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Sequence No</span>
            <span className="font-mono text-base sm:text-lg font-black text-rose-700">{voucherNo || '...'}</span>
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
              <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-tight">OUT(Debit) Voucher</span>
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
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all px-4 py-2.5"
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
                    onClick={() => {
                      if (onSwitchToCredit) {
                        onSwitchToCredit();
                      }
                    }}
                    className="flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                    title="Switch to IN (Credit) Voucher"
                  >
                    IN(Credit)
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg bg-rose-600 text-white shadow-sm transition-all"
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
                    className="w-full text-sm font-black text-rose-700 rounded-xl border-rose-200 bg-rose-50/50 px-4 py-2.5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">AUTO GENERATED</span>
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
                    className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 px-4 py-2.5"
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Supplier GSTIN:</label>
                <input
                  type="text"
                  value={supplierGstin}
                  onChange={(e) => setSupplierGstin(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Expenses Bill:</label>
                <input
                  type="text"
                  value={originalPurchaseBill}
                  onChange={(e) => setOriginalPurchaseBill(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Expenses Bill Date:</label>
                <input
                  type="date"
                  value={purchaseBillDate}
                  onChange={(e) => setPurchaseBillDate(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">OUT Note Reason:</label>
              <textarea
                rows={2}
                value={noteReason}
                onChange={(e) => setNoteReason(e.target.value)}
                className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2 resize-none"
                placeholder="Reason for payment..."
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Supplier Name *</label>
                <input
                  type="text"
                  placeholder="Enter supplier name..."
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Payment Purpose *</label>
              <textarea
                rows={3}
                placeholder="Detailed explanation of this debit transaction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2.5 resize-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column: Approvals & Attachments */}
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Cashier Name:</label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white px-4 py-2"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">4</div>
              D. Document Upload
            </h3>
            
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
            >
              <FileUp className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-wider">+ Add Document or Photo</span>
            </button>

            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
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
          </div>
        </div>

        {/* Footer Actions */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => { if(confirm('Reset all fields?')) { setAmount(''); setSupplierName(''); setDescription(''); setAttachments([]); } }}
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
              {isSubmitting ? 'Processing...' : isEditing ? 'Update Voucher' : 'Save Voucher'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
