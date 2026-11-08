import { UserProfile, UserRole } from '../types/voucher';
import { voucherStorage, DEFAULT_PDF_BRANDING } from './voucherStorage';
import { K_USERS, K_PERMS, K_SESSION, K_BRAND, cloudEnabled, pushUsers, pushPermissions } from './cloudSync';

/* ───────────────────────── Permissions ───────────────────────── */

export type PermissionKey =
  | 'dashboard.view'
  | 'in.view' | 'in.create' | 'in.edit' | 'in.delete'
  | 'out.view' | 'out.create' | 'out.edit' | 'out.delete'
  | 'voucher.approve'
  | 'pdf.download'
  | 'pdf.studio'
  | 'docs.view'
  | 'clients.view'
  | 'branding.edit'
  | 'roles.manage';

export const PERMISSION_GROUPS: Array<{ title: string; items: Array<{ key: PermissionKey; label: string }> }> = [
  { title: 'General', items: [
    { key: 'dashboard.view', label: 'View dashboard' },
    { key: 'docs.view', label: 'View document center' },
    { key: 'clients.view', label: 'View clients / accounts' },
  ] },
  { title: 'IN vouchers (Credit)', items: [
    { key: 'in.view', label: 'View IN register' },
    { key: 'in.create', label: 'Create IN voucher' },
    { key: 'in.edit', label: 'Edit IN voucher' },
    { key: 'in.delete', label: 'Delete IN voucher' },
  ] },
  { title: 'OUT vouchers (Debit)', items: [
    { key: 'out.view', label: 'View OUT register' },
    { key: 'out.create', label: 'Create OUT voucher' },
    { key: 'out.edit', label: 'Edit OUT voucher' },
    { key: 'out.delete', label: 'Delete OUT voucher' },
  ] },
  { title: 'Approval & PDF', items: [
    { key: 'voucher.approve', label: 'Approve / reject vouchers' },
    { key: 'pdf.download', label: 'Download / print PDF' },
    { key: 'pdf.studio', label: 'Use PDF Studio (branding)' },
  ] },
  { title: 'Administration', items: [
    { key: 'branding.edit', label: 'Change app name & logo' },
    { key: 'roles.manage', label: 'Manage roles & users' },
  ] },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));
export const ROLES: UserRole[] = ['Admin', 'Authorized Accounts Manager', 'Accounts Staff'];

export type RolePermissionMap = Record<UserRole, PermissionKey[]>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMap = {
  Admin: [...ALL_PERMISSIONS],
  'Authorized Accounts Manager': ALL_PERMISSIONS.filter((p) => p !== 'roles.manage' && p !== 'branding.edit'),
  'Accounts Staff': [
    'dashboard.view', 'docs.view', 'clients.view',
    'in.view', 'in.create', 'in.edit',
    'out.view', 'out.create', 'out.edit',
    'pdf.download',
  ],
};

/* ───────────────────────── Users ───────────────────────── */

export type LoginMethod = 'email' | 'mobile' | 'both';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  designation: string;
  department: string;
  email: string;
  mobile: string;
  loginMethod: LoginMethod;
  passwordHash: string;
  active: boolean;
  avatar?: string;
}


/** SHA-256 (hex). Client-side demo protection only – real deployments need a server. */
export async function hashPassword(plain: string): Promise<string> {
  const salted = `raviraja-crm::${plain}`;
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salted));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 5381;
    for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
    return `x${(h >>> 0).toString(16)}`;
  }
}

// Pre-computed hashes of the demo passwords (admin@123 / manager@123 / staff@123)
const SEED: Array<Omit<AppUser, 'passwordHash'> & { demoPassword: string }> = [
  { id: 'USR-001', name: 'Raviraja Reddy', role: 'Admin', designation: 'Managing Director & CEO', department: 'Executive Board', email: 'admin@raviraja.com', mobile: '9876500001', loginMethod: 'both', active: true, demoPassword: 'admin@123' },
  { id: 'USR-003', name: 'Lakshmi Narayana', role: 'Authorized Accounts Manager', designation: 'Chief Accounts Officer & AGM Finance', department: 'Finance & Accounts', email: 'manager@raviraja.com', mobile: '9876500003', loginMethod: 'both', active: true, demoPassword: 'manager@123' },
  { id: 'USR-002', name: 'Suresh Kumar', role: 'Accounts Staff', designation: 'Junior Accountant', department: 'Finance & Accounts', email: 'staff@raviraja.com', mobile: '9876500002', loginMethod: 'mobile', active: true, demoPassword: 'staff@123' },
];

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

