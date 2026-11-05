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
  ShieldAlert,
  Briefcase,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';
import { CreditVoucher, UserProfile } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';
import { generateVoucherPdf } from '../../utils/pdfGenerator';
import { voucherStorage } from '../../utils/voucherStorage';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptModeFilter, setReceiptModeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [receiptTypeFilter, setReceiptTypeFilter] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || 
        v.voucherNo.toLowerCase().includes(term) ||
        v.customerName.toLowerCase().includes(term) ||
        v.description.toLowerCase().includes(term) ||
        (v.invoiceNumber && v.invoiceNumber.toLowerCase().includes(term));
      
      const matchesMode = receiptModeFilter === 'All' || v.receiptMode === receiptModeFilter;
      const matchesStatus = statusFilter === 'All' || v.approvalStatus === statusFilter;
      const matchesType = receiptTypeFilter === 'All' || v.receiptType === receiptTypeFilter;

      return matchesSearch && matchesMode && matchesStatus && matchesType;
    });
  }, [vouchers, searchTerm, receiptModeFilter, statusFilter, receiptTypeFilter]);

  const paginated = filteredVouchers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredVouchers.length / rowsPerPage) || 1;

  const stats = useMemo(() => {
    const total = vouchers.reduce((acc, v) => acc + v.amount, 0);
    const approved = vouchers.filter(v => v.approvalStatus === 'Approved').reduce((acc, v) => acc + v.amount, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTotal = vouchers.filter(v => v.date === todayStr).reduce((acc, v) => acc + v.amount, 0);
    return { total, approved, todayTotal };
  }, [vouchers]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this credit voucher?')) {
      try {
        voucherStorage.deleteCreditVoucher(id, currentUser);
        onRefresh();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">IN</span>
            Credit Voucher Register
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Sequential receipts ledger and customer payment tracking</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Credit Voucher
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Collections</span>
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">{formatIndianCurrency(stats.total)}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee className="w-4 h-4" /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approved Receipts</span>
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">{formatIndianCurrency(stats.approved)}</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Today's Inflow</span>
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-black text-blue-900 font-mono">{formatIndianCurrency(stats.todayTotal)}</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Calendar className="w-4 h-4" /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Voucher, Customer, Inv..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
        <select value={receiptModeFilter} onChange={(e) => setReceiptModeFilter(e.target.value)} className="text-xs rounded-xl border border-slate-200 px-3 sm:px-4 py-2 bg-slate-50">
          <option value="All">All Modes</option>
          <option value="Cash">Cash</option>
          <option value="Bank">Bank</option>
          <option value="Cheque">Cheque</option>
          <option value="UPI">UPI</option>
        </select>
        <select value={receiptTypeFilter} onChange={(e) => setReceiptTypeFilter(e.target.value)} className="text-xs rounded-xl border border-slate-200 px-3 sm:px-4 py-2 bg-slate-50">
          <option value="All">All Types</option>
          <option value="Sales">Sales Payment</option>
          <option value="Party Payment">Party Payment</option>
          <option value="Other">Other</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs rounded-xl border border-slate-200 px-3 sm:px-4 py-2 bg-slate-50">
          <option value="All">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px]">
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Voucher No</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Docs</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length > 0 ? paginated.map((v, i) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group/row">
                  <td className="px-4 py-3 text-center text-slate-400 font-mono">{(currentPage-1)*rowsPerPage + i + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{v.date}</td>
                  <td className="px-4 py-3 font-mono font-black text-emerald-700">{v.voucherNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{v.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-medium italic">{v.receiptType}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600">{v.receiptMode}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-slate-900">{formatIndianCurrency(v.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      v.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      v.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {v.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.attachments && v.attachments.length > 0 ? (
                      <button 
                        onClick={() => onView(v)}
                        className="flex items-center justify-center gap-1 text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors mx-auto" 
                        title={`View ${v.attachments.length} attachment(s)`}
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{v.attachments.length}</span>
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onView(v)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onEdit(v)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onPrint(v)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Print"><Printer className="w-3.5 h-3.5" /></button>
                      <button onClick={() => generateVoucherPdf(v)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download PDF"><Download className="w-3.5 h-3.5" /></button>
                      {currentUser.role === 'Admin' && (
                        <button onClick={() => handleDelete(v.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 opacity-20" />
                      No Credit Vouchers found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <div>Showing {(currentPage-1)*rowsPerPage + 1} to {Math.min(currentPage*rowsPerPage, filteredVouchers.length)} of {filteredVouchers.length} entries</div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage===1} onClick={() => setCurrentPage(p => p-1)} className="p-1 hover:bg-slate-200 rounded transition-colors disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-slate-900">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(p => p+1)} className="p-1 hover:bg-slate-200 rounded transition-colors disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
