import { InVoucher, formatVoucherType } from '../types/voucher';

export function exportInVouchersToExcel(vouchers: InVoucher[], filename = 'Raviraja_CRM_Voucher_Register.csv') {
  if (!vouchers || vouchers.length === 0) {
    alert('No vouchers available to export.');
    return;
  }

  const headers = [
    'S.No',
    'Voucher No',
    'Voucher Type',
    'Date',
    'Accountant Name',
    'Party Name',
    'Payment Mode',
    'Reference Details',
    'Reference Date',
    'Amount (INR)',
    'Amount in Words',
    'Payment Particulars',
    'Notes / Reason',
    'Prepared By',
    'Passed By',
    'Created By',
    'Status',
    'Attachments Count'
  ];

  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = vouchers.map((v, index) => [
    index + 1,
    escapeCell(v.voucherNo),
    escapeCell(formatVoucherType(v.voucherType)),
    escapeCell(v.voucherDate),
    escapeCell(v.accountName),
    escapeCell(v.receivedFrom),
    escapeCell(v.paymentMode),
    escapeCell(v.referenceDetails || '-'),
    escapeCell(v.referenceDate || '-'),
    v.amount,
    escapeCell(v.amountInWords),
    escapeCell(v.paymentParticulars || '-'),
    escapeCell(v.noteReason || '-'),
    escapeCell(v.preparedBy),
    escapeCell(v.passedBy),
    escapeCell(v.createdBy),
    escapeCell(v.status),
    v.attachments ? v.attachments.length : 0
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  // UTF-8 BOM to prevent Indian characters or special symbols from corrupting in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
