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
  PlusCircle,
  Briefcase,
  Layers,
  Settings,
  ShieldCheck,
  ChevronRight,
  Building2,
  PieChart,
  UserCog
} from 'lucide-react';
import { PermissionKey } from '../../utils/accessControl';

export type ActiveTab =
  | 'dashboard'
  | 'credit-entry'
  | 'credit-register'
  | 'debit-entry'
  | 'debit-register'
  | 'docs'
  | 'crm-leads'
  | 'pdf-editor'
  | 'roles';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  inCount: number;
  outCount: number;
  docsCount: number;
  isOpen?: boolean;
  onClose?: () => void;
  can?: (p: PermissionKey) => boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  inCount,
  outCount,
  docsCount,
  isOpen = false,
  onClose,
  can = () => true,
}) => {
  const handleItemClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-y-auto select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Button Header */}
        <div className="lg:hidden p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span className="sr-only">Close sidebar</span>
            ✕
          </button>
        </div>
      
      {/* 1. DASHBOARD */}
      <div className="p-4 border-b border-slate-800/50">
        {can('dashboard.view') && (
<button
          type="button"
          onClick={() => handleItemClick('dashboard')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>General Dashboard</span>
        </button>
)}
      </div>

      {/* 2. IN VOUCHER DESK (CREDIT) */}
      <div className="p-4 space-y-2">
        <div className="px-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-between opacity-80">
          <span>Credit Desk (IN)</span>
          <ArrowDownLeft className="w-3 h-3" />
        </div>
        <nav className="space-y-1">
          {can('in.create') && (
<button
            type="button"
            onClick={() => handleItemClick('credit-entry')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'credit-entry'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-4 h-4" />
              <span>Credit Entry</span>
            </div>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-bold uppercase">New</span>
          </button>
)}
          {can('in.view') && (
<button
            type="button"
            onClick={() => handleItemClick('credit-register')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'credit-register'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>IN Register</span>
            </div>
            <span className="text-[10px] font-bold opacity-60 font-mono">{inCount}</span>
          </button>
)}
        </nav>
      </div>

      {/* 3. OUT VOUCHER DESK (DEBIT) */}
      <div className="p-4 space-y-2">
        <div className="px-3 text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center justify-between opacity-80">
          <span>Debit Desk (OUT)</span>
          <ArrowUpRight className="w-3 h-3" />
        </div>
        <nav className="space-y-1">
          {can('out.create') && (
<button
            type="button"
            onClick={() => handleItemClick('debit-entry')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'debit-entry'
                ? 'bg-rose-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-4 h-4" />
              <span>Debit Entry</span>
            </div>
            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.5 rounded font-bold uppercase">New</span>
          </button>
)}
          {can('out.view') && (
<button
            type="button"
            onClick={() => handleItemClick('debit-register')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'debit-register'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>OUT Register</span>
            </div>
            <span className="text-[10px] font-bold opacity-60 font-mono">{outCount}</span>
          </button>
)}
        </nav>
      </div>

      {/* 4. OTHER MODULES */}
      <div className="p-4 flex-1 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Enterprise Assets
          </div>
          <nav className="space-y-1">
            {can('pdf.studio') && (
<button
              type="button"
              onClick={() => handleItemClick('pdf-editor')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'pdf-editor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PieChart className="w-4 h-4 text-blue-400" />
                <span>PDF Studio</span>
              </div>
              <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase">Live</span>
            </button>
)}
            {can('docs.view') && (
<button
              type="button"
              onClick={() => handleItemClick('docs')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'docs'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>Document Center</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">{docsCount}</span>
            </button>
)}
          </nav>
        </div>
      </div>

      {can('roles.manage') && (
        <div className="px-4 pb-4">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Administration</div>
          <button
            type="button"
            onClick={() => handleItemClick('roles')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserCog className="w-4 h-4 text-indigo-400" />
              <span>Roles & Access</span>
            </div>
            <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>
          </button>
        </div>
      )}

      {/* Compliance Stamp */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Statutory Audited</span>
        </div>
        <p className="text-[10px] leading-relaxed">
          GST Compliant ERP Module. Raviraja Industries Pvt Ltd.
        </p>
      </div>
    </aside>
    </>
  );
};
