import React, { useEffect, useState } from 'react';
import { Mail, Smartphone, Lock, Eye, EyeOff, LogIn, ShieldCheck, Loader2 } from 'lucide-react';
import { AppUser, brandStore, ensureSeedUsers, login } from '../../utils/accessControl';
import { signInWithGoogle, signOutCloud } from '../../utils/cloudSync';

interface Props {
  onLoggedIn: (user: AppUser) => void;
  /** Present when the app is connected to the cloud (Supabase): sign in with Google instead of local accounts. */
  cloud?: { status: 'signed-out' | 'denied' | 'error'; email?: string; message?: string };
}

export const LoginScreen: React.FC<Props> = ({ onLoggedIn, cloud }) => {
  const [gBusy, setGBusy] = useState(false);
  const [gError, setGError] = useState('');
  const brand = brandStore.get();
  const [method, setMethod] = useState<'email' | 'mobile'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { ensureSeedUsers(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await login(method, identifier, password);
    setBusy(false);
    if (res.ok === false) setError(res.error);
    else onLoggedIn(res.user);
  };

  const demo: Array<[string, string, string, string]> = [
    ['Admin', 'admin@raviraja.com', '9876500001', 'admin@123'],
    ['Manager', 'manager@raviraja.com', '9876500003', 'manager@123'],
    ['Staff', 'staff@raviraja.com', '9876500002', 'staff@123'],
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="flex h-1.5"><div className="w-[62%] bg-emerald-500" /><div className="w-[38%] bg-blue-600" /></div>
          <div className="bg-slate-900 px-6 py-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden p-1.5 shrink-0">
              {brand.logoImage ? <img src={brand.logoImage} alt="" className="max-h-full max-w-full object-contain" /> : <span className="font-black text-slate-900 text-lg">{brand.logoText}</span>}
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold tracking-tight text-white truncate">{brand.appName}</p>
              <p className="text-[11px] text-slate-400 truncate">{brand.subtitle}</p>
            </div>
          </div>

          {cloud ? (
            <div className="p-6 space-y-5">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Sign in</h1>
                <p className="text-xs text-slate-500 mt-0.5">Use your Google (Gmail) account. Your role and access are loaded automatically.</p>
              </div>

              {cloud.status === 'denied' && (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <p className="font-extrabold">Access not granted</p>
                  <p className="mt-1 font-medium">
                    {cloud.email ? <><b>{cloud.email}</b> has not been added yet.</> : 'Your access was removed.'} Ask your Admin to add this Gmail address in <b>Roles & Access</b>, then sign in again.
                  </p>
                </div>
              )}
              {cloud.status === 'error' && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{cloud.message}</div>}
              {gError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{gError}</div>}

              <button
                type="button"
                disabled={gBusy}
                onClick={async () => {
                  setGBusy(true);
                  setGError('');
                  try {
                    if (cloud.status === 'denied') await signOutCloud();
                    await signInWithGoogle();
                  } catch (e: any) {
                    setGError(e?.message || 'Google sign-in could not start.');
                    setGBusy(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60"
              >
                {gBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/>
                    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"/>
                    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
                  </svg>
                )}
                {cloud.status === 'denied' ? 'Try a different Google account' : 'Continue with Google'}
              </button>
              <p className="text-center text-[11px] text-slate-400">Only Gmail addresses added by an Admin can enter.</p>
            </div>
          ) : (
          <form onSubmit={submit} className="p-6 space-y-5">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Sign in</h1>
              <p className="text-xs text-slate-500 mt-0.5">Use your registered email or mobile number.</p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {([['email', 'Email', Mail], ['mobile', 'Mobile', Smartphone]] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setMethod(id); setIdentifier(''); setError(''); }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${method === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                {method === 'email' ? 'Email address' : 'Mobile number'}
              </label>
              <div className="relative">
                {method === 'email' ? <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /> : <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">+91</span>}
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  inputMode={method === 'email' ? 'email' : 'numeric'}
                  autoComplete={method === 'email' ? 'username' : 'tel'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={method === 'email' ? 'name@company.com' : '98765 43210'}
                  className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${method === 'email' ? 'pl-10' : 'pl-12'}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-2 top-1.5 p-1.5 text-slate-400 hover:text-slate-700">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign in
            </button>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Demo accounts (tap to fill)
              </p>
              <div className="space-y-1.5">
                {demo.map(([role, email, mobile, pw]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setIdentifier(method === 'email' ? email : mobile); setPassword(pw); setError(''); }}
                    className="w-full flex items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-[11px] ring-1 ring-slate-200 hover:ring-indigo-300"
                  >
                    <span className="font-bold text-slate-800">{role}</span>
                    <span className="text-slate-500">{method === 'email' ? email : mobile} · {pw}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-400">Change these passwords in Roles & Access after first login.</p>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};
