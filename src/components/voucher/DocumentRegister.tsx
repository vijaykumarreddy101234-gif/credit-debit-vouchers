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
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  X
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

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
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print p-3.5 bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 z-50 relative">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-blue-200 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
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

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Invoice', 'Supporting Bill', 'Payment Proof', 'Photo'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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

          {/* Documents Table / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredDocs.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload PDF bills, invoice photos, or receipts when creating or editing Credit and Debit vouchers to populate the central document register.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Voucher No</th>
                      <th className="py-3 px-4">Account / Party</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredDocs.map((doc, idx) => (
                      <tr key={doc.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                          {doc.mimeType?.startsWith('image/') ? (
                            <Camera className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]" title={doc.name}>{doc.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                            {doc.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {doc.voucherNo}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {doc.voucherAccount}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                          ₹{doc.voucherAmount?.toLocaleString('en-IN') || 0}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {doc.voucherDate}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Preview Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadAttachment(doc)}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onViewVoucher(doc.voucher)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              View Voucher
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  {previewDoc.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Associated with Voucher <strong className="text-white">{previewDoc.voucherNo}</strong> • Size: {formatFileSize(previewDoc.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex items-center justify-center bg-slate-900/5">
              {previewDoc.mimeType?.startsWith('image/') && previewDoc.dataUrl ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[60vh] object-contain rounded-xl border border-slate-300 shadow-md bg-white p-2"
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{previewDoc.name}</h4>
                  <p className="text-xs text-slate-500">Electronic document securely stored in Raviraja ERP vault.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Type: <strong className="text-slate-700">{previewDoc.type}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadAttachment(previewDoc)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const v = previewDoc.voucher;
                    setPreviewDoc(null);
                    onViewVoucher(v);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                >
                  Open Voucher Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
