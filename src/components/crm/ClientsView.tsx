import React, { useState } from 'react';
import { Users, Search, Building, Phone, Mail, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { InVoucher, CreditVoucher } from '../../types/voucher';
import { formatIndianCurrency } from '../../utils/numberToWordsIndian';

interface ClientsViewProps {
  inVouchers: InVoucher[];
  onOpenVoucher: (voucher: InVoucher) => void;
}

const CLIENTS_LIST = [
  {
    id: 'CL-01',
    name: 'Tata Projects Limited',
    city: 'Secunderabad, Telangana',
    gstin: '36AAACT2711C1Z0',
    contactPerson: 'Mr. Arvind Sharma (VP Procurement)',
    phone: '+91 40 6623 8800',
    category: 'Corporate Client',
  },
  {
    id: 'CL-02',
    name: 'Jindal Steel Works Ltd (JSW)',
    city: 'Bellary, Karnataka',
    gstin: '29AAACJ1209D1ZK',
    contactPerson: 'Mr. Pradeep Joshi (Accounts Head)',
    phone: '+91 8395 250120',
    category: 'Industrial Client',
  },
  {
    id: 'CL-03',
    name: 'Sri Balaji Metal Traders',
    city: 'Hyderabad, Telangana',
    gstin: '36AAGFS8821M1ZX',
    contactPerson: 'Mr. V. Balaji Reddy',
    phone: '+91 98490 12345',
    category: 'Scrap & Trade Buyer',
  },
  {
    id: 'CL-04',
    name: 'VRL Logistics Limited',
    city: 'Hubballi / Hyderabad',
    gstin: '29AABCV4981J1ZP',
    contactPerson: 'Mr. S. Kulkarni',
    phone: '+91 836 2237511',
    category: 'Tenant / Logistics Partner',
  },
  {
    id: 'CL-05',
    name: 'L&T Construction Heavy Civil Infra',
    city: 'Chennai & Hyderabad',
    gstin: '33AAACL0140P1ZR',
    contactPerson: 'Mr. M. Ramanathan',
    phone: '+91 44 2252 6000',
    category: 'EPC Contractor',
  },
];

export const ClientsView: React.FC<ClientsViewProps> = ({ inVouchers, onOpenVoucher }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = CLIENTS_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Sales & CRM</span>
            <span>/</span>
            <span className="font-semibold text-blue-700">Clients & Sundry Debtors</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Client & Customer Master Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified corporate payees and debtor parties associated with IN Voucher receipts.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search client by name, location, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          // Find vouchers from this client (only Credit vouchers should be linked here)
          const clientVouchers = inVouchers.filter((v) =>
            v.voucherType === 'IN(Credit)' && (v as CreditVoucher).customerName.toLowerCase().includes(client.name.toLowerCase().slice(0, 8))
          );
          const totalReceived = clientVouchers.reduce((acc, v) => acc + v.amount, 0);

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {client.category}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500">{client.id}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-1">{client.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{client.city}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">GSTIN:</span>
                    <span className="font-mono font-semibold text-slate-800">{client.gstin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact:</span>
                    <span className="font-medium text-slate-800">{client.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-700">{client.phone}</span>
                  </div>
                </div>

                {/* Total Received Badge */}
                <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-semibold">Total Inflow Received:</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {formatIndianCurrency(totalReceived)}
                  </span>
                </div>
              </div>

              {clientVouchers.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Linked IN Vouchers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {clientVouchers.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onOpenVoucher(v)}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-mono text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {v.voucherNo}
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
