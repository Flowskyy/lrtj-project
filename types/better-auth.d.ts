import "better-auth/types"

declare module "better-auth/types" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      emailVerified?: boolean | null
      image?: string | null
      createdAt?: Date | null
      updatedAt?: Date | null
      roleId?: number | null
      permissions?: string[]
    }
  }
}
