import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/logo-lrtj.png"
  const cdnBaseUrl = process.env.CDN_BASE_URL || "https://appcdn.lrtjakarta.co.id:3011"
  // If path already starts with http, return as-is
  if (path.startsWith("http")) return path
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${cdnBaseUrl}/${cleanPath}`
}

/**
 * Get current WIB time as a Date object
 * This returns a JavaScript Date object representing the current WIB time
 * Use this for Prisma DateTime fields - they accept Date objects directly
 */
export function getWIBDate(): Date {
  const now = new Date();
  // Get the current time in WIB timezone as a string
  const wibString = now.toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  // Parse the WIB string back to a Date object
  const [datePart, timePart] = wibString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
}

/**
 * Format Date object or string to MySQL DATETIME literal in WIB: YYYY-MM-DD HH:MM:SS
 * This ensures the literal WIB time is stored without timezone conversion
 * For Date objects, converts to WIB timezone before formatting
 * NOTE: This returns a STRING for display purposes. For Prisma DateTime fields, use getWIBDate() instead.
 */
export function formatWIB(dateStr: string | null | Date): string | null {
  if (!dateStr) return null;

  // If it's already a string in the right format, return as-is
  if (typeof dateStr === 'string') {
    // Check if it's already in YYYY-MM-DD HH:MM:SS format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Check if it's in YYYY-MM-DDTHH:MM:SS format (convert T to space)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
      return dateStr.replace('T', ' ');
    }
    // Otherwise parse it manually
    const normalized = dateStr.replace(' ', 'T')
    const parts = normalized.split('T')
    if (parts.length >= 1) {
      const datePart = parts[0]
      const dateComponents = datePart.split('-')
      if (dateComponents.length === 3) {
        const [year, month, day] = dateComponents.map(Number)
        let timeStr = '00:00:00'
        if (parts.length >= 2) {
          const timePart = parts[1]
          const timeComponents = timePart.split(':')
          if (timeComponents.length >= 3) {
            const [hours, minutes, seconds] = timeComponents.map(Number)
            timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          } else if (timeComponents.length >= 2) {
            const [hours, minutes] = timeComponents.map(Number)
            timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
          }
        }
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${timeStr}`
      }
    }
    return null;
  }

  // If it's a Date object, convert to WIB timezone before formatting
  const date = dateStr;
  const wibString = date.toLocaleString('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '').replace(/\//g, '-').replace(' ', ' ');
  
  return wibString;
}

export const cdnBaseUrl = process.env.CDN_BASE_URL || "https://appcdn.lrtjakarta.co.id:3011"