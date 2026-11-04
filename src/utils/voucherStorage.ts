import { InVoucher, OutVoucher, AccountHead, UserProfile, UserRole } from '../types/voucher';

const STORAGE_KEY_IN_VOUCHERS = 'raviraja_crm_in_vouchers_v1';
const STORAGE_KEY_OUT_VOUCHERS = 'raviraja_crm_out_vouchers_v1';
const STORAGE_KEY_ACCOUNTS = 'raviraja_crm_accounts_v1';
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

export const DEFAULT_ACCOUNTS: AccountHead[] = [
  { id: 'ACC-101', code: '4001', name: 'Sales Income - Industrial Machinery', group: 'Direct Income', balance: 14250000 },
  { id: 'ACC-102', code: '4002', name: 'Sales Income - Fabricated Steel Components', group: 'Direct Income', balance: 9800000 },
  { id: 'ACC-103', code: '4003', name: 'Customer Advance - Tata Projects Ltd', group: 'Sundry Debtors', balance: 3500000 },
  { id: 'ACC-104', code: '4004', name: 'Customer Advance - L&T Construction', group: 'Sundry Debtors', balance: 5200000 },
  { id: 'ACC-105', code: '4005', name: 'Customer Advance - BHEL Trichy', group: 'Sundry Debtors', balance: 2100000 },
  { id: 'ACC-106', code: '4006', name: 'Scrap & Metal Waste Sales', group: 'Direct Income', balance: 480000 },
  { id: 'ACC-107', code: '4007', name: 'Warehouse Rental Income', group: 'Indirect Income', balance: 750000 },
  { id: 'ACC-108', code: '4008', name: 'Interest on Bank Fixed Deposits (SBI)', group: 'Indirect Income', balance: 320000 },
  { id: 'ACC-109', code: '4009', name: 'Consulting & Engineering Design Fees', group: 'Direct Income', balance: 1850000 },
  { id: 'ACC-110', code: '4010', name: 'Sundry Debtors - Jindal Steel Works', group: 'Sundry Debtors', balance: 4120000 },
  { id: 'ACC-111', code: '4011', name: 'Sundry Debtors - Kirloskar Electric Co', group: 'Sundry Debtors', balance: 1650000 },
  { id: 'ACC-112', code: '4012', name: 'GST Input Credit Refund A/C', group: 'Current Assets', balance: 890000 },
  { id: 'ACC-113', code: '4013', name: 'Insurance Claim Received', group: 'Indirect Income', balance: 450000 },
  { id: 'ACC-114', code: '4014', name: 'Security Deposit Refund Received', group: 'Advances', balance: 300000 },
];

