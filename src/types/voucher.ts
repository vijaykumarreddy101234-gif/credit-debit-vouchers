export type PaymentMode = 'Cash' | 'Cheque' | 'DD' | 'Bank' | 'UPI';

export type VoucherStatus = 'Approved' | 'Pending Verification' | 'Draft';

export type UserRole = 'Admin' | 'Accounts Staff' | 'Authorized Accounts Manager';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  designation: string;
  department: string;
  avatar: string;
}

export type DocumentType = 'Invoice' | 'Supporting Bill' | 'Payment Proof' | 'Photo' | 'Other';

export interface VoucherAttachment {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  role: string;
  timestamp: string;
  details?: string;
}

export interface PaymentModeDetails {
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  transactionRef?: string;
  upiId?: string;
}

export type VoucherType = 'IN(Credit)' | 'OUT(Debit)' | 'IN' | 'OUT';

export function formatVoucherType(type?: string): 'IN(Credit)' | 'OUT(Debit)' {
  if (type === 'OUT' || type === 'OUT(Debit)') return 'OUT(Debit)';
  return 'IN(Credit)';
}

export interface InVoucher {
  id: string;
  voucherNo: string; // e.g., IN-0001 or OUT-0001
  voucherDate: string; // YYYY-MM-DD
  voucherType: VoucherType;
  
  // Section A: Voucher Details (User Custom Sketch: Date, Voucher Type, Voucher No, Person Name, Supplier GSTIN, Original Purchase Bill, Purchase Bill Date, Note Reason)
  accountId: string;
  accountName: string; // Accountant Name / Ledger Head
  personName?: string; // Person Name :-
  supplierGstin?: string; // Supplier GSTIN
  originalPurchaseBill?: string; // Original Purchase Bill
  purchaseBillDate?: string; // Purchase Bill Date
  referenceDate: string; // YYYY-MM-DD
  referenceDetails: string; // Invoice / Bill / Supporting Documents
  paymentParticulars?: string;
  noteReason: string;

  // Section B: Payment Details
  receivedFrom: string;
  paymentMode: PaymentMode;
  paymentModeDetails?: PaymentModeDetails;
  amount: number;
  amountInWords: string;
  particularsNotes: string;

  // Section C: Sign-Off Details
  preparedBy: string;
  passedBy: string;
  receiverSignature: string; // Data URL or text representation
  receiverSignatureType: 'draw' | 'upload' | 'digital';

  // Section D: Document Upload
  attachments: VoucherAttachment[];

  // Meta & Audit
  status: VoucherStatus;
  auditTrail: AuditEntry[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface OutVoucher {
  id: string;
  voucherNo: string; // OUT-0001
  voucherDate: string;
  voucherType: 'OUT';
  accountName: string;
  paidTo: string;
  paymentMode: PaymentMode;
  amount: number;
  amountInWords: string;
  particularsNotes: string;
  status: VoucherStatus;
  createdBy: string;
  createdAt: string;
}

export interface AccountHead {
  id: string;
  code: string;
  name: string;
  group: 'Direct Income' | 'Indirect Income' | 'Current Assets' | 'Sundry Debtors' | 'Advances';
  balance?: number;
}
