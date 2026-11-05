import { 
  CreditVoucher, 
  DebitVoucher, 
  AccountHead, 
  UserProfile, 
  UserRole, 
  VoucherAttachment,
  AuditEntry,
  VoucherStatus
} from '../types/voucher';

const STORAGE_KEY_CREDIT_VOUCHERS = 'raviraja_crm_credit_vouchers_v2';
const STORAGE_KEY_DEBIT_VOUCHERS = 'raviraja_crm_debit_vouchers_v2';
const STORAGE_KEY_ACCOUNTS = 'raviraja_crm_accounts_v1';
const STORAGE_KEY_SUPPLIERS = 'raviraja_crm_suppliers_v1';
const STORAGE_KEY_CUSTOMERS = 'raviraja_crm_customers_v1';
const STORAGE_KEY_CURRENT_USER = 'raviraja_crm_current_user_v1';

export const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  'Admin': {
    id: 'USR-001',
    name: 'Raviraja Reddy',
    role: 'Admin',
    designation: 'Managing Director & CEO',
    department: 'Executive Board',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  'Accounts Staff': {
    id: 'USR-002',
    name: 'Suresh Kumar',
    role: 'Accounts Staff',
    designation: 'Junior Accountant',
    department: 'Finance & Accounts',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  'Authorized Accounts Manager': {
    id: 'USR-003',
    name: 'Lakshmi Narayana',
    role: 'Authorized Accounts Manager',
    designation: 'Chief Accounts Officer & AGM Finance',
    department: 'Finance & Accounts',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
};

export const DEFAULT_SUPPLIERS = [
  'Steel Authority of India Ltd (SAIL)',
  'Jindal Steel Works (JSW)',
  'TATA Steel BSL',
  'Kirloskar Electric Co',
  'ABB India Limited',
  'Siemens Industrial',
  'L&T Construction Div',
  'BHEL Trichy Unit'
];

export const DEFAULT_CUSTOMERS = [
  'Tata Projects Limited',
  'Reliance Industries - Jamnagar',
  'Adani Power & Infra',
  'BHEL Hyderabad',
  'Megha Engineering (MEIL)',
  'GMR Hyderabad Airport',
  'Singareni Collieries (SCCL)',
  'Telangana State Genco'
];

export const DEFAULT_ACCOUNTS: AccountHead[] = [
  { id: 'ACC-101', code: '4001', name: 'Sales Income - Industrial Machinery', group: 'Direct Income', balance: 14250000 },
  { id: 'ACC-102', code: '4002', name: 'Sales Income - Fabricated Steel Components', group: 'Direct Income', balance: 9800000 },
  { id: 'ACC-103', code: '4003', name: 'Customer Advance - Tata Projects Ltd', group: 'Sundry Debtors', balance: 3500000 },
  { id: 'ACC-112', code: '4012', name: 'GST Input Credit Refund A/C', group: 'Current Assets', balance: 890000 },
];

const INITIAL_CREDIT_VOUCHERS: CreditVoucher[] = [
  {
    id: 'cv-uuid-001',
    voucherNo: 'IN-0001',
    date: '2026-11-01',
    voucherType: 'IN(Credit)',
    receiptMode: 'Bank',
    amount: 1550000,
    amountInWords: 'Fifteen Lakh Fifty Thousand Rupees Only',
    customerName: 'Tata Projects Limited',
    receiptType: 'Party Payment',
    description: 'Advance 30% against supply of heavy industrial gearboxes',
    invoiceNumber: 'TPL/HYD/PO/2026/8942',
    invoiceDate: '2026-10-31',
    approvedBy: 'Lakshmi Narayana',
    approvalStatus: 'Approved',
    receivedBy: 'Suresh Kumar',
    remarks: 'Received via RTGS into SBI CC A/c',
    attachments: [],
    auditTrail: [],
    createdBy: 'Suresh Kumar',
    createdAt: '2026-11-01T10:32:00Z',
    updatedBy: 'Suresh Kumar',
    updatedAt: '2026-11-01T10:32:00Z',
  }
];

const INITIAL_DEBIT_VOUCHERS: DebitVoucher[] = [
  {
    id: 'dv-uuid-001',
    voucherNo: 'OUT-0001',
    date: '2026-11-01',
    voucherType: 'OUT(Debit)',
    paymentMode: 'Bank',
    amount: 850000,
    amountInWords: 'Eight Lakh Fifty Thousand Rupees Only',
    supplierDetails: 'Supplier',
    supplierName: 'Steel Authority of India Ltd (SAIL)',
    description: 'Payment towards raw material coil allocation',
    invoiceNumber: 'SAIL/INV/2026/0491',
    invoiceDate: '2026-10-25',
    prepaidAmount: 200000,
    approvedBy: 'Lakshmi Narayana',
    approvalStatus: 'Approved',
    cashierName: 'Suresh Kumar',
    remarks: 'Approved per weekly procurement budget',
    attachments: [],
    auditTrail: [],
    createdBy: 'Suresh Kumar',
    createdAt: '2026-11-01T14:00:00Z',
    updatedBy: 'Suresh Kumar',
    updatedAt: '2026-11-01T14:00:00Z',
  }
];

// Memory fallbacks
let memoryCreditVouchers: CreditVoucher[] | null = null;
let memoryDebitVouchers: DebitVoucher[] | null = null;
let memorySuppliers: string[] | null = null;
let memoryCustomers: string[] | null = null;
let memoryAccounts: AccountHead[] | null = null;
let memoryUser: UserProfile | null = null;

export const voucherStorage = {
  getAccounts(): AccountHead[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    } catch {
      if (!memoryAccounts) memoryAccounts = [...DEFAULT_ACCOUNTS];
      return memoryAccounts;
    }
  },

  getSuppliers(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(DEFAULT_SUPPLIERS));
      return DEFAULT_SUPPLIERS;
    } catch {
      if (!memorySuppliers) memorySuppliers = [...DEFAULT_SUPPLIERS];
      return memorySuppliers;
    }
  },

  getCustomers(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
      return DEFAULT_CUSTOMERS;
    } catch {
      if (!memoryCustomers) memoryCustomers = [...DEFAULT_CUSTOMERS];
      return memoryCustomers;
    }
  },

  getCurrentUser(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (stored) return JSON.parse(stored);
      const defaultUser = DEFAULT_USERS['Admin'];
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(defaultUser));
      return defaultUser;
    } catch {
      if (!memoryUser) memoryUser = DEFAULT_USERS['Admin'];
      return memoryUser;
    }
  },

  setCurrentUser(role: UserRole): UserProfile {
    const user = DEFAULT_USERS[role];
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    } catch {
      memoryUser = user;
    }
    return user;
  },

  // CREDIT (IN) Vouchers
  getCreditVouchers(): CreditVoucher[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CREDIT_VOUCHERS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_CREDIT_VOUCHERS, JSON.stringify(INITIAL_CREDIT_VOUCHERS));
      return INITIAL_CREDIT_VOUCHERS;
    } catch {
      if (!memoryCreditVouchers) memoryCreditVouchers = [...INITIAL_CREDIT_VOUCHERS];
      return memoryCreditVouchers;
    }
  },

  getNextCreditVoucherNumber(): string {
    const vouchers = this.getCreditVouchers();
    let maxNum = 0;
    const prefix = 'IN-';
    vouchers.forEach((v) => {
      const numPart = parseInt(v.voucherNo.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    });
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  },

  saveCreditVoucher(data: Partial<CreditVoucher>): CreditVoucher {
    const vouchers = this.getCreditVouchers();
    const currentUser = this.getCurrentUser();
    const nowIso = new Date().toISOString();

    if (data.id) {
      const index = vouchers.findIndex(v => v.id === data.id);
      if (index === -1) throw new Error('Voucher not found');
      
      const existing = vouchers[index];
      const updated: CreditVoucher = {
        ...existing,
        ...data,
        updatedBy: currentUser.name,
        updatedAt: nowIso,
        auditTrail: [
          ...(existing.auditTrail || []),
          {
            id: `aud-${Date.now()}`,
            action: 'Voucher Updated',
            performedBy: currentUser.name,
            role: currentUser.role,
            timestamp: nowIso
          }
        ]
      } as CreditVoucher;
      vouchers[index] = updated;
      localStorage.setItem(STORAGE_KEY_CREDIT_VOUCHERS, JSON.stringify(vouchers));
      return updated;
    } else {
      const voucherNo = this.getNextCreditVoucherNumber();
      const newVoucher: CreditVoucher = {
        ...data,
        id: `cv-${Date.now()}`,
        voucherNo,
        voucherType: 'IN(Credit)',
        createdBy: currentUser.name,
        createdAt: nowIso,
        updatedBy: currentUser.name,
        updatedAt: nowIso,
        approvalStatus: data.approvalStatus || 'Pending',
        attachments: data.attachments || [],
        auditTrail: [{
          id: `aud-${Date.now()}`,
          action: 'Voucher Created',
          performedBy: currentUser.name,
          role: currentUser.role,
          timestamp: nowIso
        }]
      } as CreditVoucher;
      const updated = [newVoucher, ...vouchers];
      localStorage.setItem(STORAGE_KEY_CREDIT_VOUCHERS, JSON.stringify(updated));
      return newVoucher;
    }
  },

  deleteCreditVoucher(id: string, user: UserProfile): void {
    if (user.role !== 'Admin') throw new Error('Unauthorized');
    const vouchers = this.getCreditVouchers();
    const filtered = vouchers.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY_CREDIT_VOUCHERS, JSON.stringify(filtered));
  },

  // DEBIT (OUT) Vouchers
  getDebitVouchers(): DebitVoucher[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEBIT_VOUCHERS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_DEBIT_VOUCHERS, JSON.stringify(INITIAL_DEBIT_VOUCHERS));
      return INITIAL_DEBIT_VOUCHERS;
    } catch {
      if (!memoryDebitVouchers) memoryDebitVouchers = [...INITIAL_DEBIT_VOUCHERS];
      return memoryDebitVouchers;
    }
  },

  getNextDebitVoucherNumber(): string {
    const vouchers = this.getDebitVouchers();
    let maxNum = 0;
    const prefix = 'OUT-';
    vouchers.forEach((v) => {
      const numPart = parseInt(v.voucherNo.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    });
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  },

  saveDebitVoucher(data: Partial<DebitVoucher>): DebitVoucher {
    const vouchers = this.getDebitVouchers();
    const currentUser = this.getCurrentUser();
    const nowIso = new Date().toISOString();

    if (data.id) {
      const index = vouchers.findIndex(v => v.id === data.id);
      if (index === -1) throw new Error('Voucher not found');
      
      const existing = vouchers[index];
      const updated: DebitVoucher = {
        ...existing,
        ...data,
        updatedBy: currentUser.name,
        updatedAt: nowIso,
        auditTrail: [
          ...(existing.auditTrail || []),
          {
            id: `aud-${Date.now()}`,
            action: 'Voucher Updated',
            performedBy: currentUser.name,
            role: currentUser.role,
            timestamp: nowIso
          }
        ]
      } as DebitVoucher;
      vouchers[index] = updated;
      localStorage.setItem(STORAGE_KEY_DEBIT_VOUCHERS, JSON.stringify(vouchers));
      return updated;
    } else {
      const voucherNo = this.getNextDebitVoucherNumber();
      const newVoucher: DebitVoucher = {
        ...data,
        id: `dv-${Date.now()}`,
        voucherNo,
        voucherType: 'OUT(Debit)',
        createdBy: currentUser.name,
        createdAt: nowIso,
        updatedBy: currentUser.name,
        updatedAt: nowIso,
        approvalStatus: data.approvalStatus || 'Pending',
        attachments: data.attachments || [],
        auditTrail: [{
          id: `aud-${Date.now()}`,
          action: 'Voucher Created',
          performedBy: currentUser.name,
          role: currentUser.role,
          timestamp: nowIso
        }]
      } as DebitVoucher;
      const updated = [newVoucher, ...vouchers];
      localStorage.setItem(STORAGE_KEY_DEBIT_VOUCHERS, JSON.stringify(updated));
      return newVoucher;
    }
  },

  deleteDebitVoucher(id: string, user: UserProfile): void {
    if (user.role !== 'Admin') throw new Error('Unauthorized');
    const vouchers = this.getDebitVouchers();
    const filtered = vouchers.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY_DEBIT_VOUCHERS, JSON.stringify(filtered));
  },

  resetToDefaultData(): void {
    localStorage.clear();
    this.getCreditVouchers();
    this.getDebitVouchers();
    this.getAccounts();
    this.getSuppliers();
    this.getCustomers();
    this.getCurrentUser();
  }
};

