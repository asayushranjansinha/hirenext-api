/**
 * Normalizes a string into a lowercase, alphanumeric format without spaces or punctuation.
 *
 * This is useful for making comparisons case-insensitive and format-insensitive.
 * For example, "San Francisco", "SAN FRANCISCO", and "San-Francisco" will all normalize to "sanfrancisco".
 *
 * @param {string} str - The string to normalize.
 * @returns {string} The normalized string.
 *
 * @example
 * normalizeString("  San Francisco  "); // "sanfrancisco"
 * normalizeString("SAN-FRANCISCO");     // "sanfrancisco"
 * normalizeString("St. Louis");         // "stlouis"
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase() // convert to lowercase
    .trim() // remove leading/trailing spaces
    .replace(/\s+/g, "") // remove all spaces
    .replace(/[^a-z0-9]/g, ""); // remove non-alphanumeric characters
}