const INITIAL_IN_VOUCHERS: InVoucher[] = [
  {
    id: 'inv-uuid-001',
    voucherNo: 'IN-0001',
    voucherDate: '2026-11-01',
    voucherType: 'IN',
    accountId: 'ACC-103',
    accountName: 'Customer Advance - Tata Projects Ltd',
    referenceDate: '2026-10-31',
    referenceDetails: 'Purchase Order No: TPL/HYD/PO/2026/8942',
    paymentParticulars: 'Advance 30% against supply of heavy industrial gearboxes',
    noteReason: 'Commercial advance release per contract milestone clause 4.2',
    receivedFrom: 'Tata Projects Limited, Secunderabad',
    paymentMode: 'Bank',
    paymentModeDetails: {
      bankName: 'State Bank of India - Corporate Branch',
      transactionRef: 'SBIN20261101994821',
    },
    amount: 1550000,
    amountInWords: 'Fifteen Lakh Fifty Thousand Rupees Only',
    particularsNotes: 'Received directly via RTGS into Raviraja Industries SBI CC A/c No. 34019284102',
    preparedBy: 'Suresh Kumar',
    passedBy: 'Lakshmi Narayana',
    receiverSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 20 40 Q 50 10 80 40 T 140 25 T 180 35" stroke="%231e3a8a" stroke-width="2.5" fill="none"/></svg>',
    receiverSignatureType: 'draw',
    attachments: [
      {
        id: 'att-1',
        name: 'Tata_Projects_PO_8942.pdf',
        type: 'Invoice',
        size: 345200,
        mimeType: 'application/pdf',
        dataUrl: '',
        uploadedAt: '2026-11-01T10:30:00Z',
      },
      {
        id: 'att-2',
        name: 'RTGS_Advice_SBIN20261101994821.pdf',
        type: 'Payment Proof',
        size: 198000,
        mimeType: 'application/pdf',
        dataUrl: '',
        uploadedAt: '2026-11-01T10:35:00Z',
      }
    ],
    status: 'Approved',
    auditTrail: [
      {
        id: 'aud-1',
        action: 'Voucher Created',
        performedBy: 'Suresh Kumar',
        role: 'Accounts Staff',
        timestamp: '2026-11-01T10:32:00Z',
        details: 'Initial draft voucher saved'
      },
      {
        id: 'aud-2',
        action: 'Verified & Approved',
        performedBy: 'Lakshmi Narayana',
        role: 'Authorized Accounts Manager',
        timestamp: '2026-11-01T11:15:00Z',
        details: 'Bank statement verified and signed off'
      }
    ],
    createdBy: 'Suresh Kumar',
    createdAt: '2026-11-01T10:32:00Z',
    updatedBy: 'Lakshmi Narayana',
    updatedAt: '2026-11-01T11:15:00Z',
  },
  {
    id: 'inv-uuid-002',
    voucherNo: 'IN-0002',
    voucherDate: '2026-11-02',
    voucherType: 'IN',
    accountId: 'ACC-106',
    accountName: 'Scrap & Metal Waste Sales',
    referenceDate: '2026-11-02',
    referenceDetails: 'Weighbridge Slip & Gate Pass #WB-8812',
    paymentParticulars: 'Sale of turning scrap and mild steel offcuts (12.4 MT)',
    noteReason: 'Immediate spot cash clearance as approved by Plant Head',
    receivedFrom: 'Sri Balaji Metal Traders, Jeedimetla',
    paymentMode: 'Cash',
    amount: 145000,
    amountInWords: 'One Lakh Forty Five Thousand Rupees Only',
    particularsNotes: 'Cash deposited in Main Factory Safe with Cashier Mr. V. Rao',
    preparedBy: 'Suresh Kumar',
    passedBy: 'Lakshmi Narayana',
    receiverSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 25 35 Q 60 5 95 35 T 150 20" stroke="%231e3a8a" stroke-width="2.5" fill="none"/></svg>',
    receiverSignatureType: 'draw',
    attachments: [
      {
        id: 'att-3',
        name: 'Weighbridge_Slip_WB8812.jpg',
        type: 'Supporting Bill',
        size: 512000,
        mimeType: 'image/jpeg',
        dataUrl: '',
        uploadedAt: '2026-11-02T14:10:00Z',
      }
    ],
    status: 'Approved',
    auditTrail: [
      {
        id: 'aud-3',
        action: 'Voucher Created',
        performedBy: 'Suresh Kumar',
        role: 'Accounts Staff',
        timestamp: '2026-11-02T14:12:00Z',
        details: 'Cash voucher entry with weighbridge verification'
      }
    ],
    createdBy: 'Suresh Kumar',
    createdAt: '2026-11-02T14:12:00Z',
    updatedBy: 'Lakshmi Narayana',
    updatedAt: '2026-11-02T15:00:00Z',
  },
  {
    id: 'inv-uuid-003',
    voucherNo: 'IN-0003',
    voucherDate: '2026-11-03',
    voucherType: 'IN',
    accountId: 'ACC-110',
    accountName: 'Sundry Debtors - Jindal Steel Works',
    referenceDate: '2026-10-24',
    referenceDetails: 'Invoice No: RIL/2026-27/0419',
    paymentParticulars: 'Full & final payment against invoice 0419 after TDS deduction',
    noteReason: 'Account clearance with TDS certificate form 16A reference',
    receivedFrom: 'Jindal Steel Works Ltd, Bellary Unit',
    paymentMode: 'Cheque',
    paymentModeDetails: {
      chequeNo: '449102',
      chequeDate: '2026-11-02',
      bankName: 'HDFC Bank Ltd, Industrial Estate Branch',
    },
    amount: 875250,
    amountInWords: 'Eight Lakh Seventy Five Thousand Two Hundred Fifty Rupees Only',
    particularsNotes: 'Cheque handed over to bank for clearing on 03/11/2026',
    preparedBy: 'Suresh Kumar',
    passedBy: 'Lakshmi Narayana',
    receiverSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 15 45 Q 65 15 110 40 T 175 30" stroke="%231e3a8a" stroke-width="2.5" fill="none"/></svg>',
    receiverSignatureType: 'draw',
    attachments: [
      {
        id: 'att-4',
        name: 'Cheque_Copy_449102.jpg',
        type: 'Payment Proof',
        size: 420000,
        mimeType: 'image/jpeg',
        dataUrl: '',
        uploadedAt: '2026-11-03T09:40:00Z',
      },
      {
        id: 'att-5',
        name: 'Invoice_RIL_0419.pdf',
        type: 'Invoice',
        size: 280000,
        mimeType: 'application/pdf',
        dataUrl: '',
        uploadedAt: '2026-11-03T09:42:00Z',
      }
    ],
    status: 'Approved',
    auditTrail: [
      {
        id: 'aud-4',
        action: 'Voucher Created',
        performedBy: 'Suresh Kumar',
        role: 'Accounts Staff',
        timestamp: '2026-11-03T09:45:00Z',
      }
    ],
    createdBy: 'Suresh Kumar',
    createdAt: '2026-11-03T09:45:00Z',
    updatedBy: 'Suresh Kumar',
    updatedAt: '2026-11-03T09:45:00Z',
  },
  {
    id: 'inv-uuid-004',
    voucherNo: 'IN-0004',
    voucherDate: '2026-11-04',
    voucherType: 'IN',
    accountId: 'ACC-107',
    accountName: 'Warehouse Rental Income',
    referenceDate: '2026-11-01',
    referenceDetails: 'Lease Agreement Clause 6 - Shed No. 4',
    paymentParticulars: 'Monthly rent for November 2026 for Logistics Hub Yard',
    noteReason: 'Prompt payment incentive applied per tenancy agreement',
    receivedFrom: 'VRL Logistics Limited, Hyderabad Depot',
    paymentMode: 'UPI',
    paymentModeDetails: {
      upiId: 'vrllogistics@icici',
      transactionRef: 'UPI/630918239012/RentNov',
    },
    amount: 125000,
    amountInWords: 'One Lakh Twenty Five Thousand Rupees Only',
    particularsNotes: 'Received on Raviraja Industries ICICI Merchant QR code',
    preparedBy: 'Suresh Kumar',
    passedBy: 'Lakshmi Narayana',
    receiverSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 30 35 Q 70 12 120 38 T 165 25" stroke="%231e3a8a" stroke-width="2.5" fill="none"/></svg>',
    receiverSignatureType: 'draw',
    attachments: [
      {
        id: 'att-6',
        name: 'UPI_Screenshot_NovRent.png',
        type: 'Payment Proof',
        size: 310000,
        mimeType: 'image/png',
        dataUrl: '',
        uploadedAt: '2026-11-04T08:15:00Z',
      }
    ],
    status: 'Approved',
    auditTrail: [
      {
        id: 'aud-5',
        action: 'Voucher Created & Approved',
        performedBy: 'Lakshmi Narayana',
        role: 'Authorized Accounts Manager',
        timestamp: '2026-11-04T08:30:00Z',
      }
    ],
    createdBy: 'Lakshmi Narayana',
    createdAt: '2026-11-04T08:30:00Z',
    updatedBy: 'Lakshmi Narayana',
    updatedAt: '2026-11-04T08:30:00Z',
  }
];

