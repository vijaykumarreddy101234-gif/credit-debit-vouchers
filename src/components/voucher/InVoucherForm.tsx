import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Calendar,
  Hash,
  BookOpen,
  User,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Save,
  X,
  PlusCircle,
  HelpCircle,
  Search,
  Building,
  Paperclip,
  Plus
} from 'lucide-react';
import {
  InVoucher,
  PaymentMode,
  VoucherAttachment,
  AccountHead,
  UserProfile,
  VoucherType,
  formatVoucherType
} from '../../types/voucher';
import { numberToIndianWords, formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { voucherStorage } from '../../utils/voucherStorage';
import { SignaturePad } from './SignaturePad';
import { DocumentUploadSection } from './DocumentUploadSection';

interface InVoucherFormProps {
  initialVoucher?: InVoucher | null;
  initialVoucherType?: VoucherType;
  currentUser: UserProfile;
  onSaveSuccess: (savedVoucher: InVoucher, andPrint?: boolean) => void;
  onCancel: () => void;
}

export const InVoucherForm: React.FC<InVoucherFormProps> = ({
  initialVoucher,
  initialVoucherType,
  currentUser,
  onSaveSuccess,
  onCancel,
}) => {
  const isEditing = Boolean(initialVoucher?.id);

  // Form State
  const [voucherNo, setVoucherNo] = useState<string>('');
  const [voucherDate, setVoucherDate] = useState<string>(
    initialVoucher?.voucherDate || new Date().toISOString().split('T')[0]
  );
  const [voucherType, setVoucherType] = useState<VoucherType>(() => {
    if (initialVoucher?.voucherType) {
      return formatVoucherType(initialVoucher.voucherType);
    }
    if (initialVoucherType) {
      return formatVoucherType(initialVoucherType);
    }
    return 'IN(Credit)';
  });

  // Section A: Voucher Details (User Custom Sketch: Date, (Voucher) OUT/IN, Voucher No:, Person Name :-, Supplier GSTIN, Original Purchase Bill (+ Add Document (or) Photo), Purchase Bill Date, OUT Note Reason :-)
  const [personName, setPersonName] = useState<string>(
    initialVoucher?.personName || initialVoucher?.accountName || ''
  );
  const [supplierGstin, setSupplierGstin] = useState<string>(
    initialVoucher?.supplierGstin || ''
  );
  const [originalPurchaseBill, setOriginalPurchaseBill] = useState<string>(
    initialVoucher?.originalPurchaseBill || initialVoucher?.referenceDetails || ''
  );
  const [purchaseBillDate, setPurchaseBillDate] = useState<string>(
    initialVoucher?.purchaseBillDate || initialVoucher?.referenceDate || new Date().toISOString().split('T')[0]
  );
  const [noteReason, setNoteReason] = useState<string>(
    initialVoucher?.noteReason || ''
  );

  // Hidden file input ref for quick "+ Add Document (or) Photo" under Original Purchase Bill
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Legacy/ledger references for compatibility
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialVoucher?.accountId || '');
  const [referenceDate, setReferenceDate] = useState<string>(
    initialVoucher?.referenceDate || new Date().toISOString().split('T')[0]
  );
  const [referenceDetails, setReferenceDetails] = useState<string>(initialVoucher?.referenceDetails || '');
  const [paymentParticulars, setPaymentParticulars] = useState<string>(initialVoucher?.paymentParticulars || '');

  // Section B: Payment Details
  const [receivedFrom, setReceivedFrom] = useState<string>(initialVoucher?.receivedFrom || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialVoucher?.paymentMode || 'Bank');
  const [chequeNo, setChequeNo] = useState<string>(initialVoucher?.paymentModeDetails?.chequeNo || '');
  const [chequeDate, setChequeDate] = useState<string>(initialVoucher?.paymentModeDetails?.chequeDate || '');
  const [bankName, setBankName] = useState<string>(initialVoucher?.paymentModeDetails?.bankName || '');
  const [transactionRef, setTransactionRef] = useState<string>(initialVoucher?.paymentModeDetails?.transactionRef || '');
  const [upiId, setUpiId] = useState<string>(initialVoucher?.paymentModeDetails?.upiId || '');

  const [amount, setAmount] = useState<string>(initialVoucher?.amount ? String(initialVoucher.amount) : '');
  const [amountInWords, setAmountInWords] = useState<string>(initialVoucher?.amountInWords || '');
  const [particularsNotes, setParticularsNotes] = useState<string>(initialVoucher?.particularsNotes || '');

  // Section C: Sign-off Details
  const [preparedBy, setPreparedBy] = useState<string>(initialVoucher?.preparedBy || currentUser.name);
  const [passedBy, setPassedBy] = useState<string>(
    initialVoucher?.passedBy || 'Lakshmi Narayana (Chief Accounts Officer)'
  );
  const [receiverSignature, setReceiverSignature] = useState<string>(initialVoucher?.receiverSignature || '');
  const [receiverSignatureType, setReceiverSignatureType] = useState<'draw' | 'upload' | 'digital'>(
    initialVoucher?.receiverSignatureType || 'draw'
  );

  // Section D: Attachments
  const [attachments, setAttachments] = useState<VoucherAttachment[]>(initialVoucher?.attachments || []);

  // UI & Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState<boolean>(false);
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newAccountGroup, setNewAccountGroup] = useState<AccountHead['group']>('Direct Income');
  const [newAccountCode, setNewAccountCode] = useState<string>('');

  // Search filter for accounts dropdown
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState<boolean>(false);

  // Handle switching Voucher Type between IN(Credit) and OUT(Debit)
  const handleVoucherTypeChange = (newType: 'IN(Credit)' | 'OUT(Debit)') => {
    setVoucherType(newType);
    if (!isEditing) {
      if (newType === 'OUT(Debit)') {
        const nextNo = voucherStorage.getNextOutVoucherNumber();
        setVoucherNo(nextNo);
      } else {
        const nextNo = voucherStorage.getNextInVoucherNumber();
        setVoucherNo(nextNo);
      }
    }
  };

  // Load Accounts & Auto-generate Voucher Number
  useEffect(() => {
    const loadedAccounts = voucherStorage.getAccounts();
    setAccounts(loadedAccounts);

    if (isEditing && initialVoucher) {
      setVoucherNo(initialVoucher.voucherNo);
      setVoucherType(formatVoucherType(initialVoucher.voucherType));
    } else {
      const currentType = initialVoucherType ? formatVoucherType(initialVoucherType) : voucherType;
      if (currentType === 'OUT(Debit)' || currentType === 'OUT') {
        setVoucherNo(voucherStorage.getNextOutVoucherNumber());
      } else {
        setVoucherNo(voucherStorage.getNextInVoucherNumber());
      }
    }
  }, [isEditing, initialVoucher, initialVoucherType]);

  // Update Amount in Words automatically whenever Amount changes
  useEffect(() => {
    const num = parseFloat(amount);
    if (!isNaN(num) && num > 0) {
      const words = numberToIndianWords(num);
      setAmountInWords(words);
    } else {
      setAmountInWords('');
    }
  }, [amount]);

  // Selected Account details
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Handle Quick Add Account
  const handleCreateNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;

    const created = voucherStorage.addAccount({
      code: newAccountCode || String(4100 + accounts.length),
      name: newAccountName.trim(),
      group: newAccountGroup,
      balance: 0,
    });

    setAccounts([created, ...accounts]);
    setSelectedAccountId(created.id);
    setShowAddAccountModal(false);
    setNewAccountName('');
    setNewAccountCode('');
  };

  // Quick bill / photo upload under Original Purchase Bill
  const handleQuickAddBillOrPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith('image/');
      const newAttachment: VoucherAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: isImg ? 'Photo' : 'Invoice',
        size: file.size,
        mimeType: file.type || (isImg ? 'image/jpeg' : 'application/pdf'),
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };

      setAttachments((prev) => [...prev, newAttachment]);
      if (!originalPurchaseBill.trim()) {
        setOriginalPurchaseBill(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!voucherDate) newErrors.voucherDate = 'Date is required';
    if (!voucherNo) newErrors.voucherNo = 'Voucher Number is required';
    if (!personName.trim()) newErrors.personName = 'Person Name is required';
    if (!receivedFrom.trim() && !personName.trim()) {
      newErrors.receivedFrom = (voucherType === 'OUT(Debit)' || voucherType === 'OUT') ? "Paid To / Beneficiary Name is required" : "Received From (Party Name) is required";
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Valid positive amount in ₹ is required';
    }
    if (!preparedBy.trim()) newErrors.preparedBy = 'Prepared By is required';
    if (!passedBy.trim()) newErrors.passedBy = 'Passed By is required';

    if (paymentMode === 'Cheque') {
      if (!chequeNo.trim()) newErrors.chequeNo = 'Cheque number is required for Cheque payment mode';
      if (!bankName.trim()) newErrors.bankName = 'Bank name is required';
    }

    if (paymentMode === 'Bank' && !bankName.trim()) {
      newErrors.bankName = 'Bank Name / Branch is recommended for Bank transfer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Save
  const handleSave = async (andPrint: boolean = false) => {
    if (!validateForm()) {
      // Scroll to top error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const numericAmount = parseFloat(amount);
      const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
      const effectiveAccountName = personName.trim() || selectedAcc?.name || 'General Accounts';
      const effectiveAccountId = selectedAccountId || selectedAcc?.id || 'ACC-101';
      const effectiveReceivedFrom = receivedFrom.trim() || personName.trim();

      const savedVoucher = voucherStorage.saveInVoucher({
        id: initialVoucher?.id,
        voucherNo,
        voucherDate,
        voucherType,
        accountId: effectiveAccountId,
        accountName: effectiveAccountName,
        personName: personName.trim(),
        supplierGstin: supplierGstin.trim().toUpperCase(),
        originalPurchaseBill: originalPurchaseBill.trim(),
        purchaseBillDate: purchaseBillDate || voucherDate,
        referenceDate: purchaseBillDate || referenceDate,
        referenceDetails: originalPurchaseBill.trim() || referenceDetails.trim(),
        paymentParticulars: paymentParticulars.trim() || originalPurchaseBill.trim(),
        noteReason: noteReason.trim(),
        receivedFrom: effectiveReceivedFrom,
        paymentMode,
        paymentModeDetails: {
          chequeNo: chequeNo.trim() || undefined,
          chequeDate: chequeDate || undefined,
          bankName: bankName.trim() || undefined,
          transactionRef: transactionRef.trim() || undefined,
          upiId: upiId.trim() || undefined,
        },
        amount: numericAmount,
        amountInWords,
        particularsNotes: particularsNotes.trim(),
        preparedBy: preparedBy.trim(),
        passedBy: passedBy.trim(),
        receiverSignature: receiverSignature || '',
        receiverSignatureType,
        attachments,
        status: initialVoucher?.status || 'Approved',
        createdBy: initialVoucher?.createdBy || currentUser.name,
        updatedBy: currentUser.name,
      });

      onSaveSuccess(savedVoucher, andPrint);
    } catch (err: any) {
      alert(`Error saving voucher: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all form inputs? Unsaved data will be lost.')) {
      setVoucherDate(new Date().toISOString().split('T')[0]);
      setVoucherType('IN(Credit)');
      setVoucherNo(voucherStorage.getNextInVoucherNumber());
      setPersonName('');
      setSupplierGstin('');
      setOriginalPurchaseBill('');
      setPurchaseBillDate(new Date().toISOString().split('T')[0]);
      setSelectedAccountId('');
      setReferenceDate(new Date().toISOString().split('T')[0]);
      setReferenceDetails('');
      setPaymentParticulars('');
      setNoteReason('');
      setReceivedFrom('');
      setPaymentMode('Bank');
      setChequeNo('');
      setChequeDate('');
      setBankName('');
      setTransactionRef('');
      setUpiId('');
      setAmount('');
      setAmountInWords('');
      setParticularsNotes('');
      setPreparedBy(currentUser.name);
      setReceiverSignature('');
      setAttachments([]);
      setErrors({});
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.code.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.group.toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Voucher Desk</span>
            <span>/</span>
            <span className={`font-semibold ${voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'text-rose-700' : 'text-emerald-700'}`}>
              {voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'OUT(Debit) Voucher Entry' : 'IN(Credit) Voucher Entry'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-lg text-white flex items-center justify-center text-xs font-black shadow-xs ${
              voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              {voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'OUT' : 'IN'}
            </span>
            {isEditing
              ? `Edit Voucher (${voucherNo})`
              : voucherType === 'OUT(Debit)' || voucherType === 'OUT'
              ? 'New OUT(Debit) Voucher Entry (Payment / Debit Outflow)'
              : 'New IN(Credit) Voucher Entry (Cash / Bank Receipt)'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {voucherType === 'OUT(Debit)' || voucherType === 'OUT'
              ? 'Record payments disbursed to vendors or operational expenses with automatic numbering.'
              : 'Record money received from customers, clients, or third parties with automatic numbering and audit logs.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Sequence System</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Active: {voucherNo || 'Generating...'}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Validation Errors Alert Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800">Please correct the following fields before saving:</h4>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
              {Object.values(errors).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-6">
        
        {/* SECTION 1: VOUCHER DETAILS (User Sketch: Date | (Voucher) (OUT)/(IN) | Voucher No: | Person Name :- | Supplier GSTIN | Original Purchase Bill (+ Add Document (or) Photo) | Purchase Bill Date | OUT Note Reason :-) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">A. Voucher Details</h3>
                <p className="text-[11px] text-slate-500">
                  Voucher Details : - {voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'OUT' : 'IN'}
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                voucherType === 'OUT(Debit)' || voucherType === 'OUT'
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}
            >
              {voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'OUT Voucher' : 'IN Voucher'}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Row 1: Date | (Voucher) (OUT)/(IN) | Voucher No: */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  className={`w-full text-xs rounded-lg border px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 ${
                    errors.voucherDate ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300'
                  }`}
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: Today's Date</span>
              </div>

              {/* (Voucher) OUT / IN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    (Voucher) <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    SELECTABLE
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoucherTypeChange('OUT(Debit)')}
                    className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      voucherType === 'OUT(Debit)' || voucherType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'bg-white' : 'bg-rose-500'
                      }`}
                    />
                    (OUT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoucherTypeChange('IN(Credit)')}
                    className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      voucherType === 'IN(Credit)' || voucherType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        voucherType === 'IN(Credit)' || voucherType === 'IN' ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                    (IN)
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {voucherType === 'OUT(Debit)' || voucherType === 'OUT'
                    ? 'Payment Outflow (generates OUT-XXXX sequence)'
                    : 'Receipt Inflow (generates IN-XXXX sequence)'}
                </span>
              </div>

              {/* Voucher No: */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  Voucher No: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={voucherNo}
                    readOnly={!isEditing}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    placeholder={voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'OUT-0001' : 'IN-0001'}
                    className={`w-full text-xs font-mono font-bold rounded-lg border border-slate-300 px-3 py-2.5 cursor-default ${
                      voucherType === 'OUT(Debit)' || voucherType === 'OUT'
                        ? 'text-rose-900 bg-rose-50/50'
                        : 'text-blue-900 bg-blue-50/50'
                    }`}
                  />
                  <span
                    className={`absolute right-2.5 top-2.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      voucherType === 'OUT(Debit)' || voucherType === 'OUT'
                        ? 'text-rose-700 bg-rose-100'
                        : 'text-blue-700 bg-blue-100'
                    }`}
                  >
                    AUTO
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Database protected continuous sequence
                </span>
              </div>
            </div>

            {/* CONDITIONAL SECTION A CONTENT BASED ON VOUCHER TYPE */}
            {voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? (
              /* OUT Voucher Layout (User Sketch) */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Person Name :- */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Person Name :- <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddAccountModal(true)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        + Add New Account / Party
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter Person Name / Client / Vendor / Employee..."
                        value={personName}
                        onChange={(e) => {
                          setPersonName(e.target.value);
                          if (!receivedFrom.trim()) {
                            setReceivedFrom(e.target.value);
                          }
                        }}
                        onFocus={() => setIsAccountDropdownOpen(true)}
                        className={`w-full text-xs rounded-lg border px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 ${
                          errors.personName ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300'
                        }`}
                        required
                      />
                      {filteredAccounts.length > 0 && isAccountDropdownOpen && (
                        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Select from Chart of Accounts / Parties:</span>
                            <button
                              type="button"
                              onClick={() => setIsAccountDropdownOpen(false)}
                              className="text-slate-400 hover:text-slate-600 font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {filteredAccounts.slice(0, 8).map((acc) => (
                              <div
                                key={acc.id}
                                onClick={() => {
                                  setPersonName(acc.name);
                                  setSelectedAccountId(acc.id);
                                  if (!receivedFrom.trim()) {
                                    setReceivedFrom(acc.name);
                                  }
                                  setIsAccountDropdownOpen(false);
                                }}
                                className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                              >
                                <span className="font-semibold text-slate-800">{acc.name}</span>
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                                  [{acc.code}] {acc.group}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supplier GSTIN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      Supplier GSTIN
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g., 36AABCR1234F1Z8"
                      value={supplierGstin}
                      onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-semibold uppercase rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Original Purchase Bill */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      Original Purchase Bill
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Tax Invoice #RIL-2026-904, Bill #WB-8812, PO #8942"
                      value={originalPurchaseBill}
                      onChange={(e) => setOriginalPurchaseBill(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />

                    {/* + Add Document (or) Photo */}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleQuickAddBillOrPhoto}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Add Document (or) Photo
                      </button>
                    </div>
                  </div>

                  {/* Purchase Bill Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Purchase Bill Date
                    </label>
                    <input
                      type="date"
                      value={purchaseBillDate}
                      onChange={(e) => setPurchaseBillDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    OUT Note Reason :-
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter payment authorization note, purchase reason, or expenditure details..."
                    value={noteReason}
                    onChange={(e) => setNoteReason(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </>
            ) : (
              /* IN Voucher Layout (Original) */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Accountant Name (Account of A/C) */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        4. Accountant Name (Account of A/C) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddAccountModal(true)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        + Add New Account
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for account/ledger..."
                        value={accountSearch || personName}
                        onChange={(e) => {
                          setAccountSearch(e.target.value);
                          setPersonName(e.target.value);
                          setIsAccountDropdownOpen(true);
                        }}
                        onFocus={() => setIsAccountDropdownOpen(true)}
                        className={`w-full text-xs rounded-lg border px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 ${
                          errors.personName ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300'
                        }`}
                        required
                      />
                      {isAccountDropdownOpen && filteredAccounts.length > 0 && (
                        <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Select from Chart of Accounts:</span>
                            <button
                              type="button"
                              onClick={() => setIsAccountDropdownOpen(false)}
                              className="text-slate-400 hover:text-slate-600 font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {filteredAccounts.slice(0, 8).map((acc) => (
                              <div
                                key={acc.id}
                                onClick={() => {
                                  setSelectedAccountId(acc.id);
                                  setPersonName(acc.name);
                                  setAccountSearch(acc.name);
                                  if (!receivedFrom.trim()) {
                                    setReceivedFrom(acc.name);
                                  }
                                  setIsAccountDropdownOpen(false);
                                }}
                                className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                              >
                                <span className="font-semibold text-slate-800">{acc.name}</span>
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                                  [{acc.code}] {acc.group}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. Reference Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      5. Reference Date
                    </label>
                    <input
                      type="date"
                      value={referenceDate}
                      onChange={(e) => setReferenceDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 6. Reference Details */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      6. Reference Details
                    </label>
                    <input
                      type="text"
                      placeholder="Invoice / Bill / Supporting Documents"
                      value={referenceDetails}
                      onChange={(e) => setReferenceDetails(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 7. Payment Particulars */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      7. Payment Particulars
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Payment received for Sale Invoice #102"
                      value={paymentParticulars}
                      onChange={(e) => setPaymentParticulars(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 8. Note / Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    8. Note / Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter internal notes, receipt reason, etc..."
                    value={noteReason}
                    onChange={(e) => setNoteReason(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 2: PAYMENT DETAILS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">B. Payment Details</h3>
                <p className="text-[11px] text-slate-500">Party, payment channel, amount, and automatic words conversion</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md border border-emerald-200">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>INR (Indian Rupees)</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Received From / Paid To */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className={`w-3.5 h-3.5 ${voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'text-rose-600' : 'text-emerald-600'}`} />
                {voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? '1. Paid To (Beneficiary / Vendor Name)' : '1. Received From (Party Name)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'e.g., Steel Authority of India Ltd (SAIL) / TSSPDCL' : 'e.g., Tata Projects Ltd, Secunderabad / Sri Balaji Metal Traders'}
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
                className={`w-full text-xs rounded-lg border px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 font-medium ${
                  voucherType === 'OUT(Debit)' || voucherType === 'OUT' ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'
                } ${
                  errors.receivedFrom ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300'
                }`}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {voucherType === 'OUT(Debit)' || voucherType === 'OUT'
                  ? 'Full legal name of the entity or vendor receiving disbursement'
                  : 'Full legal name of the entity/person making payment'}
              </span>
            </div>

            {/* 2. Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                2. Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Cash">Cash (Physical Safe Deposit)</option>
                <option value="Cheque">Cheque (Clearing / In Hand)</option>
                <option value="DD">DD (Demand Draft)</option>
                <option value="Bank">Bank (RTGS / NEFT / IMPS)</option>
                <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
              </select>
            </div>

            {/* Conditional Payment Mode Fields */}
            {paymentMode === 'Cheque' && (
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cheque Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 449102"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Drawee Bank Name & Branch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., HDFC Bank, Industrial Estate"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                  />
                </div>
              </div>
            )}

            {(paymentMode === 'Bank' || paymentMode === 'DD') && (
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name & Branch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., State Bank of India - Corporate Branch"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UTR / Transaction Reference No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SBIN20261101994821"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                  />
                </div>
              </div>
            )}

            {paymentMode === 'UPI' && (
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., companyname@icici or mobile@oksbi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UPI Reference / RRN Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., UPI/431908219/Rav"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-1.5 bg-white"
                  />
                </div>
              </div>
            )}

            {/* 3. Amount (₹) */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>3. Amount (₹) <span className="text-red-500">*</span></span>
                {amount && (
                  <span className="text-[11px] font-mono font-bold text-emerald-700">
                    {formatIndianCurrency(amount)}
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full text-sm font-mono font-bold rounded-lg border pl-8 pr-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 ${
                    errors.amount ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Enter numerical amount in Indian Rupees</span>
            </div>

            {/* 4. Amount in Words (Automatically generated) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>4. Amount in Words (Indian Rupees System)</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  REAL-TIME AUTO CONVERTED
                </span>
              </label>
              <div className="w-full min-h-[38px] p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs font-semibold text-emerald-900 italic flex items-center">
                {amountInWords ? (
                  <span>"{amountInWords}"</span>
                ) : (
                  <span className="text-slate-400 font-normal not-italic">
                    Amount will automatically convert into Indian Rupees words (e.g. Lakhs, Crores)...
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Formatted for printing and legal voucher audit</span>
            </div>

            {/* 5. Particulars / Notes */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                5. Particulars / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Additional payment particulars, banking narration, or ledger notes..."
                value={particularsNotes}
                onChange={(e) => setParticularsNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SIGN-OFF DETAILS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">C. Sign-Off Details</h3>
                <p className="text-[11px] text-slate-500">Corporate authorizations and receiver signature capture</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* 1. Prepared By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Prepared By (Employee Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  placeholder="e.g., Suresh Kumar"
                  className={`w-full text-xs rounded-lg border px-3 py-2 bg-slate-50 focus:bg-white ${
                    errors.preparedBy ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300'
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Name of accounts staff preparing voucher</span>
              </div>

              {/* 2. Passed By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Passed By (Authorized Person Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={passedBy}
                  onChange={(e) => setPassedBy(e.target.value)}
                  placeholder="e.g., Lakshmi Narayana (Chief Accounts Officer)"
                  className={`w-full text-xs rounded-lg border px-3 py-2 bg-slate-50 focus:bg-white ${
                    errors.passedBy ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-300'
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Accounts Manager / CFO signatory</span>
              </div>
            </div>

            {/* 3. Receiver's Signature */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                3. Receiver's Signature (Pad or Upload)
              </label>
              <SignaturePad
                signature={receiverSignature}
                signatureType={receiverSignatureType}
                onChange={(sig, type) => {
                  setReceiverSignature(sig);
                  setReceiverSignatureType(type);
                }}
                signerName={receivedFrom || 'Receiver Signatory'}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: DOCUMENT UPLOAD */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span className="text-sm font-bold text-slate-900">D. Document Upload & Attachments</span>
          </div>
          <DocumentUploadSection
            attachments={attachments}
            onChange={(newAtts) => setAttachments(newAtts)}
          />
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              Save & Print Voucher
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-all flex items-center gap-2 shadow-xs active:scale-98 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : isEditing ? 'Update IN Voucher' : 'Save Voucher'}
            </button>
          </div>
        </div>

      </form>

      {/* QUICK ADD ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                Add New Accountant Name / Ledger Head
              </h4>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accountant Name / Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Rajesh Sharma (Senior Accountant) / Tata Projects Advance"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Group
                </label>
                <select
                  value={newAccountGroup}
                  onChange={(e) => setNewAccountGroup(e.target.value as AccountHead['group'])}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50"
                >
                  <option value="Direct Income">Direct Income</option>
                  <option value="Indirect Income">Indirect Income</option>
                  <option value="Sundry Debtors">Sundry Debtors</option>
                  <option value="Current Assets">Current Assets</option>
                  <option value="Advances">Advances</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4015"
                  value={newAccountCode}
                  onChange={(e) => setNewAccountCode(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Accountant / Account Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
