import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { AppUser, RolePermissionMap } from './accessControl';

/* ───────────────────────── Supabase client ───────────────────────── */

const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True only when real Supabase keys are configured (see .env). Otherwise the app runs in local demo mode. */
export const cloudEnabled = Boolean(url && anon && !/YOUR_|MY_/i.test(url));

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url as string, anon as string, {
      // Session lives only in this browser tab: opening the link again (new tab / new visit) always asks for login.
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: window.sessionStorage },
    })
  : null;

/* ───────────────────────── Storage keys ───────────────────────── */

export const K_USERS = 'raviraja_crm_app_users_v1';
export const K_PERMS = 'raviraja_crm_role_permissions_v1';
export const K_SESSION = 'raviraja_crm_session_v1';
export const K_BRAND = 'raviraja_crm_app_brand_v1';

const K_CREDIT = 'raviraja_crm_credit_vouchers_v2';
const K_DEBIT = 'raviraja_crm_debit_vouchers_v2';

/** local storage key → cloud key for small shared lists & branding */
const KV_MAP: Record<string, string> = {
  raviraja_crm_accounts_v1: 'accounts',
  raviraja_crm_suppliers_v1: 'suppliers',
  raviraja_crm_customers_v1: 'customers',
  raviraja_crm_main_accounts_v1: 'main_accounts',
  raviraja_crm_cashiers_v1: 'cashiers',
  raviraja_crm_receivers_v1: 'receivers',
  raviraja_crm_pdf_branding_v1: 'pdf_branding',
  [K_BRAND]: 'app_brand',
};
const KV_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(KV_MAP).map(([l, c]) => [c, l]));

export const CLOUD_CHANGE_EVENT = 'raviraja-cloud-change';
export const CLOUD_ERROR_EVENT = 'raviraja-cloud-error';
export const CLOUD_STATUS_EVENT = 'raviraja-cloud-status';

const emitChange = () => window.dispatchEvent(new Event(CLOUD_CHANGE_EVENT));
const emitError = (message: string) => window.dispatchEvent(new CustomEvent(CLOUD_ERROR_EVENT, { detail: message }));
const emitStatus = (s: 'live' | 'connecting' | 'offline') => window.dispatchEvent(new CustomEvent(CLOUD_STATUS_EVENT, { detail: s }));

/* ───────────────────────── Local cache helpers ───────────────────────── */

let applyingRemote = false;
let active = false;
let myEmail = '';

const rawSet = Storage.prototype.setItem;
const rawRemove = Storage.prototype.removeItem;

function setLocal(key: string, value: unknown) {
  applyingRemote = true;
  try {
    rawSet.call(localStorage, key, JSON.stringify(value));
  } catch { /* storage full / unavailable */ }
  applyingRemote = false;
}
function getLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/* ───────────────────────── Vouchers (one row per voucher) ───────────────────────── */

const known: Record<'IN' | 'OUT', Map<string, string>> = { IN: new Map(), OUT: new Map() };
const keyOfKind = (k: 'IN' | 'OUT') => (k === 'IN' ? K_CREDIT : K_DEBIT);

async function pullVouchers(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('vouchers').select('id,kind,data,updated_at').order('updated_at', { ascending: false });
  if (error) throw error;
  const lists: Record<'IN' | 'OUT', any[]> = { IN: [], OUT: [] };
  known.IN.clear();
  known.OUT.clear();
  (data || []).forEach((r: any) => {
    const kind = r.kind as 'IN' | 'OUT';
    lists[kind].push(r.data);
    known[kind].set(r.id, JSON.stringify(r.data));
  });
  setLocal(K_CREDIT, lists.IN);
  setLocal(K_DEBIT, lists.OUT);
}

let voucherTimers: Partial<Record<'IN' | 'OUT', ReturnType<typeof setTimeout>>> = {};
function scheduleVoucherPush(kind: 'IN' | 'OUT') {
  clearTimeout(voucherTimers[kind]);
  voucherTimers[kind] = setTimeout(() => pushVouchers(kind), 300);
}

async function pushVouchers(kind: 'IN' | 'OUT'): Promise<void> {
  if (!supabase || !active) return;
  const local = getLocal<any[]>(keyOfKind(kind)) || [];
  const mem = known[kind];
  const changed = local.filter((v) => v?.id && JSON.stringify(v) !== mem.get(v.id));
  const localIds = new Set(local.map((v) => v?.id));
  const removed = [...mem.keys()].filter((id) => !localIds.has(id));
  try {
    for (let i = 0; i < changed.length; i += 10) {
      const rows = changed.slice(i, i + 10).map((v) => ({ id: v.id, kind, data: v, updated_at: new Date().toISOString(), updated_by: myEmail }));
      const { error } = await supabase.from('vouchers').upsert(rows);
      if (error) throw error;
      rows.forEach((r) => mem.set(r.id, JSON.stringify(r.data)));
    }
    if (removed.length) {
      const { data, error } = await supabase.from('vouchers').delete().in('id', removed).select('id');
      if (error) throw error;
      removed.forEach((id) => mem.delete(id));
      if ((data?.length || 0) < removed.length) throw new Error('You do not have permission to delete this voucher.');
    }
  } catch (e: any) {
    emitError(e?.message || 'Could not save to the cloud.');
    // roll the local view back to what the server really has
    try { await pullVouchers(); emitChange(); } catch { /* ignore */ }
  }
}