const INITIAL_OUT_VOUCHERS: OutVoucher[] = [
  {
    id: 'out-uuid-001',
    voucherNo: 'OUT-0001',
    voucherDate: '2026-11-01',
    voucherType: 'OUT',
    accountName: 'Raw Materials - High Tensile Steel Sheets',
    paidTo: 'Steel Authority of India Ltd (SAIL)',
    paymentMode: 'Bank',
    amount: 850000,
    amountInWords: 'Eight Lakh Fifty Thousand Rupees Only',
    particularsNotes: 'Payment towards advance raw material coil allocation',
    status: 'Approved',
    createdBy: 'Suresh Kumar',
    createdAt: '2026-11-01T14:00:00Z'
  },
  {
    id: 'out-uuid-002',
    voucherNo: 'OUT-0002',
    voucherDate: '2026-11-03',
    voucherType: 'OUT',
    accountName: 'Factory Power & Electricity Charges',
    paidTo: 'TSSPDCL Hyderabad South Division',
    paymentMode: 'Bank',
    amount: 320400,
    amountInWords: 'Three Lakh Twenty Thousand Four Hundred Rupees Only',
    particularsNotes: 'HT Power Bill consumption for Unit 1 & Unit 2',
    status: 'Approved',
    createdBy: 'Suresh Kumar',
    createdAt: '2026-11-03T16:20:00Z'
  }
];

