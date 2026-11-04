import React, { useState } from 'react';
import { Building2, Search, Plus, CheckCircle2, ArrowDownLeft, Shield } from 'lucide-react';
import { AccountHead } from '../../types/voucher';
import { voucherStorage } from '../../utils/voucherStorage';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';

interface ChartOfAccountsViewProps {
  onSelectForVoucher?: (account: AccountHead) => void;
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = () => {
  const [accounts, setAccounts] = useState<AccountHead[]>(() => voucherStorage.getAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.includes(searchTerm);
    const matchesGroup = groupFilter === 'All' || a.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Accounts & Finance</span>
            <span>/</span>
            <span className="font-semibold text-blue-700">Chart of Accounts</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            General Ledger Accounts & Chart of Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Master accounts mapped to IN Voucher entries, customer advances, and revenue heads.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Total Master Heads: <strong className="text-blue-700">{accounts.length}</strong>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search account name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
          />
        </div>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 font-medium"
        >
          <option value="All">All Groups</option>
          <option value="Direct Income">Direct Income</option>
          <option value="Indirect Income">Indirect Income</option>
          <option value="Sundry Debtors">Sundry Debtors</option>
          <option value="Current Assets">Current Assets</option>
          <option value="Advances">Advances</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-3.5 px-4 w-20">Code</th>
              <th className="py-3.5 px-4">Account Head Name</th>
              <th className="py-3.5 px-4">Ledger Group</th>
              <th className="py-3.5 px-4 text-right">Current Ledger Balance</th>
              <th className="py-3.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((acc) => (
              <tr key={acc.id} className="hover:bg-blue-50/30">
                <td className="py-3 px-4 font-mono font-bold text-slate-600">{acc.code}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{acc.name}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {acc.group}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                  {acc.balance ? formatIndianCurrency(acc.balance) : '₹ 0.00'}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
