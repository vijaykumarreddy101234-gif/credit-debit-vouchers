import React, { useRef, useState } from 'react';
import { X, ImagePlus, Trash2, Save } from 'lucide-react';
import { AppBrand, DEFAULT_APP_BRAND } from '../../utils/accessControl';

interface Props {
  brand: AppBrand;
  onSave: (b: AppBrand) => void;
  onClose: () => void;
}

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';
const labelCls = 'mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500';

const toLogo = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Could not read file'));
    r.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('That file is not an image'));
      img.onload = () => {
        const ratio = Math.min(1, 480 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * ratio);
        c.height = Math.round(img.height * ratio);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  });

export const BrandModal: React.FC<Props> = ({ brand, onSave, onClose }) => {
  const [b, setB] = useState<AppBrand>(brand);
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setB({ ...b, logoImage: await toLogo(f) }); setErr(''); } catch (x: any) { setErr(x?.message || 'Could not use that image'); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white text-slate-900 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h3 className="text-base font-extrabold">App name & logo</h3>
            <p className="text-[11px] text-slate-500">Shown in the top bar, login screen and PDF header.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* live preview */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
              {b.logoImage ? <img src={b.logoImage} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-sm font-black text-slate-900">{b.logoText}</span>}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold uppercase tracking-tight">{b.appName || '—'}</p>
              <p className="truncate text-[10px] text-slate-400">{b.subtitle}</p>
            </div>
            {b.badge && <span className="ml-auto hidden rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 sm:inline">{b.badge}</span>}
          </div>

          <div>
            <label className={labelCls}>Logo</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => file.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><ImagePlus className="h-4 w-4" /> Upload logo</button>
              {b.logoImage && <button type="button" onClick={() => setB({ ...b, logoImage: '' })} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /> Remove</button>}
              <input ref={file} type="file" accept="image/*" className="hidden" onChange={pick} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2"><label className={labelCls}>App name</label><input className={field} value={b.appName} onChange={(e) => setB({ ...b, appName: e.target.value })} /></div>
            <div><label className={labelCls}>Logo initials</label><input className={field} maxLength={4} value={b.logoText} onChange={(e) => setB({ ...b, logoText: e.target.value.toUpperCase() })} /></div>
          </div>
          <div><label className={labelCls}>Company line</label><input className={field} value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} /></div>
          <div><label className={labelCls}>Badge text <span className="font-medium normal-case text-slate-400">(leave empty to hide)</span></label><input className={field} value={b.badge} onChange={(e) => setB({ ...b, badge: e.target.value.toUpperCase() })} /></div>
          {err && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{err}</div>}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={() => setB({ ...DEFAULT_APP_BRAND })} className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Reset</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="button" onClick={() => onSave(b)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"><Save className="h-3.5 w-3.5" /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};
