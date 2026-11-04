import React, { useState } from 'react';
import {
  FileText,
  CreditCard,
  Plus,
  Send,
  Calendar,
  Building,
  User,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Printer
} from 'lucide-react';
import { OutVoucher, UserProfile } from '../../types/voucher';
import { voucherStorage } from '../../utils/voucherStorage';
import { formatIndianCurrency, numberToIndianWords } from '../../utils/numberToWordsIndian';

interface OutVoucherModuleProps {
  initialView?: 'entry' | 'register';
  currentUser: UserProfile;
  onCreateNewOut?: () => void;
}

export const OutVoucherModule: React.FC<OutVoucherModuleProps> = ({
  initialView = 'register',
  currentUser,
  onCreateNewOut,
}) => {
  const [view, setView] = useState<'entry' | 'register'>(initialView);
  const [outVouchers, setOutVouchers] = useState<OutVoucher[]>(() => voucherStorage.getOutVouchers());

  // Form state for OUT voucher
  const [voucherNo] = useState<string>(() => voucherStorage.getNextOutVoucherNumber());
  const [voucherDate, setVoucherDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accountName, setAccountName] = useState<string>('Raw Materials - High Tensile Steel Sheets');
  const [paidTo, setPaidTo] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<OutVoucher['paymentMode']>('Bank');
  const [amount, setAmount] = useState<string>('');
  const [particularsNotes, setParticularsNotes] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  const handleSaveOutVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidTo.trim() || !amount || parseFloat(amount) <= 0) {
      alert('Please fill in required fields (Paid To, Valid Amount).');
      return;
    }

    const numAmount = parseFloat(amount);
    const words = numberToIndianWords(numAmount);

    const saved = voucherStorage.saveOutVoucher({
      voucherDate,
      accountName,
      paidTo: paidTo.trim(),
      paymentMode,
      amount: numAmount,
      amountInWords: words,
      particularsNotes: particularsNotes.trim(),
      status: 'Approved',
    });

    setOutVouchers(voucherStorage.getOutVouchers());
    setSaveSuccessMessage(`Successfully saved OUT voucher ${saved.voucherNo}!`);
    setPaidTo('');
    setAmount('');
    setParticularsNotes('');
    setView('register');

    setTimeout(() => {
      setSaveSuccessMessage('');
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner highlighting separation */}
      <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold mb-1">
            <span>Voucher Desk</span>
            <span>/</span>
            <span>OUT Voucher Module (Separate Module)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              OUT
            </span>
            OUT Voucher Management (Expenditure & Payment Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated module for payments, vendor debits, and operational outflows with separate sequence (OUT-XXXX).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('register')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              view === 'register'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            OUT Voucher Register
          </button>
          <button
            type="button"
            onClick={() => {
              if (onCreateNewOut) {
                onCreateNewOut();
              } else {
                setView('entry');
              }
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              view === 'entry'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            + New OUT Voucher Entry
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveSuccessMessage}
        </div>
      )}

      {/* VIEW: ENTRY FORM */}
      {view === 'entry' && (
        <form onSubmit={handleSaveOutVoucher} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create OUT Payment Voucher</h3>
              <p className="text-xs text-slate-500">Record payments disbursed to vendors or operational expenses</p>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
              Voucher No: {voucherNo}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Voucher Date</label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Voucher Type</label>
              <input
                type="text"
                value="OUT (Payment / Outflow)"
                readOnly
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-100 font-bold text-rose-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50"
              >
                <option value="Bank">Bank Transfer (RTGS / NEFT)</option>
                <option value="Cash">Cash (Factory Petty Cash)</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="UPI">Corporate UPI</option>
                <option value="DD">Demand Draft</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Paid To (Vendor / Beneficiary Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Steel Authority of India Ltd (SAIL) / TSSPDCL"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs font-mono font-bold rounded-lg border border-slate-300 px-3 py-2 text-rose-700"
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Account of A/C (Expense / Vendor Head)</label>
              <select
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50"
              >
                <option value="Raw Materials - High Tensile Steel Sheets">Raw Materials - High Tensile Steel Sheets</option>
                <option value="Factory Power & Electricity Charges">Factory Power & Electricity Charges</option>
                <option value="Machinery Maintenance & Spares">Machinery Maintenance & Spares</option>
                <option value="Freight & Logistics Transport Charges">Freight & Logistics Transport Charges</option>
                <option value="Factory Staff Wages & Salaries">Factory Staff Wages & Salaries</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Payment Notes / Narration</label>
              <textarea
                rows={2}
                placeholder="Enter details of payment authorization..."
                value={particularsNotes}
                onChange={(e) => setParticularsNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setView('register')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              Save OUT Voucher
            </button>
          </div>
        </form>
      )}

      {/* VIEW: REGISTER */}
      {view === 'register' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">S.No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Account Head</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outVouchers.map((v, i) => (
                  <tr key={v.id} className="hover:bg-rose-50/30">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{v.voucherDate}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{v.voucherNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{v.accountName}</td>
                    <td className="py-3 px-4 text-slate-800">{v.paidTo}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {v.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatIndianCurrency(v.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{v.createdBy}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
