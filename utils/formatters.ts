// ~/utils/formatters.ts // Rename file to .ts

import { Timestamp } from 'firebase/firestore';

/**
 * Formats a date value into a Slovak date string (e.g., "10. septembra 2025").
 * Handles Firestore Timestamps, Date objects, and date strings (attempts YYYY-MM-DD parsing).
 *
 * @param dateValue - The date value to format (Timestamp, Date, string, null, undefined).
 * @param isInputDateString - Flag indicating if the input (if string) is specifically a date string like 'YYYY-MM-DD'. Defaults to false.
 * @returns The formatted date string, 'N/A', or 'Invalid Date'.
 */
export const formatDate = (
  dateValue: Timestamp | Date | string | null | undefined,
  isInputDateString: boolean = false // Default value for the flag
): string => {
  if (!dateValue) {
    return 'N/A';
  }

  let date: Date | undefined;

  try {
    if (dateValue instanceof Timestamp) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      // Already a Date object
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      if (isInputDateString) {
        // Attempt to parse YYYY-MM-DD specifically, assuming UTC
        const parts = dateValue.split('-');
        if (
          parts.length === 3 &&
          !isNaN(parseInt(parts[0])) &&
          !isNaN(parseInt(parts[1])) &&
          !isNaN(parseInt(parts[2]))
        ) {
          // Month is 0-indexed in Date constructor
          date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
        } else {
          // Fallback parsing for other potential string formats (less reliable)
          date = new Date(dateValue);
        }
      } else {
         // If not explicitly a date string, try general parsing
         date = new Date(dateValue);
      }
    } else {
       // Handle potential other types if necessary, or consider throwing an error
       console.warn("formatDate received an unexpected type:", typeof dateValue);
       return 'Invalid Input Type';
    }

    // Validate the resulting Date object
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Format using Slovak locale options
    // Option 1: Long month name (e.g., "10. septembra 2025")
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long', // Use 'long' for full month name
      day: 'numeric',
      timeZone: 'UTC', // Crucial for consistency, especially with YYYY-MM-DD strings
    });

    /*
    // Option 2: Numeric month (e.g., "10. 9. 2025") - Uncomment to use this instead
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'numeric', // Use 'numeric' for number
      day: 'numeric',
      timeZone: 'UTC',
    });
    */

  } catch (error) {
    console.error('Error formatting date:', error, 'Input was:', dateValue);
    return 'Formatting Error';
  }
};
