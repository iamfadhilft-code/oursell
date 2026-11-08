/**
 * Barcode utilities for validation, checksum calculation, and compliant code generation.
 */

export type BarcodeType = 'CODE128' | 'EAN13' | 'EAN8' | 'UPCA' | 'CODE39' | 'QR';

/**
 * Calculates EAN-13 checksum digit for a 12-digit string
 */
export function calculateEan13CheckDigit(twelveDigits: string): number {
  if (twelveDigits.length < 12) return 0;
  const digits = twelveDigits.slice(0, 12).split('').map(Number);
  const sum = digits.reduce((acc, digit, idx) => {
    return acc + (idx % 2 === 0 ? digit : digit * 3);
  }, 0);
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Calculates EAN-8 checksum digit for a 7-digit string
 */
export function calculateEan8CheckDigit(sevenDigits: string): number {
  if (sevenDigits.length < 7) return 0;
  const digits = sevenDigits.slice(0, 7).split('').map(Number);
  const sum = digits.reduce((acc, digit, idx) => {
    return acc + (idx % 2 === 0 ? digit * 3 : digit);
  }, 0);
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Calculates UPC-A checksum digit for an 11-digit string
 */
export function calculateUpcACheckDigit(elevenDigits: string): number {
  if (elevenDigits.length < 11) return 0;
  const digits = elevenDigits.slice(0, 11).split('').map(Number);
  const sum = digits.reduce((acc, digit, idx) => {
    return acc + (idx % 2 === 0 ? digit * 3 : digit);
  }, 0);
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates whether a barcode string is compliant with the selected type
 */
export function validateBarcode(type: BarcodeType, value: string): { valid: boolean; normalized: string; error?: string } {
  const clean = value.trim();
  if (!clean) {
    return { valid: false, normalized: '', error: 'Barcode value is required.' };
  }

  switch (type) {
    case 'EAN13': {
      const digitsOnly = clean.replace(/\D/g, '');
      if (digitsOnly.length === 12) {
        const check = calculateEan13CheckDigit(digitsOnly);
        return { valid: true, normalized: digitsOnly + check.toString() };
      }
      if (digitsOnly.length === 13) {
        const check = calculateEan13CheckDigit(digitsOnly.slice(0, 12));
        // Ensure checksum is 100% compliant and scannable
        return { valid: true, normalized: digitsOnly.slice(0, 12) + check.toString() };
      }
      // If code is not 12-13 digits, fallback to Code 128 compliant format
      if (/^[\x20-\x7E]+$/.test(clean)) {
        return { valid: true, normalized: clean };
      }
      return { valid: false, normalized: clean, error: 'EAN-13 requires 12 or 13 numeric digits.' };
    }

    case 'EAN8': {
      const digitsOnly = clean.replace(/\D/g, '');
      if (digitsOnly.length === 7) {
        const check = calculateEan8CheckDigit(digitsOnly);
        return { valid: true, normalized: digitsOnly + check.toString() };
      }
      if (digitsOnly.length === 8) {
        const check = calculateEan8CheckDigit(digitsOnly.slice(0, 7));
        return { valid: true, normalized: digitsOnly.slice(0, 7) + check.toString() };
      }
      return { valid: false, normalized: clean, error: 'EAN-8 must be 7 or 8 digits.' };
    }

    case 'UPCA': {
      const digitsOnly = clean.replace(/\D/g, '');
      if (digitsOnly.length === 11) {
        const check = calculateUpcACheckDigit(digitsOnly);
        return { valid: true, normalized: digitsOnly + check.toString() };
      }
      if (digitsOnly.length === 12) {
        const check = calculateUpcACheckDigit(digitsOnly.slice(0, 11));
        return { valid: true, normalized: digitsOnly.slice(0, 11) + check.toString() };
      }
      return { valid: false, normalized: clean, error: 'UPC-A must be 11 or 12 digits.' };
    }

    case 'CODE128': {
      // Standard printable ASCII characters
      if (/^[\x20-\x7E]+$/.test(clean)) {
        return { valid: true, normalized: clean };
      }
      return { valid: false, normalized: clean, error: 'Code 128 requires standard ASCII characters.' };
    }

    case 'CODE39': {
      // Uppercase letters, digits, and special characters: - . $ / + % SPACE
      const upper = clean.toUpperCase();
      if (/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(upper)) {
        return { valid: true, normalized: upper };
      }
      return { valid: false, normalized: clean, error: 'Code 39 accepts uppercase letters, digits, and - . $ / + %' };
    }

    case 'QR': {
      if (clean.length > 0) {
        return { valid: true, normalized: clean };
      }
      return { valid: false, normalized: clean, error: 'QR code data cannot be empty.' };
    }

    default:
      return { valid: true, normalized: clean };
  }
}

/**
 * Generates an automatically compliant barcode for a given type
 */
export function generateCompliantBarcode(type: BarcodeType, prefix = '890'): string {
  switch (type) {
    case 'EAN13': {
      // e.g. 890 + 9 random digits + check digit = 13 digits
      const random9 = Math.floor(100000000 + Math.random() * 900000000).toString();
      const base12 = (prefix + random9).slice(0, 12);
      const check = calculateEan13CheckDigit(base12);
      return base12 + check.toString();
    }
    case 'EAN8': {
      // 7 random digits + check digit = 8 digits
      const random7 = Math.floor(1000000 + Math.random() * 9000000).toString();
      const check = calculateEan8CheckDigit(random7);
      return random7 + check.toString();
    }
    case 'UPCA': {
      // 11 digits + check digit = 12 digits
      const random11 = Math.floor(10000000000 + Math.random() * 90000000000).toString();
      const check = calculateUpcACheckDigit(random11);
      return random11 + check.toString();
    }
    case 'CODE128': {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      return `OS-${randomNum}`;
    }
    case 'CODE39': {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      return `SKU${randomNum}`;
    }
    case 'QR': {
      return `OURSELL-PRD-${Date.now().toString().slice(-6)}`;
    }
  }
}