let seeded: AppUser[] | null = null;
export async function ensureSeedUsers(): Promise<AppUser[]> {
  if (cloudEnabled) return readJson<AppUser[]>(K_USERS) || [];
  const existing = readJson<AppUser[]>(K_USERS);
  if (existing && existing.length) return existing;
  if (!seeded) {
    seeded = await Promise.all(
      SEED.map(async ({ demoPassword, ...u }) => ({ ...u, passwordHash: await hashPassword(demoPassword) }))
    );
  }
  writeJson(K_USERS, seeded);
  return seeded;
}

export const accessStore = {
  getUsers(): AppUser[] {
    return readJson<AppUser[]>(K_USERS) || seeded || [];
  },
  saveUsers(users: AppUser[]) {
    const prev = readJson<AppUser[]>(K_USERS) || [];
    writeJson(K_USERS, users);
    if (cloudEnabled) void pushUsers(prev, users);
  },
  getPermissions(): RolePermissionMap {
    const saved = readJson<RolePermissionMap>(K_PERMS);
    const merged = { ...DEFAULT_ROLE_PERMISSIONS, ...(saved || {}) } as RolePermissionMap;
    // Admin can never lock themselves out of role management
    if (!merged.Admin.includes('roles.manage')) merged.Admin = [...merged.Admin, 'roles.manage'];
    return merged;
  },
  savePermissions(map: RolePermissionMap) {
    writeJson(K_PERMS, map);
    if (cloudEnabled) void pushPermissions(map);
  },
  resetPermissions() {
    try { localStorage.removeItem(K_PERMS); } catch { /* ignore */ }
    if (cloudEnabled) void pushPermissions(DEFAULT_ROLE_PERMISSIONS);
  },
  getSessionUserId(): string | null {
    try { return localStorage.getItem(K_SESSION); } catch { return null; }
  },
  setSession(userId: string | null) {
    try {
      if (userId) localStorage.setItem(K_SESSION, userId);
      else localStorage.removeItem(K_SESSION);
    } catch { /* ignore */ }
  },
};

export const normalizeMobile = (v: string) => v.replace(/\D/g, '').slice(-10);

export type LoginResult = { ok: true; user: AppUser } | { ok: false; error: string };

export async function login(method: 'email' | 'mobile', identifier: string, password: string): Promise<LoginResult> {
  const users = await ensureSeedUsers();
  const id = method === 'email' ? identifier.trim().toLowerCase() : normalizeMobile(identifier);
  if (!id) return { ok: false, error: method === 'email' ? 'Enter your email address.' : 'Enter your 10-digit mobile number.' };
  const user = users.find((u) => (method === 'email' ? u.email.trim().toLowerCase() === id : normalizeMobile(u.mobile) === id));
  const hash = await hashPassword(password);
  if (!user || user.passwordHash !== hash) return { ok: false, error: 'Incorrect login details. Please try again.' };
  if (!user.active) return { ok: false, error: 'This account is disabled. Contact your administrator.' };
  if (user.loginMethod !== 'both' && user.loginMethod !== method) {
    return { ok: false, error: `This account signs in with ${user.loginMethod === 'email' ? 'email' : 'mobile number'} only.` };
  }
  accessStore.setSession(user.id);
  applySessionProfile(user);
  return { ok: true, user };
}

/** Keeps the voucher audit trail in sync with whoever is signed in. */
export function applySessionProfile(user: AppUser): UserProfile {
  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    role: user.role,
    designation: user.designation,
    department: user.department,
    avatar: user.avatar || '',
  };
  try { localStorage.setItem('raviraja_crm_current_user_v1', JSON.stringify(profile)); } catch { /* ignore */ }
  return profile;
}

export function logout() {
  accessStore.setSession(null);
}

export function getSessionUser(): AppUser | null {
  const id = accessStore.getSessionUserId();
  if (!id) return null;
  const u = accessStore.getUsers().find((x) => x.id === id);
  return u && u.active ? u : null;
}

/* ───────────────────────── App branding (navbar) ───────────────────────── */

export interface AppBrand {
  appName: string;
  badge: string;
  subtitle: string;
  logoText: string;
  logoImage: string;
}

export const DEFAULT_APP_BRAND: AppBrand = {
  appName: 'RAVIRAJA CRM',
  badge: 'FINANCE DESK',
  subtitle: 'Raviraja Industries Private Limited • Hyderabad',
  logoText: 'RIL',
  logoImage: '',
};

export const brandStore = {
  get(): AppBrand {
    const saved = readJson<Partial<AppBrand>>(K_BRAND);
    const pdf = voucherStorage.getPdfBrandingSettings();
    return { ...DEFAULT_APP_BRAND, logoImage: pdf.leftLogoImage || '', ...(saved || {}) };
  },
  save(b: AppBrand) {
    writeJson(K_BRAND, b);
    // Keep the PDF header in sync with the app logo
    voucherStorage.savePdfBrandingSettings({
      leftLogoImage: b.logoImage,
      leftLogoText: b.logoText || DEFAULT_PDF_BRANDING.leftLogoText,
    });
  },
};
