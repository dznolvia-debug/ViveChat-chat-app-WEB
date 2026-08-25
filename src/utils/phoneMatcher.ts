// Universal Phone Number Normalizer & Matcher for WhatsApp-style messaging
const cleanDigitsCache = new Map<string, string>();
const normalizePhoneCache = new Map<string, string>();
const matchCache = new Map<string, boolean>();

export function cleanPhoneDigits(phone?: string): string {
  if (!phone) return '';
  const cached = cleanDigitsCache.get(phone);
  if (cached !== undefined) return cached;
  const res = phone.replace(/\D/g, '');
  if (cleanDigitsCache.size > 2000) cleanDigitsCache.clear();
  cleanDigitsCache.set(phone, res);
  return res;
}

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const cached = normalizePhoneCache.get(phone);
  if (cached !== undefined) return cached;
  const cleaned = phone.trim();
  const digits = cleanPhoneDigits(cleaned);
  const res = digits ? '+' + digits : '';
  if (normalizePhoneCache.size > 2000) normalizePhoneCache.clear();
  normalizePhoneCache.set(phone, res);
  return res;
}

/**
 * Checks if two phone numbers refer to the same person/device.
 * Handles:
 * - "+504 9818 7733" vs "98187733"
 * - "+50498187733" vs "504 9818-7733"
 * - Country code variations
 * - Suffix matching for national vs international numbers (last 7 or 8 digits)
 */
export function arePhonesMatching(phoneA?: string, phoneB?: string): boolean {
  if (!phoneA || !phoneB) return false;
  if (phoneA === phoneB) return true;

  const key = phoneA < phoneB ? `${phoneA}__${phoneB}` : `${phoneB}__${phoneA}`;
  const cached = matchCache.get(key);
  if (cached !== undefined) return cached;

  const rawA = phoneA.trim();
  const rawB = phoneB.trim();
  if (rawA === rawB) {
    matchCache.set(key, true);
    return true;
  }

  const digitsA = cleanPhoneDigits(rawA);
  const digitsB = cleanPhoneDigits(rawB);
  if (!digitsA || !digitsB) {
    matchCache.set(key, false);
    return false;
  }

  // Exact digits match
  if (digitsA === digitsB) {
    matchCache.set(key, true);
    return true;
  }

  // If both have sufficient length (at least 7 digits, e.g. national mobile numbers)
  if (digitsA.length >= 7 && digitsB.length >= 7) {
    const suffixA7 = digitsA.slice(-7);
    const suffixB7 = digitsB.slice(-7);
    if (suffixA7 === suffixB7) {
      matchCache.set(key, true);
      return true;
    }

    const suffixA8 = digitsA.slice(-8);
    const suffixB8 = digitsB.slice(-8);
    if (suffixA8 === suffixB8) {
      matchCache.set(key, true);
      return true;
    }
  }

  // If one is full international and other is national
  if (digitsA.length >= 6 && digitsB.length >= 6) {
    if (digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA)) {
      matchCache.set(key, true);
      return true;
    }
  }

  if (matchCache.size > 5000) matchCache.clear();
  matchCache.set(key, false);
  return false;
}

