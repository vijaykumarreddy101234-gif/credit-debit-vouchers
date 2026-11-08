import { jsPDF } from 'jspdf';
import { CreditVoucher, DebitVoucher, InVoucher } from '../types/voucher';
import { formatIndianCurrency } from './numberToWordsIndian';
import { voucherStorage } from './voucherStorage';
import { PDF_FONT, registerPdfFonts } from './pdfFonts';

export interface PdfBrandingOptions {
  companyName?: string;
  companySubtitle?: string;
  companyAddress?: string;
  cin?: string;
  gstin?: string;
  pan?: string;
  leftLogoText?: string;
  leftLogoImage?: string;
  rightBadgeTop?: string;
  rightBadgeCenter?: string;
  rightBadgeBottom?: string;
  terms?: string[];
  footerDisclaimer?: string;
  headerTheme?: 'navy' | 'slate' | 'emerald' | 'dark';
  rightLogoImage?: string;
}

type RGB = [number, number, number];

const INK: RGB = [15, 23, 42];
const MUTED: RGB = [100, 116, 139];
const SOFT: RGB = [148, 163, 184];
const LINE: RGB = [226, 232, 240];
const PANEL: RGB = [248, 250, 252];

const THEMES: Record<string, RGB> = {
  navy: [15, 32, 68],
  slate: [30, 41, 59],
  emerald: [6, 78, 59],
  dark: [10, 10, 12],
};

// Accent colours per voucher direction
const IN_ACCENT: RGB = [5, 150, 105]; // emerald
const IN_TINT: RGB = [236, 253, 245];
const OUT_ACCENT: RGB = [225, 29, 72]; // rose
const OUT_TINT: RGB = [255, 241, 242];

// Extra palette so the voucher reads colourful but professional
const BLUE: RGB = [37, 99, 235];
const BLUE_TINT: RGB = [239, 246, 255];
const VIOLET: RGB = [124, 58, 237];
const VIOLET_TINT: RGB = [245, 243, 255];
const AMBER: RGB = [217, 119, 6];
const AMBER_TINT: RGB = [255, 251, 235];
const TEAL: RGB = [13, 148, 136];
const TEAL_TINT: RGB = [240, 253, 250];
const ORANGE: RGB = [234, 88, 12];

const dataUrlFormat = (dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
  const head = dataUrl.slice(0, 40).toLowerCase();
  if (head.includes('image/png')) return 'PNG';
  if (head.includes('image/webp')) return 'WEBP';
  return 'JPEG';
};

