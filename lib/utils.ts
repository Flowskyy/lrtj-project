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