async function applyVoucherEvent(payload: any): Promise<void> {
  if (!supabase) return;
  if (payload.eventType === 'DELETE') {
    const id = payload.old?.id as string;
    const kind = (payload.old?.kind as 'IN' | 'OUT') || (known.IN.has(id) ? 'IN' : 'OUT');
    if (!id || !known[kind].has(id)) return;
    known[kind].delete(id);
    setLocal(keyOfKind(kind), (getLocal<any[]>(keyOfKind(kind)) || []).filter((v) => v.id !== id));
    emitChange();
    return;
  }
  const id = payload.new?.id as string;
  const { data, error } = await supabase.from('vouchers').select('id,kind,data').eq('id', id).maybeSingle();
  if (error || !data) return;
  const kind = data.kind as 'IN' | 'OUT';
  const json = JSON.stringify(data.data);
  if (known[kind].get(id) === json) return; // our own echo
  known[kind].set(id, json);
  const list = getLocal<any[]>(keyOfKind(kind)) || [];
  const idx = list.findIndex((v) => v.id === id);
  if (idx >= 0) list[idx] = data.data;
  else list.unshift(data.data);
  setLocal(keyOfKind(kind), list);
  emitChange();
}

/* ───────────────────────── Shared lists + branding (app_kv) ───────────────────────── */

const kvKnown = new Map<string, string>();
const kvTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function pullKv(seedMissing: boolean): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('app_kv').select('key,value');
  if (error) throw error;
  const cloudKeys = new Set<string>();
  (data || []).forEach((r: any) => {
    const local = KV_REVERSE[r.key];
    if (!local) return;
    cloudKeys.add(r.key);
    kvKnown.set(r.key, JSON.stringify(r.value));
    setLocal(local, r.value);
  });
  if (seedMissing) {
    // first sign-in: whatever this browser already had becomes the shared starting point
    for (const [local, ckey] of Object.entries(KV_MAP)) {
      if (cloudKeys.has(ckey)) continue;
      const v = getLocal<unknown>(local);
      if (v == null) continue;
      const { error: e } = await supabase.from('app_kv').upsert({ key: ckey, value: v, updated_by: myEmail });
      if (!e) kvKnown.set(ckey, JSON.stringify(v));
    }
  }
}

function scheduleKvPush(localKey: string, removed = false) {
  const ckey = KV_MAP[localKey];
  clearTimeout(kvTimers.get(ckey));
  kvTimers.set(
    ckey,
    setTimeout(async () => {
      if (!supabase || !active) return;
      try {
        if (removed) {
          const { error } = await supabase.from('app_kv').delete().eq('key', ckey);
          if (error) throw error;
          kvKnown.delete(ckey);
          return;
        }
        const v = getLocal<unknown>(localKey);
        if (v == null) return;
        const json = JSON.stringify(v);
        if (kvKnown.get(ckey) === json) return;
        const { error } = await supabase.from('app_kv').upsert({ key: ckey, value: v, updated_at: new Date().toISOString(), updated_by: myEmail });
        if (error) throw error;
        kvKnown.set(ckey, json);
      } catch (e: any) {
        emitError(e?.message || 'Could not save to the cloud.');
        try { await pullKv(false); emitChange(); } catch { /* ignore */ }
      }
    }, 400)
  );
}

async function applyKvEvent(payload: any): Promise<void> {
  if (!supabase) return;
  const ckey = (payload.new?.key || payload.old?.key) as string;
  const local = KV_REVERSE[ckey];
  if (!local) return;
  if (payload.eventType === 'DELETE') {
    kvKnown.delete(ckey);
    applyingRemote = true;
    try { rawRemove.call(localStorage, local); } catch { /* ignore */ }
    applyingRemote = false;
    emitChange();
    return;
  }
  const { data } = await supabase.from('app_kv').select('value').eq('key', ckey).maybeSingle();
  if (!data) return;
  const json = JSON.stringify(data.value);
  if (kvKnown.get(ckey) === json) return;
  kvKnown.set(ckey, json);
  setLocal(local, data.value);
  emitChange();
}

/* ───────────────────────── Users & permissions ───────────────────────── */

const toAppUser = (r: any): AppUser => ({
  id: r.id,
  name: r.name,
  role: r.role,
  designation: r.designation || '',
  department: r.department || '',
  email: r.email,
  mobile: r.mobile || '',
  loginMethod: 'email',
  passwordHash: '',
  active: !!r.active,
});

async function pullUsers(): Promise<AppUser[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  const users = (data || []).map(toAppUser);
  setLocal(K_USERS, users);
  return users;
}

