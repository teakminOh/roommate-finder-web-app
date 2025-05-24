// ~/utils/formatters.js

/**
 * Formats a date string, Date object, or Firestore Timestamp into a more readable format.
 * @param {string | Date | Object} dateInput - The date to format (string, Date, or Firestore Timestamp).
 * @param {boolean} [longFormat=false] - Whether to use a longer, more descriptive format.
 * @returns {string} Formatted date string or 'Invalid Date' if input is unparseable.
 */
export function formatDate(dateInput, longFormat = false) {
  if (!dateInput) return '';

  let date;
  if (typeof dateInput.toDate === 'function') {
    // Firestore Timestamp
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return 'Neplatný dátum'; // Invalid Date
  }

  const options = longFormat
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' };

  return date.toLocaleDateString('sk-SK', options);
}