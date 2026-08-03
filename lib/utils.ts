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
 * Format Date object or string to MySQL DATETIME literal in WIB: YYYY-MM-DD HH:MM:SS
 * This ensures the literal WIB time is stored without timezone conversion
 * Uses manual parsing to avoid timezone conversion from new Date()
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

  // If it's a Date object, extract components manually
  const date = dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const cdnBaseUrl = process.env.CDN_BASE_URL || "https://appcdn.lrtjakarta.co.id:3011"