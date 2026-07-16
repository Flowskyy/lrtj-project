import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || "default-secret-change-in-production",
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Dummy authentication - no database connection
        if (credentials.email === "adminlrtj@smk.belajar.id" && credentials.password === "123456") {
          return {
            id: "1",
            email: "adminlrtj@smk.belajar.id",
            name: "Admin LRTJ",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, return it as-is to preserve the current origin
      if (url.startsWith('/')) {
        return url
      }
      // If the URL is absolute, ensure it uses the actual baseUrl from the request
      // This prevents redirects to 0.0.0.0 when the server is bound to that address
      if (baseUrl) {
        return url.startsWith(baseUrl) ? url : baseUrl
      }
      return url
    },
  },
})
