import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  FileText,
  Printer,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  IndianRupee,
  Layers
} from 'lucide-react';
import { InVoucher, OutVoucher } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';

interface VoucherDashboardProps {
  inVouchers: InVoucher[];
  outVouchers: OutVoucher[];
  onNavigate: (tab: 'in-entry' | 'in-register' | 'out-entry' | 'out-register' | 'docs') => void;
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

  // Breakdown by mode
  const inModes = inVouchers.reduce((acc: Record<string, number>, v) => {
    acc[v.paymentMode] = (acc[v.paymentMode] || 0) + v.amount;
    return acc;
  }, {});

  const recentInVouchers = inVouchers.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Raviraja Industries • Financial Voucher Desk
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Voucher Desk Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time receipt & disbursement ledger overview with verified bank settlements and vouchers sequence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('in-entry')}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs flex items-center gap-1.5 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            + New IN Voucher Entry
          </button>
          <button
            type="button"
            onClick={() => onNavigate('in-register')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            View IN Register
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total IN Inflow */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Total IN Receipts (Inflow)
              </span>
              <span className="p-2 bg-emerald-400/30 rounded-xl">
                <ArrowDownLeft className="w-5 h-5 text-white" />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-black mt-3">
              {formatIndianCurrency(totalInflow)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-100">
              <span className="font-semibold bg-emerald-800/40 px-2 py-0.5 rounded-full">
                {inVouchers.length} Total IN Vouchers
              </span>
              <span>Sequence IN-0001+</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        </div>

        {/* Total OUT Outflow */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
                Total OUT Payments (Outflow)
              </span>
              <span className="p-2 bg-rose-400/30 rounded-xl">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-black mt-3">
              {formatIndianCurrency(totalOutflow)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-rose-100">
              <span className="font-semibold bg-rose-800/40 px-2 py-0.5 rounded-full">
                {outVouchers.length} OUT Vouchers
              </span>
              <span>Separate Module</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        </div>

        {/* Net Cash Flow Position */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Net Voucher Liquidity Position
              </span>
              <span className="p-2 bg-blue-500/30 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-black mt-3 text-emerald-300">
              {formatIndianCurrency(netInflow)}
            </h2>
            <p className="text-xs text-blue-200/80 mt-2">
              Net balance surplus verified across bank accounts & safe deposits.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-600/10 rounded-full blur-xl" />
        </div>
      </div>

      {/* Two Column Grid: Payment Mode Breakdown & Recent IN Vouchers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: IN Vouchers Mode Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              IN Receipts by Payment Channel
            </h3>
            <span className="text-xs text-slate-400">Total Distribution</span>
          </div>

          <div className="space-y-3">
            {Object.entries(inModes).map(([mode, amt]) => {
              const pct = totalInflow > 0 ? Math.round((amt / totalInflow) * 100) : 0;
              return (
                <div key={mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {mode}
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {formatIndianCurrency(amt)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Document Vault:</span>
            <button
              type="button"
              onClick={() => onNavigate('docs')}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              Open Document Register
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Recent IN Vouchers */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Recent IN Vouchers (Receipts)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Latest voucher entries with automated numbering
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('in-register')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentInVouchers.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/70 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 shrink-0">
                      {v.voucherNo}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate" title={v.receivedFrom}>
                        {v.receivedFrom}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {v.accountName} • {v.voucherDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 block">
                        {formatIndianCurrency(v.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        via {v.paymentMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewVoucher(v)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-colors"
                        title="View Details"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintVoucher(v)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-md transition-colors"
                        title="Print A4 Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
            <span>Sequencing: Continuous database sequence protected</span>
            <button
              type="button"
              onClick={() => onNavigate('in-entry')}
              className="font-bold text-emerald-700 hover:underline"
            >
              + Create IN-000{inVouchers.length + 1} Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
