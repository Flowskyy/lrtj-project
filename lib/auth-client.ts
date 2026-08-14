import { createAuthClient } from "better-auth/react"

// Use dynamic origin at runtime to support multiple access origins (localhost, LAN IPs)
// Server-side baseURL in lib/auth.ts remains env-based for OAuth redirects
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.BETTER_AUTH_URL || "http://localhost:3000")
})

export const { signIn, signOut, useSession } = authClient
