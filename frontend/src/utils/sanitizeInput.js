/**
 * Utility functions for sanitizing user inputs.
 */

/**
 * Disallows any special characters except dot (.), plus (+), and apostrophe (').
 * Allows letters (Unicode support), digits, spaces, and . + ' (normalizing curly apostrophe ’ to ').
 *
 * @param {string|any} str
 * @returns {string}
 */
export const sanitizeCustomerInput = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}\s.+']/gu, '');
};

/**
 * Checks if incoming input characters are within allowed set (used for onBeforeInput).
 *
 * @param {string} data
 * @returns {boolean}
 */
export const isAllowedCustomerChar = (data) => {
  if (!data) return true;
  return /^[\p{L}\p{N}\s.+']+$/u.test(data) || data === '’';
};
