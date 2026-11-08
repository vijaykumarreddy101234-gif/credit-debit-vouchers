import type { jsPDF } from 'jspdf';
import {
  INTER_REGULAR_B64,
  INTER_SEMIBOLD_B64,
  INTER_BOLD_B64,
  INTER_ITALIC_B64,
} from './pdfFontData';

export const PDF_FONT = 'Inter';

/** Registers the embedded Inter family so ₹ and all Indian-business text render correctly. */
export function registerPdfFonts(doc: jsPDF): void {
  const add = (file: string, data: string, style: string) => {
    doc.addFileToVFS(file, data);
    doc.addFont(file, PDF_FONT, style);
  };
  add('Inter-Regular.ttf', INTER_REGULAR_B64, 'normal');
  add('Inter-SemiBold.ttf', INTER_SEMIBOLD_B64, 'semibold');
  add('Inter-Bold.ttf', INTER_BOLD_B64, 'bold');
  add('Inter-Italic.ttf', INTER_ITALIC_B64, 'italic');
}
