/**
 * Format WIB date string to clean display format
 * Input: "2026-07-31T13:00:00" or "2026-07-31 13:00:00"
 * Output: "Jul 31, 2026, 13:00"
 *
 * Pure string parsing - no timezone conversion, no Date object math
 * The input is already literal WIB, we just reformat for readability
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function formatWIBDate(wibString: string | null | undefined): string {
  if (!wibString) {
    return '-'
  }

  // Handle both T and space separators
  const normalized = wibString.replace(' ', 'T')
  const parts = normalized.split('T')

  if (parts.length < 1) {
    return '-'
  }

  const datePart = parts[0]
  const dateComponents = datePart.split('-')

  if (dateComponents.length !== 3) {
    return '-'
  }

  const [year, month, day] = dateComponents.map(Number)

  // Extract time if present
  let timeStr = ''
  if (parts.length >= 2) {
    const timePart = parts[1]
    const timeComponents = timePart.split(':')
    if (timeComponents.length >= 2) {
      const [hours, minutes] = timeComponents.map(Number)
      timeStr = `, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  const monthName = MONTH_NAMES[month - 1] || 'Unknown'

  return `${monthName} ${day}, ${year}${timeStr}`
}

/**
 * Parse WIB string to Date object (no timezone conversion)
 * Used for date comparisons, not display
 */
export function parseWIBString(wibString: string | null | undefined): Date | null {
  if (!wibString || typeof wibString !== 'string') {
    return null
  }

  const normalized = wibString.replace(' ', 'T')
  const parts = normalized.split('T')

  if (parts.length !== 2) {
    return null
  }

  const [datePart, timePart] = parts
  const dateParts = datePart.split('-')
  const timeParts = timePart.split(':')

  if (dateParts.length !== 3 || timeParts.length < 2) {
    return null
  }

  const [year, month, day] = dateParts.map(Number)
  const [hours, minutes] = timeParts.map(Number)

  // Create date treating the values as WIB (no offset)
  return new Date(year, month - 1, day, hours, minutes)
}

/**
 * Get current WIB time as formatted string
 * Uses proper timezone-aware formatting since this is "now", not stored DB value
 */
export function getCurrentWIBTime(): string {
  const now = new Date()
  return now.toLocaleString('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '').replace(/\//g, '-').replace(' ', ' ')
}

/**
 * Get current WIB time as compact time-only string (HH:mm:ss)
 * Ideal for navbar/header display where space is limited
 * Returns format: "Aug 3, 2026, 11:16:52" (consistent with formatWIBDate style but with seconds)
 */
export function getCurrentWIBTimeCompact(): string {
  const now = new Date()
  const wibString = now.toLocaleString('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '').replace(/\//g, '-').replace(' ', ' ')
  
  // Format like formatWIBDate but include seconds for live clock
  const normalized = wibString.replace(' ', 'T')
  const parts = normalized.split('T')
  
  if (parts.length < 1) return '-'
  
  const datePart = parts[0]
  const dateComponents = datePart.split('-')
  
  if (dateComponents.length !== 3) return '-'
  
  const [year, month, day] = dateComponents.map(Number)
  
  // Extract time with seconds
  let timeStr = ''
  if (parts.length >= 2) {
    const timePart = parts[1]
    const timeComponents = timePart.split(':')
    if (timeComponents.length >= 3) {
      const [hours, minutes, seconds] = timeComponents.map(Number)
      timeStr = `, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
  }
  
  const monthName = MONTH_NAMES[month - 1] || 'Unknown'
  
  return `${monthName} ${day}, ${year}${timeStr}`
}

/**
 * Get current WIB time as ISO-like string with T separator
 * Used for countdown calculations
 */
export function getCurrentWIBTimeISO(): string {
  const now = new Date()
  return now.toLocaleString('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '').replace(/\//g, '-').replace(' ', 'T')
}
