import { jsPDF } from 'jspdf';
import { CreditVoucher, DebitVoucher, InVoucher } from '../types/voucher';
import { formatIndianCurrency } from './numberToWordsIndian';

export function generateVoucherPdf(voucher: InVoucher): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // Background frame
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.4);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin * 2) + 8);

  // Primary Header
  doc.setFillColor(15, 30, 65); // Deep Corporate Navy
  doc.rect(margin, margin, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('RAVIRAJA INDUSTRIES PRIVATE LIMITED', margin + 6, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(215, 225, 245);
  doc.text('Regd. Office: Plot No. 44 & 45, Phase III, IDA Jeedimetla, Hyderabad - 500055, Telangana, India', margin + 6, margin + 13);
  doc.text('CIN: U28112TG2015PTC099412 | GSTIN: 36AABCR1234F1Z8 | PAN: AABCR1234F', margin + 6, margin + 17.5);
  doc.text('Phone: +91 40 2309 8811 | Email: accounts@ravirajaindustries.com | Web: www.ravirajaindustries.com', margin + 6, margin + 21.5);

  let curY = margin + 28;

  const isOut = voucher.voucherType === 'OUT(Debit)';
  const vTypeLabel = isOut ? 'OUT(Debit)' : 'IN(Credit)';

  // Title Ribbon
  doc.setFillColor(isOut ? 254 : 238, isOut ? 242 : 242, isOut ? 242 : 255);
  doc.setDrawColor(isOut ? 225 : 79, isOut ? 29 : 70, isOut ? 72 : 229);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(isOut ? 159 : 49, isOut ? 18 : 46, isOut ? 57 : 129);
  doc.text(isOut ? 'OUT VOUCHER (DEBIT / PAYMENT VOUCHER)' : 'IN VOUCHER (CREDIT / RECEIPT VOUCHER)', margin + 6, curY + 6.8);

  // Status Badge
  const statusX = pageWidth - margin - 35;
  doc.setFillColor(220, 252, 231); // green
  doc.setDrawColor(22, 163, 74);
  doc.roundedRect(statusX, curY + 1.8, 30, 6.5, 1, 1, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text(voucher.approvalStatus.toUpperCase(), statusX + 4, curY + 6);

  curY += 14;

  // Top Metadata Grid
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, curY, contentWidth, 24, 'FD');

  // Vertical split
  const midX = margin + (contentWidth / 2);
  doc.line(midX, curY, midX, curY + 24);

  doc.setFontSize(8.5);
  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Voucher Number:', margin + 4, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(voucher.voucherNo || (isOut ? 'OUT-XXXX' : 'IN-XXXX'), margin + 35, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Accountant Name:', margin + 4, curY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(voucher.accountantName || '-', margin + 35, curY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Voucher Date:', margin + 4, curY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(voucher.date || '', margin + 35, curY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Voucher Type:', margin + 4, curY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isOut ? 225 : 16, isOut ? 29 : 185, isOut ? 72 : 129);
  doc.text(vTypeLabel, margin + 35, curY + 21);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Reference Date:', midX + 4, curY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(voucher.referenceDate || 'N/A', midX + 38, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('GSTIN:', midX + 4, curY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(isOut ? (voucher as DebitVoucher).supplierGstin || '-' : (voucher as CreditVoucher).customerGstin || '-', midX + 38, curY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(isOut ? 'Payment Mode:' : 'Receipt Mode:', midX + 4, curY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(isOut ? (voucher as DebitVoucher).paymentMode : (voucher as CreditVoucher).receiptMode, midX + 38, curY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Person Name:', midX + 4, curY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(voucher.personName || '-', midX + 38, curY + 21);

  curY += 28;

  // Main Details Table
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, curY, contentWidth, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, curY + 8, margin + contentWidth, curY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('PARTICULARS & TRANSACTION SPECIFICATION', margin + 4, curY + 5.5);

  curY += 8;

  // Helper row drawer
  const drawRow = (label: string, value: string, rowHeight = 11, isHighlight = false) => {
    doc.setFillColor(isHighlight ? 248 : 255, isHighlight ? 250 : 255, isHighlight ? 252 : 255);
    doc.rect(margin, curY, contentWidth, rowHeight, 'FD');
    doc.line(margin + 45, curY, margin + 45, curY + rowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 4, curY + 6);

    doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    doc.setTextColor(15, 23, 42);
    const splitVal = doc.splitTextToSize(value || '-', contentWidth - 52);
    doc.text(splitVal, margin + 49, curY + 6);

    curY += rowHeight;
  };

  if (isOut) {
    const dv = voucher as DebitVoucher;
    drawRow('Supplier Name :-', dv.supplierName, 10, true);
    drawRow('Expenses Bill', dv.originalPurchaseBill || '-', 10);
    drawRow('Expenses Bill Date', dv.purchaseBillDate || '-', 10);
    drawRow('Note / Reason', voucher.noteReason || '-', 10);
  } else {
    const cv = voucher as CreditVoucher;
    drawRow('Customer Name :-', cv.customerName, 10, true);
    drawRow('Reference Details', cv.referenceDetails || '-', 10);
    drawRow('Note / Reason', voucher.noteReason || '-', 10);
  }

  drawRow('Purpose / Desc', voucher.description || 'Voucher recorded per accounts compliance', 11);
  if (voucher.remarks) {
    drawRow('Remarks', voucher.remarks, 12);
  }

  curY += 3;

  // Amount in Numbers & Words Box
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(16, 185, 129); // Emerald-500
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, curY, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text(isOut ? 'TOTAL AMOUNT PAID:' : 'TOTAL AMOUNT RECEIVED:', margin + 5, curY + 7);


  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87);
  doc.text(formatIndianCurrency(voucher.amount), margin + 55, curY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text('Amount in Words:', margin + 5, curY + 16);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const wordsLines = doc.splitTextToSize(voucher.amountInWords || 'Zero Rupees Only', contentWidth - 45);
  doc.text(wordsLines, margin + 35, curY + 16);

  curY += 28;

  // Supporting Attachments Summary
  if (voucher.attachments && voucher.attachments.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, curY, contentWidth, 14, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('ATTACHED DOCUMENTS:', margin + 4, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const docsList = voucher.attachments.map(a => `[${a.type}] ${a.name}`).join('  |  ');
    const splitDocs = doc.splitTextToSize(docsList, contentWidth - 8);
    doc.text(splitDocs, margin + 4, curY + 10);

    curY += 18;
  } else {
    curY += 4;
  }

  // Signatures Section (3 columns)
  const sigBoxWidth = contentWidth / 3;
  const sigBoxHeight = 32;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  // Column 1: Prepared By
  doc.rect(margin, curY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED BY', margin + 4, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(voucher.createdBy || 'Accounts Staff', margin + 4, curY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${voucher.date}`, margin + 4, curY + 27);

  // Column 2: Approved By
  doc.rect(margin + sigBoxWidth, curY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('APPROVED BY', margin + sigBoxWidth + 4, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(voucher.approvedBy || 'Accounts Manager', margin + sigBoxWidth + 4, curY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory', margin + sigBoxWidth + 4, curY + 27);

  // Column 3: Received / Cashier
  doc.rect(margin + (sigBoxWidth * 2), curY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(isOut ? "CASHIER / PAYEE" : "RECEIVED BY", margin + (sigBoxWidth * 2) + 4, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const signName = isOut ? (voucher as DebitVoucher).cashierName : (voucher as CreditVoucher).receivedBy;
  doc.text(signName || '-', margin + (sigBoxWidth * 2) + 4, curY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Acknowledgement Signature', margin + (sigBoxWidth * 2) + 4, curY + 27);

  // Footer notes & Computer generated disclaimer
  const footerY = pageHeight - margin - 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`This is an authentic system-generated ${isOut ? 'Debit' : 'Credit'} Voucher recorded within the Raviraja ERP Module.`, margin, footerY);
  doc.text(`Printed: ${new Date().toLocaleString()} | User: ${voucher.createdBy || 'Staff'}`, pageWidth - margin - 75, footerY);

  // Save PDF
  doc.save(`${voucher.voucherNo || 'Voucher'}_Raviraja_Industries.pdf`);
}

