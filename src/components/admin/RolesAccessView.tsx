import React, { useState } from 'react';
import { Users, ShieldCheck, Plus, Pencil, Trash2, X, Mail, Smartphone, Save, RotateCcw, Check, KeyRound } from 'lucide-react';
import {
  AppUser, LoginMethod, PERMISSION_GROUPS, PermissionKey, ROLES, RolePermissionMap,
  accessStore, hashPassword, normalizeMobile,
} from '../../utils/accessControl';
import { UserRole } from '../../types/voucher';
import { cloudEnabled } from '../../utils/cloudSync';

interface Props {
  currentUserId: string;
  onPermissionsChanged: () => void;
  onNotify: (msg: string) => void;
}

const ROLE_STYLE: Record<UserRole, { chip: string; dot: string; short: string }> = {
  Admin: { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', short: 'Admin' },
  'Authorized Accounts Manager': { chip: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500', short: 'Manager' },
  'Accounts Staff': { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', short: 'Staff' },
};

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';
const labelCls = 'mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500';

type Draft = Omit<AppUser, 'passwordHash'> & { password: string };
const blank = (): Draft => ({
  id: '', name: '', role: 'Accounts Staff', designation: '', department: 'Finance & Accounts',
  email: '', mobile: '', loginMethod: 'both', active: true, password: '',
});

export const RolesAccessView: React.FC<Props> = ({ currentUserId, onPermissionsChanged, onNotify }) => {
  const [tab, setTab] = useState<'users' | 'permissions'>('users');
  const [users, setUsers] = useState<AppUser[]>(() => accessStore.getUsers());
  const [perms, setPerms] = useState<RolePermissionMap>(() => accessStore.getPermissions());
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');

  const persistUsers = (next: AppUser[]) => { setUsers(next); accessStore.saveUsers(next); };

  const openNew = () => { setDraft(blank()); setError(''); };
  const openEdit = (u: AppUser) => { const { passwordHash, ...rest } = u; setDraft({ ...rest, password: '' }); setError(''); };

  const saveDraft = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();
    const mobile = normalizeMobile(draft.mobile);
    if (!name) return setError('Enter the user name.');
    const needEmail = cloudEnabled || draft.loginMethod !== 'mobile';
    const needMobile = !cloudEnabled && draft.loginMethod !== 'email';
    if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email address is not valid.');
    if (needMobile && mobile.length !== 10) return setError('Enter a 10-digit mobile number.');
    if (draft.mobile && mobile.length !== 10) return setError('Mobile number must be 10 digits.');
    const clash = users.find((u) => u.id !== draft.id && ((email && u.email.toLowerCase() === email) || (mobile && normalizeMobile(u.mobile) === mobile)));
    if (clash) return setError(`Email or mobile is already used by ${clash.name}.`);
    if (!cloudEnabled && !draft.id && draft.password.length < 6) return setError('Set a password of at least 6 characters.');
    if (!cloudEnabled && draft.password && draft.password.length < 6) return setError('Password must be at least 6 characters.');

    // Keep at least one active Admin
    const after = draft.id ? users.map((u) => (u.id === draft.id ? { ...u, role: draft.role, active: draft.active } : u)) : users;
    if (!after.some((u) => u.role === 'Admin' && u.active)) return setError('At least one active Admin is required.');
    if (draft.id === currentUserId && !draft.active) return setError('You cannot disable your own account.');

    const { password, ...rest } = draft;
    if (draft.id) {
      const existing = users.find((u) => u.id === draft.id)!;
      const passwordHash = !cloudEnabled && password ? await hashPassword(password) : existing.passwordHash;
      persistUsers(users.map((u) => (u.id === draft.id ? { ...existing, ...rest, name, email, mobile, passwordHash } : u)));
      onNotify(`Updated ${name}.`);
    } else {
      const id = cloudEnabled ? crypto.randomUUID() : `USR-${String(Date.now()).slice(-6)}`;
      persistUsers([...users, { ...rest, id, name, email, mobile, passwordHash: cloudEnabled ? '' : await hashPassword(password) }]);
      onNotify(`Added ${name} as ${draft.role}.`);
    }
    setDraft(null);
    onPermissionsChanged();
  };

  const removeUser = (u: AppUser) => {
    if (u.id === currentUserId) return onNotify('You cannot delete your own account.');
    if (u.role === 'Admin' && users.filter((x) => x.role === 'Admin' && x.active).length <= 1) return onNotify('At least one active Admin is required.');
    if (!window.confirm(`Delete ${u.name}? They will no longer be able to sign in.`)) return;
    persistUsers(users.filter((x) => x.id !== u.id));
    onNotify(`Removed ${u.name}.`);
  };

  const toggleActive = (u: AppUser) => {
    if (u.id === currentUserId) return onNotify('You cannot disable your own account.');
    if (u.role === 'Admin' && u.active && users.filter((x) => x.role === 'Admin' && x.active).length <= 1) return onNotify('At least one active Admin is required.');
    persistUsers(users.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)));
  };

  const togglePerm = (role: UserRole, key: PermissionKey) => {
    if (role === 'Admin' && key === 'roles.manage') return;
    setPerms((prev) => {
      const has = prev[role].includes(key);
      return { ...prev, [role]: has ? prev[role].filter((k) => k !== key) : [...prev[role], key] };
    });
    setDirty(true);
  };

  const savePerms = () => {
    accessStore.savePermissions(perms);
    setDirty(false);
    onPermissionsChanged();
    onNotify('Role permissions saved.');
  };

  const resetPerms = () => {
    accessStore.resetPermissions();
    setPerms(accessStore.getPermissions());
    setDirty(false);
    onPermissionsChanged();
    onNotify('Permissions reset to defaults.');
  };

  const methodLabel = (m: LoginMethod) => (m === 'both' ? 'Email or Mobile' : m === 'email' ? 'Email only' : 'Mobile only');

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 pb-10">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_-18px_rgba(15,23,42,0.25)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <div className="flex flex-col gap-3 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">Administration</p>
            <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Roles & Access</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">{cloudEnabled ? 'Add Gmail addresses, give each person a role and control what every role can do. Changes sync live to everyone.' : 'Create users, choose how they sign in (email or mobile) and control what each role can do.'}</p>
          </div>
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 self-start">
            {([['users', 'Users', Users], ['permissions', 'Permissions', ShieldCheck]] as const).map(([id, label, Icon]) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${tab === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'users' && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-600">{users.length} user{users.length === 1 ? '' : 's'}</p>
            <button type="button" onClick={openNew} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98]">
              <Plus className="h-3.5 w-3.5" /> Add user
            </button>
          </div>

          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">
                      {u.name} {u.id === currentUserId && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">You</span>}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{u.designation || '—'}</p>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2">
                  <span className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />{u.email || '—'}</span>
                  <span className="flex items-center gap-1.5 truncate"><Smartphone className="h-3.5 w-3.5 shrink-0 text-slate-400" />{u.mobile ? `+91 ${u.mobile}` : '—'}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:w-[330px] lg:justify-end">
                  <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${ROLE_STYLE[u.role].chip}`}>{ROLE_STYLE[u.role].short}</span>
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-bold text-slate-600"><KeyRound className="h-3 w-3" />{cloudEnabled ? 'Google sign-in' : methodLabel(u.loginMethod)}</span>
                  <button type="button" onClick={() => toggleActive(u)} aria-label={u.active ? 'Disable user' : 'Enable user'}
                    className={`relative h-6 w-11 rounded-full transition ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${u.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                  <button type="button" onClick={() => openEdit(u)} aria-label="Edit user" className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeUser(u)} aria-label="Delete user" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <p className="text-xs font-medium text-slate-500">Tick what each role is allowed to do, then save.</p>
            <div className="flex gap-2">
              <button type="button" onClick={resetPerms} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" /> Defaults</button>
              <button type="button" onClick={savePerms} disabled={!dirty} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"><Save className="h-3.5 w-3.5" /> Save permissions</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${ROLE_STYLE[r].chip}`}>{ROLE_STYLE[r].short}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map((g) => (
                  <React.Fragment key={g.title}>
                    <tr><td colSpan={4} className="bg-indigo-50/70 px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-700">{g.title}</td></tr>
                    {g.items.map((it) => (
                      <tr key={it.key} className="border-b border-slate-100">
                        <td className="sticky left-0 bg-white px-4 py-2.5 font-semibold text-slate-700">{it.label}</td>
                        {ROLES.map((r) => {
                          const on = perms[r].includes(it.key);
                          const locked = r === 'Admin' && it.key === 'roles.manage';
                          return (
                            <td key={r} className="px-3 py-2.5 text-center">
                              <button type="button" disabled={locked} onClick={() => togglePerm(r, it.key)} aria-label={`${it.label} for ${r}`} aria-pressed={on}
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent hover:border-indigo-400'} ${locked ? 'opacity-50' : ''}`}>
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-xs sm:items-center sm:p-4" onClick={() => setDraft(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h3 className="text-base font-extrabold text-slate-900">{draft.id ? 'Edit user' : 'Add user'}</h3>
              <button type="button" aria-label="Close" onClick={() => setDraft(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Full name</label><input className={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div><label className={labelCls}>Designation</label><input className={field} value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} /></div>
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ROLES.map((r) => (
                    <button key={r} type="button" onClick={() => setDraft({ ...draft, role: r })}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left text-xs font-bold transition ${draft.role === r ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${ROLE_STYLE[r].dot}`} />{ROLE_STYLE[r].short}
                    </button>
                  ))}
                </div>
              </div>
              {!cloudEnabled && (<div>
                <label className={labelCls}>Login with</label>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  {([['email', 'Email'], ['mobile', 'Mobile'], ['both', 'Both']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setDraft({ ...draft, loginMethod: id })}
                      className={`rounded-lg py-2 text-xs font-bold transition ${draft.loginMethod === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{label}</button>
                  ))}
                </div>
              </div>)}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>{cloudEnabled ? 'Gmail address' : 'Email'} {!cloudEnabled && draft.loginMethod === 'mobile' && <span className="font-medium normal-case text-slate-400">(optional)</span>}</label>
                  <input type="email" className={field} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@company.com" /></div>
                <div><label className={labelCls}>Mobile {(cloudEnabled || draft.loginMethod === 'email') && <span className="font-medium normal-case text-slate-400">(optional)</span>}</label>
                  <input type="tel" inputMode="numeric" className={field} value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} placeholder="10-digit number" /></div>
              </div>
              {!cloudEnabled && (<div>
                <label className={labelCls}>Password {draft.id && <span className="font-medium normal-case text-slate-400">(leave blank to keep current)</span>}</label>
                <input type="password" autoComplete="new-password" className={field} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
              </div>)}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-4 w-4 rounded accent-emerald-600" /> Account active
              </label>
              {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
              <button type="button" onClick={() => setDraft(null)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={saveDraft} className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800">Save user</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
