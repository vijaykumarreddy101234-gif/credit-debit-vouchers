/**
 * Convert numbers into Indian Rupees in words (Indian Numbering System: Lakhs & Crores)
 * e.g., 250000 -> "Two Lakh Fifty Thousand Rupees Only"
 * e.g., 10450.75 -> "Ten Thousand Four Hundred Fifty Rupees and Seventy Five Paise Only"
 */

const ONES: string[] = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS: string[] = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigits(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ONES[num];
  const ten = Math.floor(num / 10);
  const one = num % 10;
  return `${TENS[ten]}${one > 0 ? ' ' + ONES[one] : ''}`;
}

function convertThreeDigits(num: number): string {
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  let result = '';
  if (hundred > 0) {
    result += `${ONES[hundred]} Hundred`;
    if (remainder > 0) result += ' ';
  }
  if (remainder > 0) {
    result += convertTwoDigits(remainder);
  }
  return result;
}

export function numberToIndianWords(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return '';
  }

  if (num === 0) {
    return 'Zero Rupees Only';
  }

  const isNegative = num < 0;
  const absoluteNum = Math.abs(num);

  // Split integer and decimal parts
  const integerPart = Math.floor(absoluteNum);
  const decimalPart = Math.round((absoluteNum - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return 'Zero Rupees Only';
  }

  // Indian format decomposition
  // Number structure: Crores (10,000,000) -> Lakhs (100,000) -> Thousands (1,000) -> Hundreds (100) -> Tens/Ones
  let n = integerPart;
  const parts: string[] = [];

  const crores = Math.floor(n / 10000000);
  n %= 10000000;

  const lakhs = Math.floor(n / 100000);
  n %= 100000;

  const thousands = Math.floor(n / 1000);
  n %= 1000;

  const remainder = n; // last 3 digits (hundreds + tens + ones)

  if (crores > 0) {
    if (crores >= 100) {
      parts.push(`${convertThreeDigits(crores)} Crore`);
    } else {
      parts.push(`${convertTwoDigits(crores)} Crore`);
    }
  }

  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  }

  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} Thousand`);
  }

  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  let words = parts.join(' ').trim();
  if (words.length > 0) {
    words = `${words} Rupees`;
  }

  if (decimalPart > 0) {
    const paiseWords = convertTwoDigits(decimalPart);
    if (words.length > 0) {
      words = `${words} and ${paiseWords} Paise`;
    } else {
      words = `${paiseWords} Paise`;
    }
  }

  words = `${isNegative ? 'Minus ' : ''}${words} Only`;
  return words;
}

export function formatIndianCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₹ 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹ 0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}
