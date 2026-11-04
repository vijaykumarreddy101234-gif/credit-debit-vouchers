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
  Paperclip,
  ArrowUpDown,
  Building,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { InVoucher, PaymentMode, UserProfile, formatVoucherType } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { exportInVouchersToExcel } from '../../utils/excelExport';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { voucherStorage } from '../../utils/voucherStorage';
import { VoucherDetailsModal } from './VoucherDetailsModal';

interface InVoucherRegisterProps {
  currentUser: UserProfile;
  vouchers: InVoucher[];
  onRefresh: () => void;
  onCreateNew: () => void;
  onEdit: (voucher: InVoucher) => void;
  onPrint: (voucher: InVoucher) => void;
}

export const InVoucherRegister: React.FC<InVoucherRegisterProps> = ({
  currentUser,
  vouchers,
  onRefresh,
  onCreateNew,
  onEdit,
  onPrint,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('All');
  const [dateFilterMode, setDateFilterMode] = useState<'All' | 'Today' | 'This Week' | 'This Month' | 'Custom'>('All');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof InVoucher>('voucherDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Selected Voucher for Details View Modal
  const [selectedVoucher, setSelectedVoucher] = useState<InVoucher | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Delete Confirmation State
  const [voucherToDelete, setVoucherToDelete] = useState<InVoucher | null>(null);

  // Filter & Search Logic
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      // General search: Voucher Number, Account Name, Received From, Reference Details
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        v.voucherNo.toLowerCase().includes(term) ||
        v.accountName.toLowerCase().includes(term) ||
        (v.personName && v.personName.toLowerCase().includes(term)) ||
        (v.supplierGstin && v.supplierGstin.toLowerCase().includes(term)) ||
        (v.originalPurchaseBill && v.originalPurchaseBill.toLowerCase().includes(term)) ||
        v.receivedFrom.toLowerCase().includes(term) ||
        (v.referenceDetails && v.referenceDetails.toLowerCase().includes(term)) ||
        (v.paymentParticulars && v.paymentParticulars.toLowerCase().includes(term));

      // Voucher Type filter (IN(Credit) or OUT(Debit))
      const vType = formatVoucherType(v.voucherType);
      const matchesType =
        voucherTypeFilter === 'All' ||
        vType === voucherTypeFilter ||
        v.voucherType === voucherTypeFilter;

      // Payment Mode filter
      const matchesMode = paymentModeFilter === 'All' || v.paymentMode === paymentModeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;

      // Date filtering
      let matchesDate = true;
      if (dateFilterMode !== 'All') {
        const vDate = new Date(v.voucherDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilterMode === 'Today') {
          const vDateOnly = new Date(vDate.getFullYear(), vDate.getMonth(), vDate.getDate());
          matchesDate = vDateOnly.getTime() === today.getTime();
        } else if (dateFilterMode === 'This Week') {
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          matchesDate = vDate >= firstDayOfWeek;
        } else if (dateFilterMode === 'This Month') {
          matchesDate =
            vDate.getMonth() === today.getMonth() && vDate.getFullYear() === today.getFullYear();
        } else if (dateFilterMode === 'Custom') {
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = vDate >= start && vDate <= end;
          } else if (customStartDate) {
            const start = new Date(customStartDate);
            matchesDate = vDate >= start;
          } else if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = vDate <= end;
          }
        }
      }

      return matchesSearch && matchesType && matchesMode && matchesStatus && matchesDate;
    });
  }, [
    vouchers,
    searchTerm,
    voucherTypeFilter,
    paymentModeFilter,
    statusFilter,
    dateFilterMode,
    customStartDate,
    customEndDate,
  ]);

  // Sorted Vouchers
  const sortedVouchers = useMemo(() => {
    return [...filteredVouchers].sort((a, b) => {
      const aRaw = a[sortField];
      const bRaw = b[sortField];

      const aVal = aRaw !== undefined && aRaw !== null ? aRaw : '';
      const bVal = bRaw !== undefined && bRaw !== null ? bRaw : '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comp = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? comp : -comp;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredVouchers, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedVouchers.length / rowsPerPage) || 1;
  const paginatedVouchers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedVouchers.slice(start, start + rowsPerPage);
  }, [sortedVouchers, currentPage, rowsPerPage]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalAmount = vouchers.reduce((acc, v) => acc + (v.amount || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayInflow = vouchers
      .filter((v) => v.voucherDate === todayStr)
      .reduce((acc, v) => acc + (v.amount || 0), 0);

    const cashAmount = vouchers
      .filter((v) => v.paymentMode === 'Cash')
      .reduce((acc, v) => acc + (v.amount || 0), 0);

    const bankAndUpiAmount = vouchers
      .filter((v) => v.paymentMode === 'Bank' || v.paymentMode === 'UPI' || v.paymentMode === 'Cheque')
      .reduce((acc, v) => acc + (v.amount || 0), 0);

    return {
      totalAmount,
      todayInflow,
      cashAmount,
      bankAndUpiAmount,
      totalCount: vouchers.length,
      filteredCount: filteredVouchers.length,
    };
  }, [vouchers, filteredVouchers]);

  // Handle Delete
  const confirmDelete = () => {
    if (!voucherToDelete) return;
    try {
      voucherStorage.deleteInVoucher(voucherToDelete.id, currentUser);
      onRefresh();
      setVoucherToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting voucher');
    }
  };

  const toggleSort = (field: keyof InVoucher) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Voucher Desk</span>
            <span>/</span>
            <span className="font-semibold text-emerald-700">IN Voucher Register</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-sm font-black shadow-xs">
              IN
            </span>
            IN Voucher Register (Receipts Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete sequential register of all money received by Raviraja Industries with full audit history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportInVouchersToExcel(filteredVouchers)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
            title="Export filtered list to Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            title="Print Register Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print Register
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            + New IN Voucher Entry
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total IN Inflow</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-slate-900 mt-2">
            {formatIndianCurrency(stats.totalAmount)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {stats.totalCount} registered vouchers
          </span>
        </div>

        {/* Today's Inflow */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Today's Receipts</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-blue-900 mt-2">
            {formatIndianCurrency(stats.todayInflow)}
          </p>
          <span className="text-[11px] text-blue-600/80 font-medium mt-1 block">
            Current business day entries
          </span>
        </div>

        {/* Cash Receipts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Cash Receipts (Safe)</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-amber-900 mt-2">
            {formatIndianCurrency(stats.cashAmount)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Physical currency received
          </span>
        </div>

        {/* Bank & UPI Receipts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Bank & UPI Transfers</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-purple-900 mt-2">
            {formatIndianCurrency(stats.bankAndUpiAmount)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Electronic clearing & RTGS
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="md:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Voucher No, Accountant, Party..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Voucher Type Filter: IN(Credit) or OUT(Debit) */}
          <div className="md:col-span-2">
            <select
              value={voucherTypeFilter}
              onChange={(e) => {
                setVoucherTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-2 bg-slate-50"
            >
              <option value="All">All Types</option>
              <option value="IN(Credit)">IN(Credit)</option>
              <option value="OUT(Debit)">OUT(Debit)</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="md:col-span-3">
            <select
              value={paymentModeFilter}
              onChange={(e) => {
                setPaymentModeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 font-medium"
            >
              <option value="All">All Payment Modes</option>
              <option value="Cash">Cash Only</option>
              <option value="Cheque">Cheque Only</option>
              <option value="DD">Demand Draft (DD)</option>
              <option value="Bank">Bank (RTGS/NEFT)</option>
              <option value="UPI">UPI Payment</option>
            </select>
          </div>

          {/* Date Filter Quick Selector */}
          <div className="md:col-span-2">
            <select
              value={dateFilterMode}
              onChange={(e) => {
                setDateFilterMode(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 font-medium"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today Only</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom...</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setVoucherTypeFilter('All');
                setPaymentModeFilter('All');
                setDateFilterMode('All');
                setCustomStartDate('');
                setCustomEndDate('');
                setStatusFilter('All');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker (shown when Custom is selected) */}
        {dateFilterMode === 'Custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs bg-slate-50/60 p-3 rounded-lg animate-in fade-in">
            <span className="font-semibold text-slate-700">From Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white"
            />
            <span className="font-semibold text-slate-700">To Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white"
            />
            <span className="text-slate-400 text-[11px] ml-auto">
              Filtering records between selected dates
            </span>
          </div>
        )}
      </div>

      {/* Main Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">S.No</th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('voucherDate')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('voucherNo')}
                >
                  <div className="flex items-center gap-1">
                    Voucher No & Type
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Accountant Name</th>
                <th className="py-3.5 px-4">Party Name</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Reference Details</th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount (₹)
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedVouchers.length > 0 ? (
                paginatedVouchers.map((v, index) => {
                  const sNo = (currentPage - 1) * rowsPerPage + index + 1;
                  const hasAttachments = v.attachments && v.attachments.length > 0;
                  const vType = formatVoucherType(v.voucherType);

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* 1. S.No */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {sNo}
                      </td>

                      {/* 2. Date */}
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {v.voucherDate}
                      </td>

                      {/* 3. Voucher Number & Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVoucher(v);
                              setIsDetailsOpen(true);
                            }}
                            className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                            title="Click to view full voucher"
                          >
                            {v.voucherNo}
                            {hasAttachments && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                                <Paperclip className="w-2.5 h-2.5" />
                                {v.attachments.length}
                              </span>
                            )}
                          </button>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                              vType === 'OUT(Debit)'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {vType}
                          </span>
                        </div>
                      </td>

                      {/* 4. Accountant Name */}
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-[200px]" title={v.accountName}>
                        <div className="truncate">{v.accountName}</div>
                        <span className="text-[10px] text-slate-400 font-normal">Account of A/C</span>
                      </td>

                      {/* 5. Party Name */}
                      <td className="py-3 px-4 text-slate-800 max-w-[180px] truncate" title={v.receivedFrom}>
                        {v.receivedFrom}
                      </td>

                      {/* 6. Payment Mode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            v.paymentMode === 'Cash'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : v.paymentMode === 'Cheque'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : v.paymentMode === 'UPI'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {v.paymentMode}
                        </span>
                      </td>

                      {/* 7. Reference Details */}
                      <td className="py-3 px-4 text-slate-500 max-w-[160px] truncate" title={v.referenceDetails || '-'}>
                        {v.referenceDetails || '-'}
                      </td>

                      {/* 8. Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatIndianCurrency(v.amount)}
                      </td>

                      {/* 9. Created By */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                        {v.createdBy || '-'}
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVoucher(v);
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Full Voucher Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEdit(v)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Voucher"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Print */}
                          <button
                            type="button"
                            onClick={() => onPrint(v)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Print Voucher (A4)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF */}
                          <button
                            type="button"
                            onClick={() => generateVoucherPdf(v)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (Admin Only) */}
                          {currentUser.role === 'Admin' ? (
                            <button
                              type="button"
                              onClick={() => setVoucherToDelete(v)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Voucher (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No vouchers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try adjusting your search query or date filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Table Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-slate-900">
                {sortedVouchers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900">
                {Math.min(currentPage * rowsPerPage, sortedVouchers.length)}
              </strong>{' '}
              of <strong className="text-slate-900">{sortedVouchers.length}</strong> vouchers
            </span>

            <div className="flex items-center gap-1.5 ml-4">
              <span className="text-slate-400">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs rounded border-slate-300 py-1 px-2 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="text-xs font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Details View Modal */}
      <VoucherDetailsModal
        voucher={selectedVoucher}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedVoucher(null);
        }}
        onPrint={(v) => {
          setIsDetailsOpen(false);
          onPrint(v);
        }}
        onEdit={(v) => {
          setIsDetailsOpen(false);
          onEdit(v);
        }}
      />

      {/* Delete Confirmation Modal (Admin only) */}
      {voucherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 text-center">
              Delete Voucher {voucherToDelete.voucherNo}?
            </h4>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              Are you sure you want to permanently delete voucher{' '}
              <strong className="text-slate-800 font-mono">{voucherToDelete.voucherNo}</strong> for{' '}
              <strong className="text-slate-800">{formatIndianCurrency(voucherToDelete.amount)}</strong>?
              This action requires System Administrator authority and cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setVoucherToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Yes, Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
