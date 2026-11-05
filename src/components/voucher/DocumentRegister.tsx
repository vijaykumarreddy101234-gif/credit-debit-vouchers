import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Filter,
  Receipt,
  FilePlus,
  CreditCard,
  Camera,
  FolderOpen,
  ArrowUpRight
} from 'lucide-react';
import { InVoucher, VoucherAttachment, DocumentType } from '../../types/voucher';

interface DocumentRegisterProps {
  vouchers: InVoucher[];
  onViewVoucher: (voucher: InVoucher) => void;
}

interface FlattenedDoc extends VoucherAttachment {
  voucherNo: string;
  voucherDate: string;
  voucherAccount: string;
  voucherAmount: number;
  voucher: InVoucher;
}

export const DocumentRegister: React.FC<DocumentRegisterProps> = ({
  vouchers,
  onViewVoucher,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<FlattenedDoc | null>(null);

  // Extract all attachments from vouchers
  const allDocuments: FlattenedDoc[] = useMemo(() => {
    const list: FlattenedDoc[] = [];
    vouchers.forEach((v) => {
      if (v.attachments && v.attachments.length > 0) {
        v.attachments.forEach((att) => {
          list.push({
            ...att,
            voucherNo: v.voucherNo,
            voucherDate: v.date,
            voucherAccount: v.accountantName || '-',
            voucherAmount: v.amount,
            voucher: v,
          });
        });
      }
    });
    return list;
  }, [vouchers]);

  // Filter
  const filteredDocs = useMemo(() => {
    return allDocuments.filter((doc) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        doc.name.toLowerCase().includes(term) ||
        doc.voucherNo.toLowerCase().includes(term) ||
        doc.voucherAccount.toLowerCase().includes(term);

      const matchesCat = categoryFilter === 'All' || doc.type === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [allDocuments, searchTerm, categoryFilter]);

  const downloadAttachment = (doc: FlattenedDoc) => {
    if (!doc.dataUrl) {
      const blob = new Blob([`Document: ${doc.name}\nAssociated with Voucher ${doc.voucherNo}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Voucher Desk</span>
            <span>/</span>
            <span className="font-semibold text-purple-700">Document Register</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center text-sm font-black shadow-xs">
              <FolderOpen className="w-4 h-4" />
            </span>
            Central Document Register & Evidence Vault
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indexed archive of all uploaded bills, invoices, receipts, and photos across the CRM voucher system.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Total Indexed: <span className="text-purple-700 font-bold">{allDocuments.length} Documents</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by file name, voucher number, or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Invoice', 'Supporting Bill', 'Payment Proof', 'Photo'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-purple-700 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      doc.type === 'Invoice'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : doc.type === 'Supporting Bill'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : doc.type === 'Payment Proof'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {doc.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatFileSize(doc.size)}
                  </span>
                </div>

                <div className="flex items-start gap-3 mt-1">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                    {doc.dataUrl && doc.mimeType.startsWith('image/') ? (
                      <img src={doc.dataUrl} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                      {doc.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Voucher: <span className="font-mono font-bold text-blue-700">{doc.voucherNo}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="truncate">
                    Account: <strong className="text-slate-700">{doc.voucherAccount}</strong>
                  </div>
                  <div>
                    Date: <span className="text-slate-600">{doc.voucherDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onViewVoucher(doc.voucher)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Open Voucher
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(doc)}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No documents found</h4>
            <p className="text-xs text-slate-400 mt-1">Upload invoices or bills when creating IN vouchers.</p>
          </div>
        )}
      </div>

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 truncate">{previewDoc.name}</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex-1 flex items-center justify-center bg-slate-100 overflow-auto">
              {previewDoc.dataUrl && previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm bg-white p-2"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200">
                  <FileText className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">{previewDoc.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Associated Voucher: {previewDoc.voucherNo}</p>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(previewDoc)}
                    className="mt-3 px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