/** Builds the voucher PDF document without saving it (used for both download and live preview). */
export function buildVoucherPdf(
  voucher: InVoucher,
  includeAttachments: boolean = false,
  customOptions?: PdfBrandingOptions
): { doc: jsPDF; fileName: string } {
  const stored = voucherStorage.getPdfBrandingSettings();
  const branding: any = {
    ...stored,
    ...customOptions,
    terms: customOptions?.terms?.length
      ? customOptions.terms
      : stored.terms?.length
      ? stored.terms
      : [
          '1. Subject to Hyderabad jurisdiction.',
          '2. Payment acknowledged subject to realization of cheque / RTGS.',
          '3. This voucher is an authentic ERP instrument valid with authorised managerial signature and stamp.',
        ],
  };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  registerPdfFonts(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const CW = pageW - M * 2;
  const FOOTER_H = 14;
  const bottomLimit = pageH - M - FOOTER_H;

  const isOut = voucher.voucherType === 'OUT(Debit)';
  const accent = isOut ? OUT_ACCENT : IN_ACCENT;
  const tint = isOut ? OUT_TINT : IN_TINT;
  const headerColor = THEMES[branding.headerTheme] || THEMES.navy;

  const setFill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const setText = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: 'normal' | 'semibold' | 'bold' | 'italic', size: number, color: RGB = INK) => {
    doc.setFont(PDF_FONT, style);
    doc.setFontSize(size);
    setText(color);
  };

  /** Fit an image inside a box while keeping its aspect ratio. */
  const addImageContain = (
    dataUrl: string,
    x: number,
    y: number,
    w: number,
    h: number,
    align: 'left' | 'center' | 'right' = 'center'
  ): boolean => {
    try {
      const fmt = dataUrlFormat(dataUrl);
      const props = doc.getImageProperties(dataUrl);
      const ratio = props.width / props.height;
      let dw = w;
      let dh = w / ratio;
      if (dh > h) {
        dh = h;
        dw = h * ratio;
      }
      const dx = align === 'left' ? x : align === 'right' ? x + w - dw : x + (w - dw) / 2;
      const dy = y + (h - dh) / 2;
      doc.addImage(dataUrl, fmt, dx, dy, dw, dh, undefined, 'FAST');
      return true;
    } catch {
      return false;
    }
  };

  // ───────────────────────── 1. Header band ─────────────────────────
  const bandH = 34;
  setFill(headerColor);
  doc.rect(0, 0, pageW, bandH, 'F');
  // accent hairline under band
  setFill(accent);
  doc.rect(0, bandH, pageW * 0.62, 1.4, 'F');
  setFill(isOut ? ORANGE : BLUE);
  doc.rect(pageW * 0.62, bandH, pageW * 0.38, 1.4, 'F');

  // Logo tile (white rounded square so any logo reads cleanly on the dark band)
  const logoTile = 22;
  const logoX = M + (branding.leftLogoOffsetX || 0);
  const logoY = (bandH - logoTile) / 2 + (branding.leftLogoOffsetY || 0);
  setFill([255, 255, 255]);
  doc.roundedRect(logoX, logoY, logoTile, logoTile, 2.5, 2.5, 'F');
  const logoDrawn = branding.leftLogoImage
    ? addImageContain(branding.leftLogoImage, logoX + 1.5, logoY + 1.5, logoTile - 3, logoTile - 3)
    : false;
  if (!logoDrawn) {
    font('bold', 13, headerColor);
    const t = (branding.leftLogoText || 'RIL').toString().slice(0, 4);
    doc.text(t, logoX + logoTile / 2, logoY + logoTile / 2 + 1.6, { align: 'center' });
  }

  // Right block: voucher badge (kept inside its own column so nothing can overlap)
  const rightW = 46;
  const rightX = pageW - M - rightW;
  const badgeText = customOptions?.rightBadgeCenter || (isOut ? 'DEBIT' : 'CREDIT');
  const badgeTop = customOptions?.rightBadgeTop || branding.rightSealTitle || 'ERP VERIFIED';

  if (branding.rightLogoImage) {
    addImageContain(branding.rightLogoImage, rightX, 6, rightW, bandH - 12, 'right');
  } else {
    font('semibold', 6.3, [186, 200, 224]);
    doc.text(String(badgeTop).toUpperCase(), rightX + rightW, 10.5, { align: 'right', charSpace: 0.4 });
    // pill
    const pillW = 30;
    const pillH = 8.4;
    const pillX = rightX + rightW - pillW;
    setFill(accent);
    doc.roundedRect(pillX, 13.2, pillW, pillH, pillH / 2, pillH / 2, 'F');
    font('bold', 8.4, [255, 255, 255]);
    doc.text(String(badgeText).toUpperCase(), pillX + pillW / 2, 13.2 + pillH / 2 + 1.1, { align: 'center', charSpace: 0.6 });
    font('normal', 6.3, [186, 200, 224]);
    doc.text(customOptions?.rightBadgeBottom || 'Raviraja CRM', rightX + rightW, 26.5, { align: 'right' });
  }

  // Centre text column
  const textX = logoX + logoTile + 6;
  const textW = rightX - textX - 4;
  const compName = String(branding.companyName || 'RAVIRAJA INDUSTRIES PRIVATE LIMITED');
  let nameSize = 12.5;
  font('bold', nameSize, [255, 255, 255]);
  while (doc.getTextWidth(compName) > textW && nameSize > 7.5) {
    nameSize -= 0.5;
    doc.setFontSize(nameSize);
  }
  let ty = 10.2;
  doc.text(compName, textX, ty);

  ty += 4.6;
  font('semibold', 6.9, [203, 213, 225]);
  const subtitle = String(branding.companySubtitle || 'Manufacturers & Suppliers of Heavy Engineering & Industrial Equipment');
  (doc.splitTextToSize(subtitle, textW) as string[]).slice(0, 2).forEach((l) => {
    doc.text(l, textX, ty);
    ty += 3.3;
  });

  font('normal', 6.3, [186, 200, 224]);
  const address = String(branding.companyAddress || '');
  (doc.splitTextToSize(address, textW) as string[]).slice(0, 2).forEach((l) => {
    doc.text(l, textX, ty);
    ty += 3.0;
  });

  font('semibold', 6.3, [165, 243, 252]);
  const ident = `CIN: ${branding.cin || '-'}   |   GSTIN: ${branding.gstin || '-'}   |   PAN: ${branding.pan || '-'}`;
  (doc.splitTextToSize(ident, textW) as string[]).slice(0, 2).forEach((l) => {
    doc.text(l, textX, ty);
    ty += 3.0;
  });

  let y = bandH + 1.2 + 7;

  // ───────────────────────── 2. Title row ─────────────────────────
  font('bold', 13, INK);
  doc.text(isOut ? 'Payment Voucher' : 'Receipt Voucher', M, y + 1);
  font('semibold', 7.2, accent);
  doc.text(isOut ? 'OUT  ·  DEBIT' : 'IN  ·  CREDIT', M, y + 5.6, { charSpace: 0.5 });

  const status = (voucher.approvalStatus || 'Approved').toString();
  const statusColors: Record<string, { fg: RGB; bg: RGB }> = {
    Approved: { fg: [4, 120, 87], bg: [209, 250, 229] },
    Pending: { fg: [180, 83, 9], bg: [254, 243, 199] },
    Rejected: { fg: [190, 18, 60], bg: [255, 228, 230] },
    Draft: { fg: [71, 85, 105], bg: [226, 232, 240] },
  };
  const sc = statusColors[status] || statusColors.Approved;
  font('bold', 7.2, sc.fg);
  const stTxt = status.toUpperCase();
  const stW = doc.getTextWidth(stTxt) + 9;
  setFill(sc.bg);
  doc.roundedRect(M + CW - stW, y - 3, stW, 7, 3.5, 3.5, 'F');
  doc.text(stTxt, M + CW - stW / 2, y + 1.5, { align: 'center', charSpace: 0.3 });

  y += 10;

  // ───────────────────────── 3. Details card ─────────────────────────
  const refLabel = isOut ? 'Expenses Bill / Ref' : 'Invoice No / Ref';
  const refVal = isOut
    ? (voucher as DebitVoucher).originalPurchaseBill || '-'
    : voucher.invoiceNumber || (voucher as CreditVoucher).referenceDetails || '-';
  const dateLabel = isOut ? 'Expenses Date' : 'Invoice Date';
  const dateVal = isOut
    ? (voucher as DebitVoucher).purchaseBillDate || '-'
    : voucher.invoiceDate || (voucher as CreditVoucher).referenceDate || '-';
  const modeLabel = isOut ? 'Payment Mode' : 'Receipt Mode';
  const modeVal = isOut ? (voucher as DebitVoucher).paymentMode || 'Bank' : (voucher as CreditVoucher).receiptMode || 'Bank';

  const cells: Array<{ label: string; value: string; color: RGB; tintC: RGB; strong?: boolean }> = [
    { label: 'Voucher Number', value: voucher.voucherNo || (isOut ? 'OUT-0001' : 'IN-0001'), color: accent, tintC: tint, strong: true },
    { label: 'Voucher Date', value: voucher.date || '-', color: BLUE, tintC: BLUE_TINT },
    { label: modeLabel, value: String(modeVal), color: VIOLET, tintC: VIOLET_TINT },
    { label: refLabel, value: String(refVal), color: AMBER, tintC: AMBER_TINT },
    { label: dateLabel, value: String(dateVal), color: TEAL, tintC: TEAL_TINT },
    { label: 'Accountant', value: voucher.accountantName || voucher.createdBy || 'Staff Accountant', color: [71, 85, 105], tintC: PANEL },
  ];
  const cols = 3;
  const gapC = 3;
  const cellW = (CW - gapC * (cols - 1)) / cols;
  const cellH = 14;
  const rows = Math.ceil(cells.length / cols);
  cells.forEach((c, i) => {
    const cx = M + (i % cols) * (cellW + gapC);
    const cy = y + Math.floor(i / cols) * (cellH + gapC);
    setFill(c.tintC);
    doc.roundedRect(cx, cy, cellW, cellH, 2, 2, 'F');
    setFill(c.color);
    doc.roundedRect(cx, cy, 1.5, cellH, 0.7, 0.7, 'F');
    font('bold', 5.8, c.color);
    doc.text(c.label.toUpperCase(), cx + 5, cy + 5, { charSpace: 0.35 });
    font(c.strong ? 'bold' : 'semibold', 8.8, c.strong ? c.color : INK);
    doc.text((doc.splitTextToSize(c.value, cellW - 8) as string[])[0], cx + 5, cy + 10.4);
  });
  y += rows * cellH + (rows - 1) * gapC + 8;

  // ───────────────────────── page-break helper ─────────────────────────
  const newPage = () => {
    doc.addPage();
    y = M + 4;
  };
  const ensure = (h: number) => {
    if (y + h > bottomLimit) newPage();
  };

  const sectionTitle = (title: string) => {
    ensure(12);
    setFill(tint);
    doc.roundedRect(M, y - 2, CW, 7, 1.8, 1.8, 'F');
    setFill(accent);
    doc.roundedRect(M, y - 2, 2.2, 7, 1, 1, 'F');
    font('bold', 7.2, accent);
    doc.text(title.toUpperCase(), M + 5, y + 2.6, { charSpace: 0.55 });
    y += 9.5;
  };

  // ───────────────────────── 4. Particulars ─────────────────────────
  sectionTitle('Particulars & Transaction Specification');

  const labelW = 44;
  const specRow = (label: string, value: string, main = false) => {
    const lines = doc.splitTextToSize(value || '-', CW - labelW - 4) as string[];
    const h = Math.max(8.5, lines.length * 4.3 + 4.2);
    ensure(h);
    if (main) {
      setFill(BLUE_TINT);
      doc.rect(M, y, CW, h, 'F');
    }
    font('bold', 6.2, main ? BLUE : MUTED);
    doc.text(label.toUpperCase(), M + 2, y + 5.4, { charSpace: 0.3 });
    font(main ? 'bold' : 'normal', main ? 9.6 : 8.4, INK);
    doc.text(lines, M + labelW, y + 5.4, { lineHeightFactor: 1.35 });
    y += h;
    setDraw(LINE);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + CW, y);
  };

  if (isOut) {
    const dv = voucher as DebitVoucher;
    specRow('Supplier / Payee', dv.supplierName, true);
    specRow('Supplier GSTIN', dv.supplierGstin || '-');
    if (dv.supplierDetails) specRow('Category', dv.supplierDetails);
  } else {
    const cv = voucher as CreditVoucher;
    specRow('Customer / Party', cv.customerName, true);
    specRow('Customer GSTIN', cv.customerGstin || '-');
    if (cv.receiptType) specRow('Receipt Type', cv.receiptType);
  }
  specRow(isOut ? 'Payment Purpose' : 'Receipt Purpose', voucher.description || '-');
  if (voucher.noteReason) specRow('Note / Reason', voucher.noteReason);
  if (voucher.remarks) specRow('Remarks', voucher.remarks);

  y += 6;

  // ───────────────────────── 5. Itemised table ─────────────────────────
  if (voucher.items && voucher.items.length > 0) {
    sectionTitle(`Itemised Particulars (${voucher.items.length})`);

    const cNo = M + 2;
    const cDesc = M + 11;
    const cQty = M + CW - 78;
    const cRate = M + CW - 36;
    const cAmt = M + CW - 2;
    const descW = cQty - cDesc - 26;

    const header = () => {
      setFill(headerColor);
      doc.roundedRect(M, y, CW, 7.5, 1.5, 1.5, 'F');
      font('bold', 6.2, [255, 255, 255]);
      doc.text('#', cNo, y + 4.9);
      doc.text('DESCRIPTION', cDesc, y + 4.9, { charSpace: 0.3 });
      doc.text('QTY', cQty, y + 4.9, { align: 'right', charSpace: 0.3 });
      doc.text('RATE', cRate, y + 4.9, { align: 'right', charSpace: 0.3 });
      doc.text('AMOUNT', cAmt, y + 4.9, { align: 'right', charSpace: 0.3 });
      y += 7.5;
    };
    ensure(24);
    header();

    voucher.items.forEach((item, idx) => {
      const lines = doc.splitTextToSize(item.name || '-', descW) as string[];
      const h = Math.max(7.5, lines.length * 3.9 + 3.6);
      if (y + h > bottomLimit) {
        newPage();
        header();
      }
      if (idx % 2 === 1) {
        setFill(PANEL);
        doc.rect(M, y, CW, h, 'F');
      }
      font('normal', 6.8, SOFT);
      doc.text(String(idx + 1), cNo, y + 5);
      font('normal', 8, INK);
      doc.text(lines, cDesc, y + 5, { lineHeightFactor: 1.3 });
      doc.text(item.qty ? `${item.qty}${item.unit ? ' ' + item.unit : ''}` : '-', cQty, y + 5, { align: 'right' });
      doc.text(item.rate ? formatIndianCurrency(item.rate) : '-', cRate, y + 5, { align: 'right' });
      font('bold', 8, INK);
      doc.text(formatIndianCurrency(item.amount), cAmt, y + 5, { align: 'right' });
      y += h;
      setDraw(LINE);
      doc.setLineWidth(0.15);
      doc.line(M, y, M + CW, y);
    });
    y += 6;
  }

  // ───────────────────────── 6. Amount card ─────────────────────────
  const words = voucher.amountInWords || 'Zero Rupees Only';
  const wordLines = doc.splitTextToSize(words, CW - 14) as string[];
  const amtH = 29 + wordLines.length * 4.4;
  ensure(amtH + 4);
  setFill(tint);
  setDraw(accent);
  doc.setLineWidth(0.5);
  doc.roundedRect(M, y, CW, amtH, 3, 3, 'FD');

  font('bold', 6.6, accent);
  doc.text(isOut ? 'TOTAL AMOUNT PAID' : 'TOTAL AMOUNT RECEIVED', M + 7, y + 8, { charSpace: 0.6 });

  const amtNum = Number(voucher.amount || 0);
  const amtStr = `₹ ${amtNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  font('bold', 22, INK);
  doc.text(amtStr, M + 7, y + 18.5);

  font('semibold', 6.2, MUTED);
  doc.text('AMOUNT IN WORDS', M + 7, y + 24.6, { charSpace: 0.4 });
  font('italic', 8.4, INK);
  doc.text(wordLines, M + 7, y + 29, { lineHeightFactor: 1.35 });
  y += amtH + 8;

  // ───────────────────────── 7. Terms ─────────────────────────
  const terms: string[] = branding.terms || [];
  if (terms.length) {
    const termLines = terms.flatMap((t) => doc.splitTextToSize(t, CW - 8) as string[]);
    const th = 10 + termLines.length * 3.6;
    ensure(th);
    setFill(AMBER_TINT);
    setDraw([253, 230, 138]);
    doc.setLineWidth(0.25);
    doc.roundedRect(M, y, CW, th, 2, 2, 'FD');
    font('bold', 6.4, AMBER);
    doc.text('TERMS & CONDITIONS', M + 4, y + 5.2, { charSpace: 0.5 });
    font('normal', 6.8, [71, 85, 105]);
    doc.setFontSize(6.8);
    doc.text(termLines, M + 4, y + 9.6, { lineHeightFactor: 1.4 });
    y += th + 8;
  }

  // ───────────────────────── 8. Signatures ─────────────────────────
  ensure(30);
  const gap = 8;
  const sigW = (CW - gap) / 2;
  const approvedName =
    voucher.approvedBy || (voucher.approvalStatus === 'Approved' ? 'Authorised Manager' : 'Pending Verification');
  const signName = isOut ? (voucher as DebitVoucher).cashierName : (voucher as CreditVoucher).receivedBy;
  const sigs: Array<{ role: string; name: string; sub: string }> = [
    { role: 'Approved By', name: approvedName, sub: 'Authorised Signatory & Seal' },
    { role: isOut ? 'Cashier / Payee' : 'Received By', name: signName || 'Staff', sub: 'Acknowledgement Signature' },
  ];
  const sigTop = y + 14; // space above the line for a wet signature / stamp
  const sigColors: RGB[] = [accent, VIOLET];
  const sigTints: RGB[] = [tint, VIOLET_TINT];
  sigs.forEach((s, i) => {
    const sx = M + i * (sigW + gap);
    setFill(sigTints[i]);
    doc.roundedRect(sx, sigTop - 12, sigW, 31, 2, 2, 'F');
    setDraw(sigColors[i]);
    doc.setLineWidth(0.7);
    doc.line(sx + 3, sigTop, sx + sigW - 3, sigTop);
    font('bold', 6, sigColors[i]);
    doc.text(s.role.toUpperCase(), sx + 3, sigTop + 4.4, { charSpace: 0.4 });
    font('bold', 8.4, INK);
    doc.text((doc.splitTextToSize(s.name, sigW - 6) as string[])[0], sx + 3, sigTop + 9.2);
    font('normal', 6.5, SOFT);
    doc.text(s.sub, sx + 3, sigTop + 13.4);
  });
  y = sigTop + 20;

  // ───────────────────────── 9. Attachments ─────────────────────────
  const atts = includeAttachments && voucher.attachments ? voucher.attachments : [];
  atts.forEach((att, idx) => {
    doc.addPage();
    // header strip
    setFill(headerColor);
    doc.roundedRect(M, M, CW, 11, 2, 2, 'F');
    font('bold', 8.2, [255, 255, 255]);
    doc.text(`SUPPORTING DOCUMENT  ${idx + 1} / ${atts.length}`, M + 5, M + 7, { charSpace: 0.5 });
    font('normal', 7, [203, 213, 225]);
    doc.text(voucher.voucherNo || '', M + CW - 5, M + 7, { align: 'right' });

    font('semibold', 8, INK);
    doc.text(att.name || 'Attachment', M, M + 18);
    font('normal', 6.8, MUTED);
    const meta = `${att.type || 'Document'}  ·  ${(att.size / 1024).toFixed(1)} KB  ·  Uploaded ${
      att.uploadedAt ? new Date(att.uploadedAt).toLocaleString('en-IN') : 'N/A'
    }`;
    doc.text(meta, M, M + 22.5);

    const boxY = M + 27;
    const boxH = bottomLimit - boxY;
    const isImg = att.mimeType && att.mimeType.startsWith('image/') && att.dataUrl;
    let drawn = false;
    if (isImg) {
      setDraw(LINE);
      doc.setLineWidth(0.25);
      doc.roundedRect(M, boxY, CW, boxH, 2, 2, 'S');
      drawn = addImageContain(att.dataUrl, M + 3, boxY + 3, CW - 6, boxH - 6);
    }
    if (!drawn) {
      setFill(PANEL);
      setDraw(LINE);
      doc.roundedRect(M, boxY, CW, 36, 2.5, 2.5, 'FD');
      font('bold', 9.5, INK);
      doc.text(att.name || 'Electronic file', M + 8, boxY + 15);
      font('normal', 7.5, MUTED);
      doc.text('Electronic file stored in the Raviraja CRM archive (preview not available in PDF).', M + 8, boxY + 23);
    }
  });

  // ───────────────────────── 10. Footer on every page ─────────────────────────
  const total = doc.getNumberOfPages();
  const footerText = String(
    customOptions?.footerDisclaimer ||
      branding.footerText ||
      'Raviraja CRM Accounts Desk • Authenticated Voucher'
  );
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    setFill(accent);
    doc.rect(0, pageH - 2, pageW * 0.62, 2, 'F');
    setFill(isOut ? ORANGE : BLUE);
    doc.rect(pageW * 0.62, pageH - 2, pageW * 0.38, 2, 'F');
    const fy = pageH - M + 1;
    setDraw(LINE);
    doc.setLineWidth(0.25);
    doc.line(M, fy - 5, M + CW, fy - 5);
    font('normal', 6.3, SOFT);
    const left = `${footerText}  ·  ${voucher.voucherNo || ''}  ·  ID ${voucher.id}`;
    doc.text((doc.splitTextToSize(left, CW - 28) as string[])[0], M, fy - 1.2);
    font('semibold', 6.5, MUTED);
    doc.text(`Page ${p} of ${total}`, M + CW, fy - 1.2, { align: 'right' });
  }

  return { doc, fileName: `${voucher.voucherNo || 'Voucher'}_Raviraja_Industries.pdf` };
}

export function generateVoucherPdf(
  voucher: InVoucher,
  includeAttachments: boolean = false,
  customOptions?: PdfBrandingOptions
): void {
  const { doc, fileName } = buildVoucherPdf(voucher, includeAttachments, customOptions);
  savePdfFile(doc, fileName);
}

/** Saves a jsPDF document; falls back to opening it in a new tab if the browser blocks downloads. */
export function savePdfFile(doc: jsPDF, fileName: string): void {
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Some embedded / mobile browsers ignore the download attribute: open a viewer tab as a fallback
    const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (inFrame) window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    doc.save(fileName);
  }
}
