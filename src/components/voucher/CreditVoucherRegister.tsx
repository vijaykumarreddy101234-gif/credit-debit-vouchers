import { useAccess } from '../AccessContext';
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Building,
  RotateCcw,
  Copy,
  ClipboardPaste,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Paperclip
} from 'lucide-react';
import { CreditVoucher, UserProfile } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { exportInVouchersToExcel } from '../../utils/excelExport';
import { voucherStorage } from '../../utils/voucherStorage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface CreditVoucherRegisterProps {
  currentUser: UserProfile;
  vouchers: CreditVoucher[];
  onRefresh: () => void;
  onCreateNew: () => void;
  onEdit: (voucher: CreditVoucher) => void;
  onPrint: (voucher: CreditVoucher) => void;
  onView: (voucher: CreditVoucher) => void;
}

export const CreditVoucherRegister: React.FC<CreditVoucherRegisterProps> = ({
  currentUser,
  vouchers,
  onRefresh,
  onCreateNew,
  onEdit,
  onPrint,
  onView,
}) => {
  const { can } = useAccess();
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [receiptModeFilter, setReceiptModeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [partyTypeFilter, setPartyTypeFilter] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<CreditVoucher | null>(null);

  const notifyUser = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Financial summary across whole database
  const financialSummary = voucherStorage.getFinancialSummary();

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || 
        v.voucherNo.toLowerCase().includes(term) ||
        v.customerName.toLowerCase().includes(term) ||
        v.description.toLowerCase().includes(term) ||
        (v.invoiceNumber && v.invoiceNumber.toLowerCase().includes(term)) ||
        (v.referenceDetails && v.referenceDetails.toLowerCase().includes(term));
      
      const matchesFromDate = !fromDate || v.date >= fromDate;
      const matchesToDate = !toDate || v.date <= toDate;
      const matchesMode = receiptModeFilter === 'All' || v.receiptMode === receiptModeFilter;
      const matchesStatus = statusFilter === 'All' || v.approvalStatus === statusFilter;
      const matchesType = partyTypeFilter === 'All' || v.receiptType === partyTypeFilter;

      return matchesSearch && matchesFromDate && matchesToDate && matchesMode && matchesStatus && matchesType;
    });
  }, [vouchers, searchTerm, fromDate, toDate, receiptModeFilter, statusFilter, partyTypeFilter]);

  const totalPages = Math.ceil(filteredVouchers.length / rowsPerPage) || 1;
  const paginatedVouchers = filteredVouchers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const stats = useMemo(() => {
    const totalCreditFiltered = filteredVouchers.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
    const approvedCreditFiltered = filteredVouchers.filter(v => v.approvalStatus === 'Approved').reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
    const pendingCount = filteredVouchers.filter(v => v.approvalStatus === 'Pending').length;
    return { totalCreditFiltered, approvedCreditFiltered, pendingCount };
  }, [filteredVouchers]);

  const handleDelete = (voucher: CreditVoucher) => {
    setVoucherToDelete(voucher);
  };

  const confirmDeleteVoucher = () => {
    if (!voucherToDelete) return;
    try {
      voucherStorage.deleteCreditVoucher(voucherToDelete.id, currentUser);
      notifyUser(`Credit Voucher ${voucherToDelete.voucherNo} permanently deleted.`);
      onRefresh();
    } catch (err: any) {
      notifyUser(`Delete error: ${err.message}`);
    } finally {
      setVoucherToDelete(null);
    }
  };

  const handleCopyVoucher = (voucher: CreditVoucher) => {
    navigator.clipboard.writeText(JSON.stringify(voucher, null, 2));
    notifyUser(`Copied voucher ${voucher.voucherNo} to clipboard!`);
  };

  const handlePasteNewVoucher = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        notifyUser('Clipboard is empty.');
        return;
      }
      const data = JSON.parse(text);
      if (!data.amount || !data.customerName) {
        notifyUser('Clipboard does not contain valid Credit Voucher data.');
        return;
      }
      const newVoucher = voucherStorage.saveCreditVoucher({
        ...data,
        id: undefined,
        voucherNo: voucherStorage.getNextCreditVoucherNumber(),
        date: new Date().toISOString().split('T')[0],
      });
      onRefresh();
      notifyUser(`Created new Credit Voucher ${newVoucher.voucherNo} from pasted data!`);
    } catch {
      notifyUser('Failed to parse voucher from clipboard. Please ensure valid JSON was copied.');
    }
  };

  const handleExportExcel = () => {
    if (filteredVouchers.length === 0) {
      notifyUser('No vouchers match the current filters to export.');
      return;
    }
    exportInVouchersToExcel(filteredVouchers, `Raviraja_Credit_Register_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setReceiptModeFilter('All');
    setStatusFilter('All');
    setPartyTypeFilter('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header with Title and Primary Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-widest mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            Credit Register • IN Modules
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Credit Voucher Register</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
              {filteredVouchers.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium font-serif italic mt-0.5">
            Real-time ledger of client receipts, sales milestones, RTGS transfers, and credit collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePasteNewVoucher}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Paste copied voucher from clipboard to create a new entry"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paste Record</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
            title="Export filtered records to Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {can('in.create') && (
<button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Credit Voucher</span>
          </button>
)}
        </div>
      </div>

      {/* TOTALS DISPLAY: Debit, Credit & Closing Net Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Credit Card */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Total Credit (IN)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-2">
            {formatIndianCurrency(financialSummary.totalCredit)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center justify-between">
            <span>Approved: {formatIndianCurrency(financialSummary.approvedCredit)}</span>
            <span className="font-bold text-emerald-700 font-mono">{financialSummary.creditCount} vouchers</span>
          </div>
        </div>

        {/* Total Debit Card */}
        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Total Debit (OUT)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-2">
            {formatIndianCurrency(financialSummary.totalDebit)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center justify-between">
            <span>Approved: {formatIndianCurrency(financialSummary.approvedDebit)}</span>
            <span className="font-bold text-rose-700 font-mono">{financialSummary.debitCount} vouchers</span>
          </div>
        </div>

        {/* Closing Net Balance Card */}
        <div className={`bg-white rounded-2xl border p-4 shadow-sm relative overflow-hidden ${
          financialSummary.netBalance >= 0 ? 'border-blue-200 bg-gradient-to-br from-white to-blue-50/40' : 'border-amber-200 bg-gradient-to-br from-white to-amber-50/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              Closing Net Balance
            </span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
              financialSummary.netBalance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {financialSummary.netBalance >= 0 ? 'Surplus (CR)' : 'Deficit (DR)'}
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono mt-2 ${
            financialSummary.netBalance >= 0 ? 'text-blue-900' : 'text-amber-800'
          }`}>
            {formatIndianCurrency(financialSummary.netBalance)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            (Total IN Receipts − Total OUT Disbursements)
          </div>
        </div>

        {/* Filtered Credit & Pending Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Active View Total</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {stats.pendingCount} Pending
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-2">
            {formatIndianCurrency(stats.totalCreditFiltered)}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1 text-amber-700 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Pending vouchers NOT treated as approved</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search Term */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voucher no, customer, invoice, purpose..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>

          {/* From Date */}
          <div>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                title="From Date"
              />
            </div>
          </div>

          {/* To Date */}
          <div>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                title="To Date"
              />
            </div>
          </div>

          {/* Receipt Mode */}
          <div>
            <select
              value={receiptModeFilter}
              onChange={(e) => { setReceiptModeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Link */}
        {(searchTerm || fromDate || toDate || receiptModeFilter !== 'All' || statusFilter !== 'All') && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">Filtered from {vouchers.length} total credit records</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Vouchers Table with Row Icons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5">Voucher No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Party / Customer</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Purpose & Invoice</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Docs</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="text-sm font-bold text-slate-600">No credit vouchers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria or create a new voucher</p>
                  </td>
                </tr>
              ) : (
                paginatedVouchers.map((voucher) => (
                  <tr
                    key={voucher.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Voucher No */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onView(voucher)}
                        className="font-mono font-black text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>{voucher.voucherNo}</span>
                      </button>
                      <span className="text-[9px] text-slate-400 block font-mono">IN(Credit)</span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                      {voucher.date}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                        {voucher.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {voucher.receiptType || 'Sales'}
                      </span>
                    </td>

                    {/* Mode */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {voucher.receiptMode}
                      </span>
                    </td>

                    {/* Description & Invoice */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <span className="truncate block font-medium text-slate-700" title={voucher.description}>
                        {voucher.description}
                      </span>
                      {voucher.invoiceNumber && (
                        <span className="text-[10px] text-blue-700 font-mono font-bold block">
                          Inv: {voucher.invoiceNumber}
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-black text-slate-900 text-sm">
                      {Number(voucher.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status with quick 1-click cell edit */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = 
                            voucher.approvalStatus === 'Pending' ? 'Approved' :
                            voucher.approvalStatus === 'Approved' ? 'Rejected' : 'Pending';
                          voucherStorage.saveCreditVoucher({
                            ...voucher,
                            approvalStatus: nextStatus as any,
                            approvedBy: nextStatus === 'Approved' ? (voucher.approvedBy || currentUser.name) : (nextStatus === 'Pending' ? '' : voucher.approvedBy)
                          });
                          onRefresh();
                          notifyUser(`Voucher ${voucher.voucherNo} status updated to ${nextStatus}`);
                        }}
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer hover:scale-105 transition-transform ${
                          voucher.approvalStatus === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : voucher.approvalStatus === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                        title={can('voucher.approve') ? "Click to toggle status: Pending -> Approved -> Rejected" : "You do not have permission to change status"}
                        disabled={!can('voucher.approve')}
                      >
                        {voucher.approvalStatus}
                      </button>
                    </td>

                    {/* Docs */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono">
                      {voucher.attachments && voucher.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <Paperclip className="w-3 h-3" />
                          {voucher.attachments.length}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>

                    {/* ACTION ICONS FOR EVERY RECORD */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <button
                          type="button"
                          onClick={() => onView(voucher)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        {can('in.edit') && (
<button
                          type="button"
                          onClick={() => onEdit(voucher)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Voucher"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
)}

                        {/* Copy */}
                        <button
                          type="button"
                          onClick={() => handleCopyVoucher(voucher)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Copy Voucher Data"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Print */}
                        {can('pdf.download') && (
<button
                          type="button"
                          onClick={() => onPrint(voucher)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Voucher (A4)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
)}

                        {/* Download PDF */}
                        {can('pdf.download') && (
<button
                          type="button"
                          onClick={() => generateVoucherPdf(voucher)}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
)}

                        {/* Delete */}
                        {can('in.delete') && (
<button
                          type="button"
                          onClick={() => handleDelete(voucher)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
            <span className="text-slate-400">|</span>
            <span>Showing {filteredVouchers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredVouchers.length)} of {filteredVouchers.length} entries</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* In-App Confirmation Modal for Deletion (No blocked iframe confirm calls) */}
      <ConfirmDeleteModal
        isOpen={Boolean(voucherToDelete)}
        title="Delete Credit Voucher"
        message={`Are you sure you want to permanently delete Credit Voucher "${voucherToDelete?.voucherNo}" for ${voucherToDelete?.customerName}?`}
        details={`Amount: ₹${Number(voucherToDelete?.amount || 0).toLocaleString('en-IN')} • Date: ${voucherToDelete?.date} • Mode: ${voucherToDelete?.receiptMode}`}
        confirmLabel="Delete Voucher"
        onConfirm={confirmDeleteVoucher}
        onClose={() => setVoucherToDelete(null)}
      />
    </div>
  );
};
