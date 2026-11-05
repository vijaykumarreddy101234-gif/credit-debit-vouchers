import React from 'react';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  Layers,
  FileText,
  Printer
} from 'lucide-react';
import { InVoucher, CreditVoucher, DebitVoucher } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';

interface VoucherDashboardProps {
  inVouchers: CreditVoucher[];
  outVouchers: DebitVoucher[];
  onNavigate: (tab: 'credit-entry' | 'credit-register' | 'debit-entry' | 'debit-register' | 'docs') => void;
  onViewVoucher: (voucher: InVoucher) => void;
  onPrintVoucher: (voucher: InVoucher) => void;
}

export const VoucherDashboard: React.FC<VoucherDashboardProps> = ({
  inVouchers,
  outVouchers,
  onNavigate,
  onViewVoucher,
  onPrintVoucher,
}) => {
  const totalInflow = inVouchers.reduce((acc, v) => acc + (v.amount || 0), 0);
  const totalOutflow = outVouchers.reduce((acc, v) => acc + (v.amount || 0), 0);
  const netInflow = totalInflow - totalOutflow;

  // Breakdown by mode (Credit only)
  const inModes = inVouchers.reduce((acc: Record<string, number>, v) => {
    acc[v.receiptMode] = (acc[v.receiptMode] || 0) + v.amount;
    return acc;
  }, {});

  const recentVouchers = [...inVouchers, ...outVouchers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6 pb-10">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-white to-slate-50">
        <div>
          <span className="text-xs font-black text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            Enterprise Module: Financial Voucher Desk
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            ERP Financial Executive Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Real-time receipt & disbursement ledger overview with audit verified bank settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('credit-entry')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Credit (IN)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('debit-entry')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Debit (OUT)
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Total IN Inflow */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-100/80">
                Total Credit (Inflow)
              </span>
              <span className="p-1.5 sm:p-2 bg-emerald-400/30 rounded-xl">
                <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-black mt-2 sm:mt-3">
              {formatIndianCurrency(totalInflow)}
            </h2>
            <div className="flex items-center gap-2 mt-2 sm:mt-3 text-[11px] sm:text-xs text-emerald-100">
              <span className="font-bold bg-white/20 px-2 sm:px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                {inVouchers.length} Vouchers
              </span>
              <span className="opacity-70 font-medium">IN-0001+</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-36 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Total OUT Outflow */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-rose-100/80">
                Total Debit (Outflow)
              </span>
              <span className="p-1.5 sm:p-2 bg-rose-400/30 rounded-xl">
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-black mt-2 sm:mt-3">
              {formatIndianCurrency(totalOutflow)}
            </h2>
            <div className="flex items-center gap-2 mt-2 sm:mt-3 text-[11px] sm:text-xs text-rose-100">
              <span className="font-bold bg-white/20 px-2 sm:px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                {outVouchers.length} Vouchers
              </span>
              <span className="opacity-70 font-medium">OUT-0001+</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-36 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Net Position */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden border border-slate-800 sm:col-span-2 lg:col-span-1">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-300/80">
                Net Liquidity Position
              </span>
              <span className="p-1.5 sm:p-2 bg-blue-500/20 rounded-xl">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-black mt-2 sm:mt-3 text-emerald-400">
              {formatIndianCurrency(netInflow)}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-2 sm:mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              SURPLUS VERIFIED ACROSS BANK ACCOUNTS
            </p>
          </div>
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Grid: Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mode Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Credit (IN) Channels
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(inModes).length > 0 ? Object.entries(inModes).map(([mode, amt]) => {
              const pct = totalInflow > 0 ? Math.round((amt / totalInflow) * 100) : 0;
              return (
                <div key={mode} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {mode}
                    </span>
                    <span className="font-mono font-black text-slate-900">{formatIndianCurrency(amt)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center text-slate-400 text-xs font-medium italic">No credit data available.</div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigate('docs')}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-blue-700 uppercase tracking-wider transition-colors"
            >
              <span>View Document Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Recent mixed Activity */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Enterprise Transaction Log
            </h3>
            <div className="flex gap-2">
              <button onClick={() => onNavigate('credit-register')} className="text-[10px] font-bold text-emerald-700 hover:underline">IN Register</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => onNavigate('debit-register')} className="text-[10px] font-bold text-rose-700 hover:underline">OUT Register</button>
            </div>
          </div>

          <div className="space-y-2">
            {recentVouchers.length > 0 ? recentVouchers.map((v) => {
              const isDebit = v.voucherType === 'OUT(Debit)';
              const partyName = isDebit ? (v as DebitVoucher).supplierName : (v as CreditVoucher).customerName;
              
              return (
                <div key={v.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-slate-200 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] ${
                      isDebit ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {isDebit ? 'OUT' : 'IN'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-700 transition-colors">{partyName}</p>
                      <p className="text-[10px] font-bold text-slate-400 font-mono">{v.voucherNo} • {v.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className={`font-mono font-black text-xs ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDebit ? '-' : '+'}{formatIndianCurrency(v.amount)}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{v.approvalStatus}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onViewVoucher(v)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onPrintVoucher(v)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"><Printer className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center text-slate-400 text-xs font-medium">No recent activity recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