// Memory fallback if localStorage is disabled
let memoryInVouchers: InVoucher[] | null = null;
let memoryOutVouchers: OutVoucher[] | null = null;
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

  addAccount(account: Omit<AccountHead, 'id'>): AccountHead {
    const accounts = this.getAccounts();
    const newAccount: AccountHead = {
      ...account,
      id: `ACC-${Date.now().toString().slice(-4)}`
    };
    const updated = [newAccount, ...accounts];
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updated));
    } catch {
      memoryAccounts = updated;
    }
    return newAccount;
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

  getInVouchers(): InVoucher[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_IN_VOUCHERS);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY_IN_VOUCHERS, JSON.stringify(INITIAL_IN_VOUCHERS));
      return INITIAL_IN_VOUCHERS;
    } catch {
      if (!memoryInVouchers) memoryInVouchers = [...INITIAL_IN_VOUCHERS];
      return memoryInVouchers;
    }
  },

  getNextInVoucherNumber(): string {
    const vouchers = this.getInVouchers();
    let maxNum = 0;
    const prefix = 'IN-';

    vouchers.forEach((v) => {
      if (v.voucherNo && v.voucherNo.startsWith(prefix)) {
        const numPart = parseInt(v.voucherNo.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },

  saveInVoucher(voucherData: Omit<InVoucher, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'> & { id?: string }): InVoucher {
    const vouchers = this.getInVouchers();
    const currentUser = this.getCurrentUser();
    const nowIso = new Date().toISOString();

    if (voucherData.id) {
      // Editing existing voucher
      const existingIndex = vouchers.findIndex(v => v.id === voucherData.id);
      if (existingIndex === -1) {
        throw new Error('Voucher not found for update.');
      }

      const existing = vouchers[existingIndex];
      const auditTrail = [
        ...(existing.auditTrail || []),
        {
          id: `aud-${Date.now()}`,
          action: 'Voucher Updated',
          performedBy: currentUser.name,
          role: currentUser.role,
          timestamp: nowIso,
          details: `Modified voucher details (Amount: ₹${voucherData.amount})`
        }
      ];

      const updatedVoucher: InVoucher = {
        ...existing,
        ...voucherData,
        id: existing.id,
        voucherNo: existing.voucherNo, // Never change existing voucher number
        updatedBy: currentUser.name,
        updatedAt: nowIso,
        auditTrail
      };

      vouchers[existingIndex] = updatedVoucher;
      try {
        localStorage.setItem(STORAGE_KEY_IN_VOUCHERS, JSON.stringify(vouchers));
      } catch {
        memoryInVouchers = vouchers;
      }
      return updatedVoucher;
    } else {
      // Creating a new voucher
      // Generate clean guaranteed unique number
      const isOut = voucherData.voucherType === 'OUT' || voucherData.voucherType === 'OUT(Debit)';
      let voucherNo = voucherData.voucherNo;
      if (!voucherNo || vouchers.some(v => v.voucherNo === voucherNo)) {
        voucherNo = isOut ? this.getNextOutVoucherNumber() : this.getNextInVoucherNumber();
      }

      const newId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const auditTrail = [
        {
          id: `aud-${Date.now()}`,
          action: 'Voucher Created',
          performedBy: currentUser.name,
          role: currentUser.role,
          timestamp: nowIso,
          details: `Generated voucher ${voucherNo} [${voucherData.voucherType || 'IN(Credit)'}] for ₹${voucherData.amount}`
        }
      ];

      const newVoucher: InVoucher = {
        ...voucherData,
        id: newId,
        voucherNo,
        voucherType: voucherData.voucherType || 'IN(Credit)',
        createdBy: currentUser.name,
        createdAt: nowIso,
        updatedBy: currentUser.name,
        updatedAt: nowIso,
        auditTrail,
        status: voucherData.status || (currentUser.role === 'Authorized Accounts Manager' || currentUser.role === 'Admin' ? 'Approved' : 'Pending Verification')
      };

      // Unshift to put latest on top
      const updatedList = [newVoucher, ...vouchers];
      try {
        localStorage.setItem(STORAGE_KEY_IN_VOUCHERS, JSON.stringify(updatedList));
      } catch {
        memoryInVouchers = updatedList;
      }
      return newVoucher;
    }
  },

  deleteInVoucher(id: string, user: UserProfile): boolean {
    if (user.role !== 'Admin') {
      throw new Error('Unauthorized: Only System Admin has permission to delete saved vouchers.');
    }
    const vouchers = this.getInVouchers();
    const filtered = vouchers.filter(v => v.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_IN_VOUCHERS, JSON.stringify(filtered));
    } catch {
      memoryInVouchers = filtered;
    }
    return true;
  },

  updateStatus(id: string, newStatus: InVoucher['status'], user: UserProfile): InVoucher {
    const vouchers = this.getInVouchers();
    const index = vouchers.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Voucher not found');

    const voucher = vouchers[index];
    const nowIso = new Date().toISOString();

    const auditTrail = [
      ...(voucher.auditTrail || []),
      {
        id: `aud-${Date.now()}`,
        action: `Status changed to ${newStatus}`,
        performedBy: user.name,
        role: user.role,
        timestamp: nowIso
      }
    ];

    const updated: InVoucher = {
      ...voucher,
      status: newStatus,
      passedBy: newStatus === 'Approved' ? user.name : voucher.passedBy,
      updatedBy: user.name,
      updatedAt: nowIso,
      auditTrail
    };

    vouchers[index] = updated;
    try {
      localStorage.setItem(STORAGE_KEY_IN_VOUCHERS, JSON.stringify(vouchers));
    } catch {
      memoryInVouchers = vouchers;
    }
    return updated;
  },

  // OUT Vouchers (Separate Module & Sequence OUT-0001)
  getOutVouchers(): OutVoucher[] {
    let outList: OutVoucher[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OUT_VOUCHERS);
      if (stored) {
        outList = JSON.parse(stored);
      } else {
        outList = [...INITIAL_OUT_VOUCHERS];
        localStorage.setItem(STORAGE_KEY_OUT_VOUCHERS, JSON.stringify(INITIAL_OUT_VOUCHERS));
      }
    } catch {
      if (!memoryOutVouchers) memoryOutVouchers = [...INITIAL_OUT_VOUCHERS];
      outList = memoryOutVouchers;
    }

    // Also include any OUT vouchers created in the unified Voucher Entry (IN / OUT) form
    try {
      const inVouchers = this.getInVouchers();
      const outVouchersFromUnified: OutVoucher[] = inVouchers
        .filter(v => v.voucherType === 'OUT' || v.voucherType === 'OUT(Debit)' || (v.voucherNo && v.voucherNo.startsWith('OUT-')))
        .map(v => ({
          id: v.id,
          voucherNo: v.voucherNo,
          voucherDate: v.voucherDate,
          voucherType: 'OUT' as const,
          accountName: v.accountName,
          paidTo: v.receivedFrom, // In OUT payment vouchers, receivedFrom stores the recipient/vendor name
          paymentMode: v.paymentMode,
          amount: v.amount,
          amountInWords: v.amountInWords,
          particularsNotes: v.particularsNotes || v.paymentParticulars || '',
          status: v.status || 'Approved',
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }));

      // Merge and deduplicate by voucherNo or id
      const combined = [...outList];
      outVouchersFromUnified.forEach(ov => {
        if (!combined.some(c => c.voucherNo === ov.voucherNo || c.id === ov.id)) {
          combined.unshift(ov);
        }
      });
      return combined;
    } catch {
      return outList;
    }
  },

  getNextOutVoucherNumber(): string {
    const vouchers = this.getOutVouchers();
    let maxNum = 0;
    const prefix = 'OUT-';

    vouchers.forEach((v) => {
      if (v.voucherNo && v.voucherNo.startsWith(prefix)) {
        const numPart = parseInt(v.voucherNo.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },

  saveOutVoucher(data: Omit<OutVoucher, 'id' | 'createdAt' | 'voucherNo' | 'voucherType' | 'createdBy'> & { createdBy?: string }): OutVoucher {
    const vouchers = this.getOutVouchers();
    const currentUser = this.getCurrentUser();
    const nowIso = new Date().toISOString();
    const voucherNo = this.getNextOutVoucherNumber();

    const newVoucher: OutVoucher = {
      ...data,
      id: `out-${Date.now()}`,
      voucherNo,
      voucherType: 'OUT',
      createdBy: data.createdBy || currentUser.name,
      createdAt: nowIso
    };

    const updated = [newVoucher, ...vouchers];
    try {
      localStorage.setItem(STORAGE_KEY_OUT_VOUCHERS, JSON.stringify(updated));
    } catch {
      memoryOutVouchers = updated;
    }
    return newVoucher;
  },

  resetToDefaultData(): void {
    try {
      localStorage.setItem(STORAGE_KEY_IN_VOUCHERS, JSON.stringify(INITIAL_IN_VOUCHERS));
      localStorage.setItem(STORAGE_KEY_OUT_VOUCHERS, JSON.stringify(INITIAL_OUT_VOUCHERS));
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(DEFAULT_USERS['Admin']));
    } catch {
      memoryInVouchers = [...INITIAL_IN_VOUCHERS];
      memoryOutVouchers = [...INITIAL_OUT_VOUCHERS];
      memoryAccounts = [...DEFAULT_ACCOUNTS];
      memoryUser = DEFAULT_USERS['Admin'];
    }
  }
};
