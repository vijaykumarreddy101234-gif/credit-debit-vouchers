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
const STORAGE_KEY_PDF_BRANDING = 'raviraja_crm_pdf_branding_v1';

export interface PdfBrandingSettings {
  companyName: string;
  companySubtitle: string;
  companyAddress: string;
  cin: string;
  gstin: string;
  pan: string;
  leftLogoText: string;
  leftLogoImage?: string;
  leftLogoSize: 'small' | 'medium' | 'large';
  leftLogoWidth: number;
  leftLogoHeight: number;
  leftLogoOffsetX: number;
  leftLogoOffsetY: number;
  rightSealTitle: string;
  rightLogoImage?: string;
  rightLogoSize: 'small' | 'medium' | 'large';
  rightLogoWidth: number;
  rightLogoHeight: number;
  rightLogoOffsetX: number;
  rightLogoOffsetY: number;
  headerTheme: 'navy' | 'slate' | 'emerald' | 'dark';
  terms: string[];
  footerText: string;
}

export const DEFAULT_PDF_BRANDING: PdfBrandingSettings = {
  companyName: 'RAVIRAJA INDUSTRIES PRIVATE LIMITED',
  companySubtitle: 'Manufacturers & Suppliers of Heavy Engineering & Industrial Equipment',
  companyAddress: 'Plot No. 44 & 45, Phase III, IDA Jeedimetla, Hyderabad - 500055, Telangana, India',
  cin: 'U28112TG2015PTC099412',
  gstin: '36AABCR1234F1Z8',
  pan: 'AABCR1234F',
  leftLogoText: 'RIL',
  leftLogoImage: '',
  leftLogoSize: 'medium',
  leftLogoWidth: 20,
  leftLogoHeight: 24,
  leftLogoOffsetX: 0,
  leftLogoOffsetY: 0,
  rightSealTitle: 'ERP VERIFIED',
  rightLogoImage: '',
  rightLogoSize: 'medium',
  rightLogoWidth: 32,
  rightLogoHeight: 24,
  rightLogoOffsetX: 0,
  rightLogoOffsetY: 0,
  headerTheme: 'navy',
  terms: [
    '1. Subject to Hyderabad jurisdiction.',
    '2. Payment acknowledged subject to realization of cheque / RTGS.',
    '3. This voucher is an authentic ERP instrument valid with authorised managerial signature and stamp.'
  ],
  footerText: 'Raviraja CRM Accounts Desk • Authenticated Voucher ID'
};

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

export const DEFAULT_CASHIERS = [
  'Suresh Kumar',
  'Lakshmi Narayana',
  'Raviraja Reddy',
  'M. Venkat Rao',
  'K. Srinivasa Prasad'
];

