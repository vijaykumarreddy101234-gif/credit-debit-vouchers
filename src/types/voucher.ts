export type PaymentMode = 'Cash' | 'Bank' | 'Cheque' | 'UPI' | 'Other';
export type ReceiptMode = 'Cash' | 'Bank' | 'Cheque' | 'UPI' | 'Other';

export type VoucherStatus = 'Approved' | 'Pending' | 'Rejected' | 'Draft';

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

export type VoucherType = 'IN(Credit)' | 'OUT(Debit)';

export function formatVoucherType(type?: string): VoucherType {
  if (type === 'OUT' || type === 'OUT(Debit)' || type === 'Debit') return 'OUT(Debit)';
  return 'IN(Credit)';
}

// Unified interface for shared logic, but with optional fields for both
export interface BaseVoucher {
  id: string;
  voucherNo: string;
  date: string;
  amount: number;
  amountInWords: string;
  description: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  approvedBy?: string;
  approvalStatus: VoucherStatus;
  remarks?: string;
  attachments: VoucherAttachment[];
  auditTrail: AuditEntry[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  
  // New Fields from Sketch/Requirements
  accountantName?: string;
  personName?: string;
  referenceDate?: string;
  referenceDetails?: string;
  paymentParticulars?: string;
  noteReason?: string;
}

export interface DebitVoucher extends BaseVoucher {
  voucherType: 'OUT(Debit)';
  paymentMode: PaymentMode;
  supplierDetails: 'Supplier' | 'Employee' | 'Labour Advance' | 'Other';
  supplierName: string;
  supplierGstin?: string;
  originalPurchaseBill?: string;
  purchaseBillDate?: string;
  prepaidAmount?: number;
  cashierName?: string;
}

export interface CreditVoucher extends BaseVoucher {
  voucherType: 'IN(Credit)';
  receiptMode: ReceiptMode;
  customerName: string;
  receiptType: 'Sales' | 'Party Payment' | 'Other';
  receivedBy?: string;
  customerGstin?: string;
}

// Maintain compatibility with existing code during transition
export type InVoucher = CreditVoucher | DebitVoucher;

export interface AccountHead {
  id: string;
  code: string;
  name: string;
  group: 'Direct Income' | 'Indirect Income' | 'Current Assets' | 'Sundry Debtors' | 'Advances';
  balance?: number;
}

