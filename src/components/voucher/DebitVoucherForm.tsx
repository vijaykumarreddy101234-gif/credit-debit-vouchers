import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Calendar,
  Save,
  Printer,
  FileSpreadsheet,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Paperclip,
  Check,
  Plus,
  Settings2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DebitVoucher,
  PaymentMode,
  VoucherAttachment,
  VoucherLineItem,
  UserProfile,
  VoucherStatus
} from '../../types/voucher';
import { numberToIndianWords, formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { voucherStorage } from '../../utils/voucherStorage';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { exportInVouchersToExcel } from '../../utils/excelExport';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface DebitVoucherFormProps {
  initialVoucher?: DebitVoucher | null;
  currentUser: UserProfile;
  onSaveSuccess: (savedVoucher: DebitVoucher, andPrint?: boolean) => void;
  onDeleteSuccess?: (voucherNo: string) => void;
  onCancel: () => void;
  onSwitchToCredit?: () => void;
}

export const DebitVoucherForm: React.FC<DebitVoucherFormProps> = ({
  initialVoucher,
  currentUser,
  onSaveSuccess,
  onDeleteSuccess,
  onCancel,
  onSwitchToCredit,
}) => {
  const isEditing = Boolean(initialVoucher?.id);

  // Field 1: Voucher No
  const [voucherNo, setVoucherNo] = useState<string>(
    initialVoucher?.voucherNo || ''
  );

  // Field 2: Voucher Date
  const [date, setDate] = useState<string>(
    initialVoucher?.date || new Date().toISOString().split('T')[0]
  );
  const [isDateLocked, setIsDateLocked] = useState<boolean>(!isEditing);

  // Field 3: Payment Mode
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initialVoucher?.paymentMode || 'Cash'
  );

  // Field 4: Main Account
  const [mainAccount, setMainAccount] = useState<string>(
    initialVoucher?.mainAccount || 'Company Office'
  );
  const [mainAccountList, setMainAccountList] = useState<string[]>(() =>
    voucherStorage.getMainAccounts()
  );

  // Field 5: Amount (₹)
  const [amount, setAmount] = useState<string>(
    initialVoucher?.amount ? String(initialVoucher.amount) : ''
  );

  // Field 6: Amount in Words
  const [amountInWords, setAmountInWords] = useState<string>(
    initialVoucher?.amountInWords || ''
  );

  // Advanced Line Items / Particulars
  const [items, setItems] = useState<VoucherLineItem[]>(
    initialVoucher?.items || []
  );
  const [showItemsTable, setShowItemsTable] = useState<boolean>(
    Boolean(initialVoucher?.items && initialVoucher.items.length > 0)
  );
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<string>('1');
  const [newItemRate, setNewItemRate] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Field 7: Person Name
  const [personName, setPersonName] = useState<string>(
    initialVoucher?.personName || initialVoucher?.supplierName || ''
  );
  const [personList, setPersonList] = useState<string[]>(() =>
    voucherStorage.getSuppliers()
  );

  // Field 8: Invoice / Document attachments
  const [attachments, setAttachments] = useState<VoucherAttachment[]>(
    initialVoucher?.attachments || []
  );

  // Field 9: Reason
  const [reason, setReason] = useState<string>(
    initialVoucher?.description || initialVoucher?.noteReason || ''
  );

  // Field 10: Approved Person
  const [approvedPerson, setApprovedPerson] = useState<string>(
    initialVoucher?.approvedBy || 'Lakshmi Narayana'
  );

  // Field 11: Cashier
  const [cashier, setCashier] = useState<string>(
    initialVoucher?.cashierName || currentUser.name || 'Suresh Kumar'
  );
  const [cashierList, setCashierList] = useState<string[]>(() =>
    voucherStorage.getCashiers()
  );

  const [approvalStatus, setApprovalStatus] = useState<VoucherStatus>(
    initialVoucher?.approvalStatus || 'Pending'
  );

  // Modal State for Managing Cell Items (Add / Edit / Delete in cells)
  const [manageCellType, setManageCellType] = useState<
    'mainAccount' | 'person' | 'cashier' | null
  >(null);
  const [newItemInput, setNewItemInput] = useState<string>('');
  const [editingMasterItem, setEditingMasterItem] = useState<{
    original: string;
    current: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setVoucherNo(voucherStorage.getNextDebitVoucherNumber());
    }
  }, [isEditing]);

  // Recalculate amount when items change (if items table is active)
  useEffect(() => {
    if (showItemsTable) {
      if (items.length > 0) {
        const sum = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
        setAmount(String(sum));
      } else {
        setAmount('0');
      }
    }
  }, [items, showItemsTable]);

  useEffect(() => {
    const num = parseFloat(amount);
    if (!isNaN(num) && num > 0) {
      setAmountInWords(numberToIndianWords(num));
    } else {
      setAmountInWords('');
    }
  }, [amount]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Line Item Handlers
  const handleAddOrUpdateItem = () => {
    if (!newItemName.trim()) {
      showToast('Please enter item / particulars name');
      return;
    }
    const qty = parseFloat(newItemQty) || 1;
    const rate = parseFloat(newItemRate) || 0;
    const itemAmount = rate > 0 ? qty * rate : (parseFloat(newItemRate) || 0);

    if (editingItemId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItemId
            ? { ...it, name: newItemName.trim(), qty, rate, amount: itemAmount }
            : it
        )
      );
      setEditingItemId(null);
      showToast('Item updated successfully');
    } else {
      const newItem: VoucherLineItem = {
        id: `item-${Date.now()}`,
        name: newItemName.trim(),
        qty,
        rate,
        amount: itemAmount,
      };
      setItems((prev) => [...prev, newItem]);
      showToast('Item added successfully');
    }
    setNewItemName('');
    setNewItemQty('1');
    setNewItemRate('');
  };

  const handleEditItem = (item: VoucherLineItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemQty(item.qty ? String(item.qty) : '1');
    setNewItemRate(item.rate ? String(item.rate) : String(item.amount));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    showToast('Item deleted');
  };

  // Master Cell Management Handlers
  const handleAddMasterItem = () => {
    if (!newItemInput.trim()) return;
    const val = newItemInput.trim();
    if (manageCellType === 'mainAccount') {
      const updated = voucherStorage.addMainAccount(val);
      setMainAccountList(updated);
      setMainAccount(val);
    } else if (manageCellType === 'person') {
      const updated = voucherStorage.addSupplier(val);
      setPersonList(updated);
      setPersonName(val);
    } else if (manageCellType === 'cashier') {
      const updated = voucherStorage.addCashier(val);
      setCashierList(updated);
      setCashier(val);
    }
    setNewItemInput('');
    showToast(`Added: ${val}`);
  };

  const handleSaveEditedMasterItem = () => {
    if (!editingMasterItem || !editingMasterItem.current.trim()) return;
    const oldVal = editingMasterItem.original;
    const newVal = editingMasterItem.current.trim();

    if (manageCellType === 'mainAccount') {
      const updated = voucherStorage.updateMainAccount(oldVal, newVal);
      setMainAccountList(updated);
      if (mainAccount === oldVal) setMainAccount(newVal);
    } else if (manageCellType === 'person') {
      const updated = voucherStorage.updateSupplier(oldVal, newVal);
      setPersonList(updated);
      if (personName === oldVal) setPersonName(newVal);
    } else if (manageCellType === 'cashier') {
      const updated = voucherStorage.getCashiers().map((c) =>
        c === oldVal ? newVal : c
      );
      setCashierList(updated);
      if (cashier === oldVal) setCashier(newVal);
    }
    setEditingMasterItem(null);
    showToast(`Updated to: ${newVal}`);
  };

  const handleDeleteMasterItem = (item: string) => {
    if (manageCellType === 'mainAccount') {
      const updated = voucherStorage.deleteMainAccount(item);
      setMainAccountList(updated);
      if (mainAccount === item) setMainAccount(updated[0] || '');
    } else if (manageCellType === 'person') {
      const updated = voucherStorage.deleteSupplier(item);
      setPersonList(updated);
      if (personName === item) setPersonName(updated[0] || '');
    } else if (manageCellType === 'cashier') {
      const updated = voucherStorage.deleteCashier(item);
      setCashierList(updated);
      if (cashier === item) setCashier(updated[0] || '');
    }
    showToast(`Deleted: ${item}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: VoucherAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errs.amount = 'Please enter a valid amount';
    }
    if (!personName.trim()) {
      errs.personName = 'Please enter or select a person name';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildVoucher = (): Partial<DebitVoucher> => {
    return {
      id: initialVoucher?.id,
      voucherNo: voucherNo.trim() || voucherStorage.getNextDebitVoucherNumber(),
      date,
      paymentMode,
      mainAccount,
      amount: parseFloat(amount) || 0,
      amountInWords: amountInWords || (amount ? numberToIndianWords(parseFloat(amount)) : ''),
      personName: personName.trim(),
      supplierName: personName.trim(),
      supplierDetails: 'Expense',
      description: reason.trim() || 'Payment disbursement',
      noteReason: reason.trim(),
      approvedBy: approvedPerson.trim(),
      approvalStatus,
      cashierName: cashier.trim(),
      attachments,
      items: items.length > 0 ? items : undefined,
    };
  };

  const handleSave = (andPrint: boolean = false) => {
    if (!validate()) {
      showToast('Please enter Amount and Person Name before saving.');
      return;
    }
    setIsSubmitting(true);
    try {
      const voucherData = buildVoucher();
      const saved = voucherStorage.saveDebitVoucher(voucherData);
      onSaveSuccess(saved, andPrint);
    } catch (err: any) {
      showToast(`Save error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVoucher = () => {
    if (isEditing && initialVoucher?.id) {
      setShowDeleteModal(true);
    } else {
      setShowClearModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (initialVoucher?.id) {
      try {
        voucherStorage.deleteDebitVoucher(initialVoucher.id, currentUser);
        showToast(`Voucher ${initialVoucher.voucherNo} deleted`);
        if (onDeleteSuccess) {
          onDeleteSuccess(initialVoucher.voucherNo);
        } else {
          onCancel();
        }
      } catch (e: any) {
        showToast(`Delete error: ${e.message}`);
      }
    }
  };

  const handleConfirmClear = () => {
    setAmount('');
    setAmountInWords('');
    setPersonName('');
    setReason('');
    setAttachments([]);
    setItems([]);
    showToast('Form fields cleared');
  };

  const handleExportExcel = () => {
    if (!validate()) return;
    const v = buildVoucher() as DebitVoucher;
    exportInVouchersToExcel([v], `${v.voucherNo || 'Debit_Voucher'}.csv`);
  };

  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDate;
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-2 sm:px-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Form Box matching screenshot layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            title="Cancel"
          >
            ← Back
          </button>
          
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight text-center">
            DEBIT VOUCHER (OUT)
          </h2>

          {onSwitchToCredit ? (
            <button
              type="button"
              onClick={onSwitchToCredit}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-colors"
              title="Switch to Credit Voucher (IN)"
            >
              Switch to IN
            </button>
          ) : (
            <span className="w-8" />
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Row 1: 1. Voucher No. & 2. Voucher Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Voucher No. */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                1. Voucher No.
              </label>
              <div className="w-full h-14 rounded-lg border border-slate-200 bg-slate-50/40 p-2.5 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">
                  AUTO GENERATED
                </span>
                <span className="text-sm font-bold text-emerald-700 font-mono tracking-wide block leading-tight">
                  {voucherNo || 'DV-0001'}
                </span>
              </div>
            </div>

            {/* 2. Voucher Date */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>2. Voucher Date</span>
                <button
                  type="button"
                  onClick={() => setIsDateLocked(!isDateLocked)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  {isDateLocked ? 'Unlock' : 'Lock'}
                </button>
              </label>
              <div className="w-full h-14 rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 flex flex-col justify-center">
                {isDateLocked ? (
                  <>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {formatDateDisplay(date)}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      Default today's date · Locked
                    </span>
                  </>
                ) : (
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Row 2: 3. Payment Mode & 4. Main Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3. Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. Payment Mode
              </label>
              <div className="w-full rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                {(['Cash', 'Bank', 'Cheque', 'UPI', 'Other'] as PaymentMode[]).map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer hover:text-slate-900 select-none"
                  >
                    <input
                      type="radio"
                      name="debitPaymentMode"
                      value={mode}
                      checked={paymentMode === mode}
                      onChange={() => setPaymentMode(mode)}
                      className="w-3.5 h-3.5 text-slate-800 border-slate-300 focus:ring-slate-500"
                    />
                    <span>{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Main Account (with Edit / Delete options in cell) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  4. Main Account
                </label>
                <button
                  type="button"
                  onClick={() => setManageCellType('mainAccount')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Add, Edit or Delete Accounts"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Edit/Add</span>
                </button>
              </div>

              <div className="w-full rounded-lg border border-slate-200 bg-slate-50/30 p-2.5">
                <select
                  value={mainAccount}
                  onChange={(e) => setMainAccount(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 mb-0.5 cursor-pointer"
                >
                  {mainAccountList.map((acc, idx) => (
                    <option key={idx} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block">
                  Select account
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: 5. Amount (₹) & 6. Amount in Words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 5. Amount (₹) + Optional Add Items toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  5. Amount (₹)
                </label>
                <button
                  type="button"
                  onClick={() => setShowItemsTable(!showItemsTable)}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 cursor-pointer"
                  title="Add itemized particulars / rows"
                >
                  <Layers className="w-3 h-3" />
                  <span>{showItemsTable ? 'Hide Items' : '+ Add Items'}</span>
                </button>
              </div>

              <input
                type="number"
                step="any"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full h-11 text-xs rounded-lg border ${
                  errors.amount ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                } bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono font-bold`}
              />
              {errors.amount && (
                <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                  {errors.amount}
                </span>
              )}
            </div>

            {/* 6. Amount in Words */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                6. Amount in Words
              </label>
              <input
                type="text"
                placeholder="Auto Convert Amount"
                value={amountInWords}
                onChange={(e) => setAmountInWords(e.target.value)}
                className="w-full h-11 text-xs rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-slate-700 italic focus:outline-none"
              />
            </div>
          </div>

          {/* ADVANCED LINE ITEMS MODULE (Expandable: Add, Edit, Delete line items) */}
          {showItemsTable && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-3 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Itemized Particulars ({items.length} items)
                </span>
                <span className="text-[10px] text-slate-500">
                  Total auto-updates Amount (₹)
                </span>
              </div>

              {/* Add / Edit Item Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <input
                  type="text"
                  placeholder="Item / Particulars description..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="sm:col-span-6 h-8 px-2 border border-slate-200 rounded text-xs"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="sm:col-span-2 h-8 px-2 border border-slate-200 rounded text-xs font-mono"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Rate / ₹"
                  value={newItemRate}
                  onChange={(e) => setNewItemRate(e.target.value)}
                  className="sm:col-span-2 h-8 px-2 border border-slate-200 rounded text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddOrUpdateItem}
                  className="sm:col-span-2 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingItemId ? 'Update' : 'Add'}</span>
                </button>
              </div>

              {/* Items Table with Edit / Delete on each row */}
              {items.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Item / Description</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Rate (₹)</th>
                        <th className="py-2 px-3 text-right">Amount (₹)</th>
                        <th className="py-2 px-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{it.name}</td>
                          <td className="py-2 px-2 text-center font-mono">{it.qty || 1}</td>
                          <td className="py-2 px-2 text-right font-mono">{it.rate ? formatIndianCurrency(it.rate) : '-'}</td>
                          <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">{formatIndianCurrency(it.amount)}</td>
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditItem(it)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                title="Edit item"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(it.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Row 4: 7. Person Name (with Edit / Delete options in cell) & 8. Invoice / Document */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 7. Person Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  7. Person Name
                </label>
                <button
                  type="button"
                  onClick={() => setManageCellType('person')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Add, Edit or Delete Person/Vendor Names"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Edit/Add</span>
                </button>
              </div>

              <input
                type="text"
                list="debitPersonList"
                placeholder="Enter / Select Person"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className={`w-full h-11 text-xs rounded-lg border ${
                  errors.personName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                } bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400`}
              />
              <datalist id="debitPersonList">
                {personList.map((p, idx) => (
                  <option key={idx} value={p} />
                ))}
              </datalist>
              {errors.personName && (
                <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                  {errors.personName}
                </span>
              )}
            </div>

            {/* 8. Invoice / Document */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                8. Invoice / Document
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,application/pdf"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded-lg border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center"
              >
                <UploadCloud className="w-5 h-5 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  + Add Document / Photo
                </span>
                <span className="text-[10px] text-slate-400">
                  PDF, JPG, PNG
                </span>
              </div>

              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px]"
                    >
                      <span className="truncate max-w-[150px] font-medium text-slate-700">
                        {att.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 5: 9. Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              9. Reason
            </label>
            <input
              type="text"
              placeholder="Enter payment reason / description"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Row 6: 10. Approved Person & 11. Cashier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 10. Approved Person */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                10. Approved Person
              </label>
              <input
                type="text"
                placeholder="Select / Enter Name"
                value={approvedPerson}
                onChange={(e) => setApprovedPerson(e.target.value)}
                className="w-full h-11 text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 mb-1"
              />
              <span className="text-[10px] text-slate-400 block">
                Approval signature
              </span>
            </div>

            {/* 11. Cashier */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  11. Cashier
                </label>
                <button
                  type="button"
                  onClick={() => setManageCellType('cashier')}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Add, Edit or Delete Cashier Names"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Edit/Add</span>
                </button>
              </div>

              <input
                type="text"
                list="debitCashierList"
                placeholder="Select / Enter Name"
                value={cashier}
                onChange={(e) => setCashier(e.target.value)}
                className="w-full h-11 text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 mb-1"
              />
              <datalist id="debitCashierList">
                {cashierList.map((c, idx) => (
                  <option key={idx} value={c} />
                ))}
              </datalist>
              <span className="text-[10px] text-slate-400 block">
                Cashier signature
              </span>
            </div>
          </div>

          {/* Section: Voucher Actions matching image_86bea651.png */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800">
                Voucher Actions
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDeleteVoucher}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                  title="Delete Voucher"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Voucher</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Save */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer w-full text-center"
                >
                  Save
                </button>
                <span className="text-[10px] text-slate-400 block mt-1 text-center">
                  Save voucher
                </span>
              </div>

              {/* Edit */}
              <div>
                <button
                  type="button"
                  onClick={() => showToast('Fields unlocked for editing')}
                  className="px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors cursor-pointer w-full text-center"
                >
                  Edit
                </button>
                <span className="text-[10px] text-slate-400 block mt-1 text-center">
                  Edit voucher
                </span>
              </div>

              {/* Delete */}
              <div>
                <button
                  type="button"
                  onClick={handleDeleteVoucher}
                  className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-md transition-colors cursor-pointer w-full text-center flex items-center justify-center gap-1"
                  title={isEditing ? 'Delete voucher permanently' : 'Clear form fields'}
                >
                  <Trash2 className="w-3 h-3 text-rose-700" />
                  <span>Delete</span>
                </button>
                <span className="text-[10px] text-slate-400 block mt-1 text-center">
                  {isEditing ? 'Delete voucher' : 'Clear form'}
                </span>
              </div>

              {/* Print */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer w-full text-center"
                >
                  Print
                </button>
                <span className="text-[10px] text-slate-400 block mt-1 text-center">
                  Printable voucher
                </span>
              </div>

              {/* Excel */}
              <div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer w-full text-center"
                >
                  Excel
                </button>
                <span className="text-[10px] text-slate-400 block mt-1 text-center">
                  Export voucher
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CELL ITEMS MANAGER MODAL (Edit / Add / Delete options right on cell) */}
      {manageCellType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Manage {manageCellType === 'mainAccount' ? 'Main Accounts' : manageCellType === 'person' ? 'Persons / Vendors' : 'Cashiers'}
              </h4>
              <button
                type="button"
                onClick={() => { setManageCellType(null); setEditingMasterItem(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add new item */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter new name..."
                value={newItemInput}
                onChange={(e) => setNewItemInput(e.target.value)}
                className="flex-1 h-9 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddMasterItem}
                className="px-3 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* List with inline Edit & Delete */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(manageCellType === 'mainAccount' ? mainAccountList : manageCellType === 'person' ? personList : cashierList).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  {editingMasterItem && editingMasterItem.original === item ? (
                    <div className="flex items-center gap-1 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingMasterItem.current}
                        onChange={(e) => setEditingMasterItem({ ...editingMasterItem, current: e.target.value })}
                        className="flex-1 h-7 px-2 text-xs border border-blue-400 rounded bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditedMasterItem}
                        className="p-1 text-emerald-600 hover:text-emerald-800"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium text-slate-800 truncate">{item}</span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingMasterItem({ original: item, current: item })}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Edit item name"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMasterItem(item)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setManageCellType(null); setEditingMasterItem(null); }}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Deleting Voucher */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Debit Voucher"
        message={`Are you sure you want to permanently delete Debit Voucher "${initialVoucher?.voucherNo}"?`}
        details={`Person / Payee: ${personName || initialVoucher?.supplierName || '-'} • Amount: ₹${amount || '0'}`}
        confirmLabel="Delete Voucher"
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* In-App Confirmation Modal for Clearing Draft */}
      <ConfirmDeleteModal
        isOpen={showClearModal}
        title="Clear Voucher Form"
        message="Are you sure you want to clear all entered form fields and reset this draft?"
        confirmLabel="Clear Fields"
        isDangerous={false}
        onConfirm={handleConfirmClear}
        onClose={() => setShowClearModal(false)}
      />

    </div>
  );
};
