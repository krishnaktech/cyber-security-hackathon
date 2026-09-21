/**
 * TRACEGRID Forensic Normalization Engine
 * Ensures consistent canonical identifiers across disparate digital artifacts.
 */

/**
 * Normalizes phone numbers to standard canonical format (+91XXXXXXXXXX for 10-digit Indian numbers).
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+91${digits.slice(-10)}`;
  }
  return raw.trim();
}

/**
 * Normalizes Virtual Payment Addresses (UPI) to lowercase trimmed format.
 */
export function normalizeUpi(raw: string): string {
  return raw ? raw.trim().toLowerCase() : '';
}

/**
 * Normalizes IPv4 addresses by stripping whitespace.
 */
export function normalizeIp(raw: string): string {
  return raw ? raw.trim() : '';
}

export function normalizeImei(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/[\s\-_]/g, '').toUpperCase();
}

export function normalizeImsi(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/[\s\-_]/g, '').toUpperCase();
}

export function normalizeMac(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (cleaned.length === 12) {
    return cleaned.match(/.{1,2}/g)?.join(':') || raw.trim().toUpperCase();
  }
  return raw.trim().toUpperCase();
}

export function normalizeBankAccount(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/[\s\-]/g, '').toUpperCase();
}

export function normalizeTimestamp(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // If format is like "10:01" or "10:01:12", keep clear standard format
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
  }
  return trimmed;
}

export function normalizeIdentifier(type: string, value: string): string {
  switch (type.toUpperCase()) {
    case 'PHONE':
      return normalizePhone(value);
    case 'UPI':
      return normalizeUpi(value);
    case 'IP':
      return normalizeIp(value);
    case 'IMEI':
      return normalizeImei(value);
    case 'IMSI':
      return normalizeImsi(value);
    case 'MAC':
      return normalizeMac(value);
    case 'BANK_ACCOUNT':
      return normalizeBankAccount(value);
    default:
      return value.trim();
  }
}