async function pullPerms(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('role_permissions').select('role,permissions');
  if (error) throw error;
  const map: Record<string, string[]> = {};
  (data || []).forEach((r: any) => (map[r.role] = r.permissions || []));
  setLocal(K_PERMS, map);
}

export async function pushUsers(prev: AppUser[], next: AppUser[]): Promise<void> {
  if (!supabase || !active) return;
  const before = new Map(prev.map((u) => [u.id, JSON.stringify(u)]));
  const changed = next.filter((u) => before.get(u.id) !== JSON.stringify(u));
  const nextIds = new Set(next.map((u) => u.id));
  const removed = prev.filter((u) => !nextIds.has(u.id)).map((u) => u.id);
  try {
    if (changed.length) {
      const rows = changed.map((u) => ({
        id: u.id, email: u.email.trim().toLowerCase(), name: u.name, role: u.role,
        designation: u.designation, department: u.department, mobile: u.mobile, active: u.active,
      }));
      const { error } = await supabase.from('app_users').upsert(rows);
      if (error) throw error;
    }
    if (removed.length) {
      const { error } = await supabase.from('app_users').delete().in('id', removed);
      if (error) throw error;
    }
  } catch (e: any) {
    emitError(e?.message || 'Could not save users to the cloud.');
    try { await pullUsers(); emitChange(); } catch { /* ignore */ }
  }
}

export async function pushPermissions(map: RolePermissionMap): Promise<void> {
  if (!supabase || !active) return;
  try {
    const rows = Object.entries(map).map(([role, permissions]) => ({ role, permissions, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from('role_permissions').upsert(rows);
    if (error) throw error;
  } catch (e: any) {
    emitError(e?.message || 'Could not save permissions to the cloud.');
    try { await pullPerms(); emitChange(); } catch { /* ignore */ }
  }
}

/* ───────────────────────── Write hook (local change → cloud) ───────────────────────── */

let hooked = false;
function installWriteHook() {
  if (hooked) return;
  hooked = true;
  Storage.prototype.setItem = function (key: string, value: string) {
    rawSet.call(this, key, value);
    if (this !== localStorage || applyingRemote || !active) return;
    if (key === K_CREDIT) scheduleVoucherPush('IN');
    else if (key === K_DEBIT) scheduleVoucherPush('OUT');
    else if (KV_MAP[key]) scheduleKvPush(key);
  };
  Storage.prototype.removeItem = function (key: string) {
    rawRemove.call(this, key);
    if (this !== localStorage || applyingRemote || !active) return;
    if (KV_MAP[key]) scheduleKvPush(key, true);
  };
}

/* ───────────────────────── Realtime ───────────────────────── */

let channel: RealtimeChannel | null = null;
function subscribe() {
  if (!supabase || channel) return;
  emitStatus('connecting');
  channel = supabase
    .channel('raviraja-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, (p) => { applyVoucherEvent(p); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_kv' }, (p) => { applyKvEvent(p); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, async () => { try { await pullUsers(); emitChange(); } catch { /* ignore */ } })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, async () => { try { await pullPerms(); emitChange(); } catch { /* ignore */ } })
    .subscribe((status) => {
      emitStatus(status === 'SUBSCRIBED' ? 'live' : status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'offline' : 'connecting');
    });
}

export function stopCloud() {
  active = false;
  if (channel && supabase) supabase.removeChannel(channel);
  channel = null;
  Object.values(voucherTimers).forEach((t) => clearTimeout(t));
  kvTimers.forEach((t) => clearTimeout(t));
  emitStatus('offline');
}

/* ───────────────────────── Sign in / session ───────────────────────── */

export type CloudSessionResult =
  | { status: 'signed-out' }
  | { status: 'denied'; email: string }
  | { status: 'error'; message: string }
  | { status: 'ok'; user: AppUser };

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
}

export async function signOutCloud(): Promise<void> {
  stopCloud();
  try { await supabase?.auth.signOut(); } catch { /* ignore */ }
  try { sessionStorage.removeItem(K_SESSION); localStorage.removeItem(K_SESSION); } catch { /* ignore */ }
}

/** Checks the Google session, confirms the Admin has granted this Gmail access, then loads everything and goes live. */
export async function startCloudSession(): Promise<CloudSessionResult> {
  if (!supabase) return { status: 'signed-out' };
  try {
    const { data: sess } = await supabase.auth.getSession();
    const email = sess.session?.user?.email?.toLowerCase();
    if (!email) return { status: 'signed-out' };
    myEmail = email;

    const { data: own, error } = await supabase.from('app_users').select('*').ilike('email', email).maybeSingle();
    if (error) throw error;
    if (!own || !own.active) return { status: 'denied', email };

    installWriteHook();
    active = false; // do not echo the initial pull back to the server
    await Promise.all([pullUsers(), pullPerms(), pullVouchers()]);
    await pullKv(true);
    active = true;
    subscribe();

    const user = toAppUser(own);
    try { sessionStorage.setItem(K_SESSION, user.id); } catch { /* ignore */ }
    return { status: 'ok', user };
  } catch (e: any) {
    return { status: 'error', message: e?.message || 'Could not reach the cloud database.' };
  }
}
