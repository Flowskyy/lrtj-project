import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

async function assignSuperAdmin() {
  const userEmail = "cnz191128@gmail.com" // User's email

  try {
    // Find the user
    let user = await prisma.auth_users.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.error(`❌ User with email "${userEmail}" not found`)
      console.log("Available users:")
      const allUsers = await prisma.auth_users.findMany({
        select: { id: true, email: true, name: true, roleId: true }
      })
      console.table(allUsers)
      return
    }

    console.log(`Found user: ${user.email} (current roleId: ${user.roleId || 'none'})`)

    // Find Super Admin role
    const superAdminRole = await prisma.auth_roles.findFirst({
      where: { isSuperAdmin: true }
    })

    if (!superAdminRole) {
      console.error("❌ Super Admin role not found")
      return
    }

    console.log(`Super Admin role ID: ${superAdminRole.id}`)

    // Update user's role to Super Admin
    await prisma.auth_users.update({
      where: { id: user.id },
      data: { roleId: superAdminRole.id }
    })

    console.log(`✅ Successfully assigned Super Admin role to ${user.email}`)
    console.log(`User ID: ${user.id}`)
    console.log(`Role ID: ${superAdminRole.id}`)
  } catch (error) {
    console.error("❌ Failed to assign Super Admin role:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

assignSuperAdmin()
