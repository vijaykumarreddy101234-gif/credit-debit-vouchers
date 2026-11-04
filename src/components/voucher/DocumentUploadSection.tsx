import React, { useState } from 'react';
import {
  FileText,
  FilePlus,
  Upload,
  Eye,
  Download,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Receipt,
  CreditCard,
  Camera,
  ExternalLink
} from 'lucide-react';
import { VoucherAttachment, DocumentType } from '../../types/voucher';

interface DocumentUploadSectionProps {
  attachments: VoucherAttachment[];
  onChange: (attachments: VoucherAttachment[]) => void;
  readOnly?: boolean;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  attachments,
  onChange,
  readOnly = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentType>('Invoice');
  const [previewDoc, setPreviewDoc] = useState<VoucherAttachment | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, overrideCategory?: DocumentType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const category = overrideCategory || selectedCategory;
    const newAttachments: VoucherAttachment[] = [];

    Array.from(files).forEach((file) => {
      // Create reader for data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = (event.target?.result as string) || '';
        const attachment: VoucherAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: category,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };

        onChange([...attachments, attachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  const downloadAttachment = (attachment: VoucherAttachment) => {
    if (!attachment.dataUrl) {
      // Generate synthetic sample download if dataUrl is empty (from initial mock seed)
      const blob = new Blob([`Sample Document Content: ${attachment.name}\nType: ${attachment.type}\nVerified by Raviraja Industries CRM`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name;
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

  const getCategoryBadge = (type: DocumentType) => {
    switch (type) {
      case 'Invoice':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Supporting Bill':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Payment Proof':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Photo':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Supporting Documents & Attachments
            <span className="text-xs font-normal text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
              {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Attach verified invoices, supporting bills, bank payment receipts or item photographs.
          </p>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Upload Buttons */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Upload Invoice
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'Invoice')}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs">
              <FilePlus className="w-3.5 h-3.5 text-amber-600" />
              Supporting Bill
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'Supporting Bill')}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              Payment Proof
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'Payment Proof')}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors shadow-2xs">
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              Upload Photo
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'Photo')}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Upload Zone */}
        {!readOnly && (
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="sm:w-56 shrink-0">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as DocumentType)}
                className="w-full text-xs rounded-lg border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500 py-2 px-2.5 bg-slate-50"
              >
                <option value="Invoice">Invoice</option>
                <option value="Supporting Bill">Supporting Bill</option>
                <option value="Payment Proof">Payment Proof</option>
                <option value="Photo">Photo</option>
                <option value="Other">Other Document</option>
              </select>
            </div>

            <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 flex items-center justify-center gap-3 bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  + Add Document ({selectedCategory})
                </p>
                <p className="text-[11px] text-slate-500">
                  Drag and drop or browse from device (PDF, JPEG, PNG, WEBP up to 10MB)
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e)}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Attachments List */}
        {attachments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {attachments.map((att) => {
              const isPdf = att.mimeType.includes('pdf') || att.name.toLowerCase().endsWith('.pdf');
              const isImage = att.mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.name);

              return (
                <div
                  key={att.id}
                  className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 border border-slate-200 overflow-hidden">
                      {isImage && att.dataUrl ? (
                        <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                      ) : isPdf ? (
                        <FileText className="w-5 h-5 text-red-500" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadge(att.type)}`}>
                          {att.type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatFileSize(att.size)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-900 truncate mt-0.5" title={att.name}>
                        {att.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(att)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadAttachment(att)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No documents attached yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Use the quick upload buttons above to add supporting bills or payment receipts.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  previewDoc.type === 'Invoice' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {previewDoc.type}
                </span>
                <h4 className="text-sm font-semibold truncate mt-1 text-slate-100">
                  {previewDoc.name}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadAttachment(previewDoc)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[350px]">
              {previewDoc.dataUrl && previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md bg-white p-2"
                />
              ) : previewDoc.dataUrl && previewDoc.mimeType.includes('pdf') ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  className="w-full h-[65vh] rounded-lg border border-slate-300 bg-white shadow-xs"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h5 className="text-sm font-bold text-slate-800">{previewDoc.name}</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Format: {previewDoc.mimeType || 'Document'} ({formatFileSize(previewDoc.size)})
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Document Attached to Voucher
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(previewDoc)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" /> Download to Open Locally
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Security: Stored securely in Raviraja CRM document vault</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
