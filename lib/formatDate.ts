/**
 * Format date/datetime for consistent display across the app
 * Format: "21 July 2026 | 13:20"
 *
 * Handles standard Date objects and ISO-8601 strings.
 * Prisma DateTime fields store UTC values, and JavaScript's new Date()
 * automatically converts UTC to local timezone (WIB), so no manual conversion needed.
 */

export function formatDisplayDate(value: string | Date | null): string {
  if (!value) return "-";

  let date: Date;

  // Handle string input
  if (typeof value === 'string') {
    date = new Date(value);
  } else {
    // Date object input - use as-is (already in local timezone)
    date = new Date(value);
  }

  // Format: "21 July 2026 | 13:20"
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} ${year} | ${hours}:${minutes}`;
}
