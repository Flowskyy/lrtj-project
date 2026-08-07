import { auth } from "../lib/auth"
import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

/**
 * Seed script to create local admin accounts with email/password authentication
 * 
 * Usage:
 *   npx tsx prisma/seed-admin.ts <email> <password> <role-name>
 * 
 * Available roles:
 *   - SUPER_ADMIN
 *   - OPERATIONS
 *   - VIEWER
 *   - SECURITY_ADMIN
 * 
 * Example:
 *   npx tsx prisma/seed-admin.ts admin@lrtjakarta.co.id mypassword SUPER_ADMIN
 */

async function seedAdmin() {
  const args = process.argv.slice(2)
  
  if (args.length !== 3) {
    console.error("Usage: npx tsx prisma/seed-admin.ts <email> <password> <role-name>")
    console.error("\nAvailable roles: SUPER_ADMIN, OPERATIONS, VIEWER, SECURITY_ADMIN")
    console.error("\nExample: npx tsx prisma/seed-admin.ts admin@lrtjakarta.co.id mypassword SUPER_ADMIN")
    process.exit(1)
  }

  const [email, password, roleName] = args

  try {
    // Check if role exists
    const role = await prisma.admin_roles.findUnique({
      where: { name: roleName }
    })

    if (!role) {
      console.error(`Error: Role "${roleName}" not found in admin_roles table`)
      console.error("Available roles: SUPER_ADMIN, OPERATIONS, VIEWER, SECURITY_ADMIN")
      process.exit(1)
    }

    // Check if user already exists
    const existingUser = await prisma.auth_users.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log(`User with email "${email}" already exists. Updating password and role...`)
      
      // Delete existing account to reset
      await prisma.auth_accounts.deleteMany({
        where: { userId: existingUser.id }
      })
      
      // Update user role
      await prisma.auth_users.update({
        where: { id: existingUser.id },
        data: { roleId: role.id }
      })
    } else {
      console.log(`Creating new user with email "${email}"...`)
    }

    // Create user using Better Auth's API
    // This will properly hash the password using Better Auth's internal method
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: email.split('@')[0], // Use email prefix as name
      }
    })

    if (result.error) {
      console.error("Error creating user:", result.error)
      process.exit(1)
    }

    // Get the created user
    const user = await prisma.auth_users.findUnique({
      where: { email }
    })

    if (!user) {
      console.error("Error: User was not created successfully")
      process.exit(1)
    }

    // Assign role
    await prisma.auth_users.update({
      where: { id: user.id },
      data: { roleId: role.id }
    })

    console.log(`✅ Successfully created/updated admin user:`)
    console.log(`   Email: ${email}`)
    console.log(`   Role: ${roleName} (ID: ${role.id})`)
    console.log(`   User ID: ${user.id}`)
    console.log(`\nYou can now sign in with this email and password.`)

  } catch (error) {
    console.error("Error during seed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()
