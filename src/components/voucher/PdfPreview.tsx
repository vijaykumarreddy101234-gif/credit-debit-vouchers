import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PdfPreviewProps {
  /** Raw PDF bytes. Re-renders whenever this changes. */
  data: ArrayBuffer | null;
}

/**
 * Renders every page of a PDF onto canvases that fit the container width.
 * Works the same on phones, tablets and laptops (no reliance on browser PDF plugins).
 */
export const PdfPreview: React.FC<PdfPreviewProps> = ({ data }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !width || !hostRef.current) return;
    let cancelled = false;
    const host = hostRef.current;
    setStatus('loading');

    (async () => {
      try {
        const pdfjs: any = await import('pdfjs-dist');
        const workerUrl: any = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
        const frag = document.createDocumentFragment();
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = width / base.width;
          const viewport = page.getViewport({ scale: scale * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${width}px`;
          canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
          canvas.className = 'block bg-white rounded-md shadow-[0_8px_30px_rgba(15,23,42,0.18)] ring-1 ring-slate-200';
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
          frag.appendChild(canvas);
          if (cancelled) return;
        }
        if (cancelled) return;
        host.replaceChildren(frag);
        setStatus('idle');
      } catch (e) {
        console.error('PDF preview failed', e);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, width]);

  return (
    <div className="relative w-full">
      <div ref={hostRef} className="w-full flex flex-col gap-4" />
      {status === 'loading' && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating preview…
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          Preview could not be rendered. You can still use Download PDF.
        </div>
      )}
    </div>
  );
};
