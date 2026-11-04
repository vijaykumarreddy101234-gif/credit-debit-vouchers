import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  FolderOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Users,
  Briefcase,
  Layers,
  Settings,
  ShieldCheck,
  ChevronRight,
  Building2,
  PieChart
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'in-entry'
  | 'in-register'
  | 'out-entry'
  | 'out-register'
  | 'docs'
  | 'accounts'
  | 'crm-leads';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  inCount: number;
  outCount: number;
  docsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  inCount,
  outCount,
  docsCount,
}) => {
  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-y-auto select-none">
      
      {/* Voucher Desk Submenu Section */}
      <div className="p-4 flex-1 space-y-6">
        
        {/* Module Header */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Voucher Desk</span>
            <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-mono">
              ACTIVE
            </span>
          </div>

          <nav className="space-y-1">
            {/* 1. Dashboard */}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* 2. Voucher Entry (IN / OUT) */}
            <button
              type="button"
              onClick={() => onSelectTab('in-entry')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'in-entry'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                  ±
                </div>
                <span>Voucher Entry (IN / OUT)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                + New
              </span>
            </button>

            {/* 3. IN Voucher Register */}
            <button
              type="button"
              onClick={() => onSelectTab('in-register')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'in-register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>IN Voucher Register</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {inCount}
              </span>
            </button>

            {/* 4. OUT Voucher Register */}
            <button
              type="button"
              onClick={() => onSelectTab('out-register')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'out-register'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-rose-400" />
                <span>OUT Voucher Register</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {outCount}
              </span>
            </button>

            {/* Divider */}
            <div className="pt-2 pb-1 px-3">
              <div className="border-t border-slate-800" />
            </div>

            {/* 6. Document Register */}
            <button
              type="button"
              onClick={() => onSelectTab('docs')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'docs'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>Document Register</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {docsCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Existing CRM Modules (Preserved & Visible) */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Raviraja Enterprise Modules
          </div>

          <nav className="space-y-1 text-xs">
            <button
              type="button"
              onClick={() => onSelectTab('accounts')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                activeTab === 'accounts'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Chart of Accounts</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('crm-leads')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                activeTab === 'crm-leads'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Clients & Debtors</span>
              </div>
              <span className="text-[10px] text-slate-500">Party Desk</span>
            </button>
          </nav>
        </div>

      </div>

      {/* Corporate Compliance Stamp at Bottom */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Statutory Audited</span>
        </div>
        <p className="text-[10px] text-slate-400">
          GST / TDS compliant voucher desk. ISO 9001:2015 certified company.
        </p>
      </div>

    </aside>
  );
};