export const DEFAULT_RECEIVERS = [
  'Suresh Kumar',
  'Lakshmi Narayana',
  'Raviraja Reddy',
  'P. Ramana Reddy',
  'V. Anjaneyulu'
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

const STORAGE_KEY_MAIN_ACCOUNTS = 'raviraja_crm_main_accounts_v1';
const STORAGE_KEY_SUB_ACCOUNTS = 'raviraja_crm_sub_accounts_v1';
const STORAGE_KEY_CASHIERS = 'raviraja_crm_cashiers_v1';
const STORAGE_KEY_RECEIVERS = 'raviraja_crm_receivers_v1';

export const DEFAULT_MAIN_ACCOUNTS = [
  'Company Office',
  'Factory Jeedimetla Unit',
  'Corporate Branch Office',
  'Petty Cash A/c',
  'SBI Current A/c',
  'HDFC Operations A/c'
];

export const DEFAULT_SUB_ACCOUNTS = ['Expenses', 'Purchase', 'Transport', 'Market', 'Labour', 'Bills', 'Others'];
let memorySubAccounts: string[] | null = null;
let memoryMainAccounts: string[] | null = null;
let memoryCashiers: string[] | null = null;
let memoryReceivers: string[] | null = null;

export const voucherStorage = {
  getSubAccounts(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUB_ACCOUNTS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_SUB_ACCOUNTS, JSON.stringify(DEFAULT_SUB_ACCOUNTS));
      return [...DEFAULT_SUB_ACCOUNTS];
    } catch {
      if (!memorySubAccounts) memorySubAccounts = [...DEFAULT_SUB_ACCOUNTS];
      return memorySubAccounts;
    }
  },
  saveSubAccounts(list: string[]): string[] {
    try { localStorage.setItem(STORAGE_KEY_SUB_ACCOUNTS, JSON.stringify(list)); } catch {}
    memorySubAccounts = list;
    return list;
  },
  addSubAccount(name: string): string[] {
    const list = this.getSubAccounts();
    const v = name.trim();
    return v && !list.includes(v) ? this.saveSubAccounts([...list, v]) : list;
  },
  updateSubAccount(oldName: string, newName: string): string[] {
    return this.saveSubAccounts(this.getSubAccounts().map((i) => (i === oldName ? newName.trim() : i)));
  },
  deleteSubAccount(name: string): string[] {
    return this.saveSubAccounts(this.getSubAccounts().filter((i) => i !== name));
  },

  getMainAccounts(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MAIN_ACCOUNTS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_MAIN_ACCOUNTS, JSON.stringify(DEFAULT_MAIN_ACCOUNTS));
      return DEFAULT_MAIN_ACCOUNTS;
    } catch {
      if (!memoryMainAccounts) memoryMainAccounts = [...DEFAULT_MAIN_ACCOUNTS];
      return memoryMainAccounts;
    }
  },

  addMainAccount(name: string): string[] {
    const list = this.getMainAccounts();
    if (!list.includes(name.trim())) {
      const updated = [...list, name.trim()];
      try { localStorage.setItem(STORAGE_KEY_MAIN_ACCOUNTS, JSON.stringify(updated)); } catch {}
      memoryMainAccounts = updated;
      return updated;
    }
    return list;
  },

  updateMainAccount(oldName: string, newName: string): string[] {
    const list = this.getMainAccounts();
    const updated = list.map(item => item === oldName ? newName.trim() : item);
    try { localStorage.setItem(STORAGE_KEY_MAIN_ACCOUNTS, JSON.stringify(updated)); } catch {}
    memoryMainAccounts = updated;
    return updated;
  },

  deleteMainAccount(name: string): string[] {
    const list = this.getMainAccounts();
    const updated = list.filter(item => item !== name);
    try { localStorage.setItem(STORAGE_KEY_MAIN_ACCOUNTS, JSON.stringify(updated)); } catch {}
    memoryMainAccounts = updated;
    return updated;
  },

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

  addSupplier(name: string): string[] {
    const list = this.getSuppliers();
    if (!list.includes(name.trim())) {
      const updated = [name.trim(), ...list];
      try { localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(updated)); } catch {}
      memorySuppliers = updated;
      return updated;
    }
    return list;
  },

  updateSupplier(oldName: string, newName: string): string[] {
    const list = this.getSuppliers();
    const updated = list.map(item => item === oldName ? newName.trim() : item);
    try { localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(updated)); } catch {}
    memorySuppliers = updated;
    return updated;
  },

  deleteSupplier(name: string): string[] {
    const list = this.getSuppliers();
    const updated = list.filter(item => item !== name);
    try { localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(updated)); } catch {}
    memorySuppliers = updated;
    return updated;
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

  addCustomer(name: string): string[] {
    const list = this.getCustomers();
    if (!list.includes(name.trim())) {
      const updated = [name.trim(), ...list];
      try { localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(updated)); } catch {}
      memoryCustomers = updated;
      return updated;
    }
    return list;
  },

  updateCustomer(oldName: string, newName: string): string[] {
    const list = this.getCustomers();
    const updated = list.map(item => item === oldName ? newName.trim() : item);
    try { localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(updated)); } catch {}
    memoryCustomers = updated;
    return updated;
  },

  deleteCustomer(name: string): string[] {
    const list = this.getCustomers();
    const updated = list.filter(item => item !== name);
    try { localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(updated)); } catch {}
    memoryCustomers = updated;
    return updated;
  },

  getCashiers(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CASHIERS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_CASHIERS, JSON.stringify(DEFAULT_CASHIERS));
      return DEFAULT_CASHIERS;
    } catch {
      if (!memoryCashiers) memoryCashiers = [...DEFAULT_CASHIERS];
      return memoryCashiers;
    }
  },

  addCashier(name: string): string[] {
    const list = this.getCashiers();
    if (!list.includes(name.trim())) {
      const updated = [name.trim(), ...list];
      try { localStorage.setItem(STORAGE_KEY_CASHIERS, JSON.stringify(updated)); } catch {}
      memoryCashiers = updated;
      return updated;
    }
    return list;
  },

  updateCashier(oldName: string, newName: string): string[] {
    const list = this.getCashiers();
    const updated = list.map(item => item === oldName ? newName.trim() : item);
    try { localStorage.setItem(STORAGE_KEY_CASHIERS, JSON.stringify(updated)); } catch {}
    memoryCashiers = updated;
    return updated;
  },

  deleteCashier(name: string): string[] {
    const list = this.getCashiers();
    const updated = list.filter(item => item !== name);
    try { localStorage.setItem(STORAGE_KEY_CASHIERS, JSON.stringify(updated)); } catch {}
    memoryCashiers = updated;
    return updated;
  },

  getReceivers(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECEIVERS);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY_RECEIVERS, JSON.stringify(DEFAULT_RECEIVERS));
      return DEFAULT_RECEIVERS;
    } catch {
      if (!memoryReceivers) memoryReceivers = [...DEFAULT_RECEIVERS];
      return memoryReceivers;
    }
  },

  addReceiver(name: string): string[] {
    const list = this.getReceivers();
    if (!list.includes(name.trim())) {
      const updated = [name.trim(), ...list];
      try { localStorage.setItem(STORAGE_KEY_RECEIVERS, JSON.stringify(updated)); } catch {}
      memoryReceivers = updated;
      return updated;
    }
    return list;
  },

  updateReceiver(oldName: string, newName: string): string[] {
    const list = this.getReceivers();
    const updated = list.map(item => item === oldName ? newName.trim() : item);
    try { localStorage.setItem(STORAGE_KEY_RECEIVERS, JSON.stringify(updated)); } catch {}
    memoryReceivers = updated;
    return updated;
  },

  deleteReceiver(name: string): string[] {
    const list = this.getReceivers();
    const updated = list.filter(item => item !== name);
    try { localStorage.setItem(STORAGE_KEY_RECEIVERS, JSON.stringify(updated)); } catch {}
    memoryReceivers = updated;
    return updated;
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
    vouchers.forEach((v) => {
      const match = v.voucherNo.match(/^(?:CV|IN)-(\d+)$/i);
      if (match) {
        const numPart = parseInt(match[1], 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });
    return `CV-${String(maxNum + 1).padStart(4, '0')}`;
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
      try { localStorage.setItem(STORAGE_KEY_CREDIT_VOUCHERS, JSON.stringify(vouchers)); } catch {}
      memoryCreditVouchers = vouchers;
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
      try { localStorage.setItem(STORAGE_KEY_CREDIT_VOUCHERS, JSON.stringify(updated)); } catch {}
      memoryCreditVouchers = updated;
      return newVoucher;
    }
  },

  deleteCreditVoucher(id: string, _user?: UserProfile): void {
    const vouchers = this.getCreditVouchers();
    const filtered = vouchers.filter(v => v.id !== id);
    try { localStorage.setItem(STORAGE_KEY_CREDIT_VOUCHERS, JSON.stringify(filtered)); } catch {}
    memoryCreditVouchers = filtered;
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
    vouchers.forEach((v) => {
      const match = v.voucherNo.match(/^(?:DV|OUT)-(\d+)$/i);
      if (match) {
        const numPart = parseInt(match[1], 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });
    return `DV-${String(maxNum + 1).padStart(4, '0')}`;
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
      try { localStorage.setItem(STORAGE_KEY_DEBIT_VOUCHERS, JSON.stringify(vouchers)); } catch {}
      memoryDebitVouchers = vouchers;
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
      try { localStorage.setItem(STORAGE_KEY_DEBIT_VOUCHERS, JSON.stringify(updated)); } catch {}
      memoryDebitVouchers = updated;
      return newVoucher;
    }
  },

  deleteDebitVoucher(id: string, _user?: UserProfile): void {
    const vouchers = this.getDebitVouchers();
    const filtered = vouchers.filter(v => v.id !== id);
    try { localStorage.setItem(STORAGE_KEY_DEBIT_VOUCHERS, JSON.stringify(filtered)); } catch {}
    memoryDebitVouchers = filtered;
  },

  isDuplicateVoucherNo(voucherNo: string, currentId?: string, type: 'IN(Credit)' | 'OUT(Debit)' = 'OUT(Debit)'): boolean {
    const list = type === 'OUT(Debit)' ? this.getDebitVouchers() : this.getCreditVouchers();
    return list.some(v => v.voucherNo.trim().toUpperCase() === voucherNo.trim().toUpperCase() && v.id !== currentId);
  },

  getFinancialSummary() {
    const credits = this.getCreditVouchers();
    const debits = this.getDebitVouchers();
    const totalCredit = credits.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const totalDebit = debits.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const approvedCredit = credits.filter(v => v.approvalStatus === 'Approved').reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const approvedDebit = debits.filter(v => v.approvalStatus === 'Approved').reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const netBalance = totalCredit - totalDebit;
    const approvedNetBalance = approvedCredit - approvedDebit;
    return {
      totalCredit,
      totalDebit,
      netBalance,
      approvedCredit,
      approvedDebit,
      approvedNetBalance,
      creditCount: credits.length,
      debitCount: debits.length,
      pendingCount: credits.filter(v => v.approvalStatus === 'Pending').length + debits.filter(v => v.approvalStatus === 'Pending').length
    };
  },

  resetToDefaultData(): void {
    localStorage.clear();
    this.getCreditVouchers();
    this.getDebitVouchers();
    this.getAccounts();
    this.getSuppliers();
    this.getCustomers();
    this.getCurrentUser();
    this.getPdfBrandingSettings();
  },

  getPdfBrandingSettings(): PdfBrandingSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PDF_BRANDING);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return { ...DEFAULT_PDF_BRANDING };
  },

  savePdfBrandingSettings(settings: Partial<PdfBrandingSettings>): void {
    const existing = this.getPdfBrandingSettings();
    const merged = { ...existing, ...settings };
    try {
      localStorage.setItem(STORAGE_KEY_PDF_BRANDING, JSON.stringify(merged));
    } catch {}
  },

  resetPdfBrandingSettings(): PdfBrandingSettings {
    try {
      localStorage.removeItem(STORAGE_KEY_PDF_BRANDING);
    } catch {}
    return { ...DEFAULT_PDF_BRANDING };
  }
};

