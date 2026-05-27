export function findObjectsByIds(ids, objects, idField = 'id') {
    return ids.map(id => objects.find(obj => obj[idField] === id)).filter(obj => obj);
}


export function sortByDateOldestFirst(items, dateField = 'created_at') {
    return [...items].sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));
}

/**
 * Philippine mobile number validation utility
 * Supports formats:
 * - 09123456789 (11 digits, starts with 09)
 * - +639123456789 (13 digits, starts with +63)
 * - 639123456789 (12 digits, starts with 63)
 * - 0912 345 6789, 0912-345-6789 (spaces/dashes allowed)
 */

/**
 * Removes all non-digit characters from a phone string.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Checks if a phone number is a valid Philippine mobile number.
 * Returns true if valid, false otherwise.
 */
export function isValidPhilippinePhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  
  // Must be 11, 12, or 13 digits
  if (![11, 12, 13].includes(digits.length)) return false;
  
  // Remove leading '63' or '0' to get the 10-digit subscriber number
  let normalized = digits;
  if (normalized.startsWith('63') && normalized.length === 12) {
    normalized = '0' + normalized.slice(2); // 639123456789 -> 09123456789
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized; // already 09...
  } else if (normalized.startsWith('63') && normalized.length === 13) {
    normalized = '0' + normalized.slice(2); // +639123456789 -> 09123456789 (but +63 adds 1 more digit)
  } else {
    return false;
  }
  
  // Now normalized should be 11 digits starting with '09'
  if (normalized.length !== 11) return false;
  if (!normalized.startsWith('09')) return false;
  
  // Optional: Check that the next two digits are valid mobile prefixes (Globe, Smart, DITO, etc.)
  // Currently we only check the length and '09' prefix.
  return true;
}

/**
 * Returns a normalized, consistent format (e.g., '09123456789')
 * Returns null if invalid.
 */
export function normalizePhilippinePhone(phone: string): string | null {
  if (!isValidPhilippinePhone(phone)) return null;
  const digits = normalizePhone(phone);
  // Convert to 11-digit '09...' format
  if (digits.startsWith('63') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits;
  }
  // For the +639... case (13 digits after stripping '+')
  if (digits.length === 13 && digits.startsWith('63')) {
    return '0' + digits.slice(2);
  }
  return digits;
}