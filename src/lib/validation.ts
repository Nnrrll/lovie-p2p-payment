import { HttpError } from './http-error.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MONEY_REGEX = /^\d{1,6}(\.\d{1,2})?$/;
const HTML_LIKE_REGEX = /<[^>]+>/;

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value.trim());
}

export function normalizePhone(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const digits = trimmedValue.replace(/[^\d+]/g, '');
  const hasPlus = digits.startsWith('+');
  const numeric = digits.replace(/\D/g, '');

  if (numeric.length < 10 || numeric.length > 15) {
    return null;
  }

  if (hasPlus) {
    return `+${numeric}`;
  }

  if (numeric.length === 10) {
    return `+1${numeric}`;
  }

  if (numeric.length === 11 && numeric.startsWith('1')) {
    return `+${numeric}`;
  }

  return `+${numeric}`;
}

export function parsePositiveAmount(input: number | string) {
  const normalized = typeof input === 'number' ? input.toFixed(2).replace(/\.00$/, '') : String(input).trim();

  if (!MONEY_REGEX.test(normalized)) {
    throw new HttpError(400, 'Amount must be a positive number with up to 2 decimal places');
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero');
  }

  if (amount > 999999.99) {
    throw new HttpError(400, 'Amount cannot exceed 999,999.99');
  }

  return Number(amount.toFixed(2));
}

export function sanitizeMemo(input: string | null | undefined) {
  if (input === null || input === undefined) {
    return null;
  }

  const memo = input.trim();

  if (!memo) {
    return null;
  }

  if (memo.length > 280) {
    throw new HttpError(400, 'Memo cannot exceed 280 characters');
  }

  if (memo.includes('<') || memo.includes('>') || HTML_LIKE_REGEX.test(memo)) {
    throw new HttpError(400, 'Memo cannot contain HTML or script tags');
  }

  return memo;
}

export function normalizeCurrency(currency: string | undefined) {
  const normalized = (currency ?? 'USD').trim().toUpperCase();

  if (normalized !== 'USD') {
    throw new HttpError(400, 'Only USD is supported in this assignment build');
  }

  return normalized;
}

export function parseListNumber(
  input: string | undefined,
  fallback: number,
  min = 1,
  max = 100,
) {
  if (!input) {
    return fallback;
  }

  const value = Number.parseInt(input, 10);

  if (Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, value));
}
