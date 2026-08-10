import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

async function checkUserPermission() {
  try {
    const userEmail = "cnz191128@gmail.com"
    
    const user = await prisma.auth_users.findUnique({
      where: { email: userEmail },
      include: {
        admin_roles: {
          include: {
            role_permissions: true
          }
        }
      }
    })

    if (!user) {
      console.log("❌ User not found")
      return
    }

    console.log(`User: ${user.email}`)
    console.log(`Role ID: ${user.roleId}`)

    if (user.admin_roles) {
      console.log(`Role Name: ${user.admin_roles.name}`)
      console.log(`Is Super Admin: ${user.admin_roles.isSuperAdmin}`)
      console.log(`Total Permissions: ${user.admin_roles.role_permissions.length}`)
      console.log("\nPermissions:")
      user.admin_roles.role_permissions
        .sort((a, b) => a.pageKey.localeCompare(b.pageKey))
        .forEach(p => console.log(`  - ${p.pageKey}`))

      const hasMasterRoles = user.admin_roles.role_permissions.some(p => p.pageKey === 'master-roles')
      console.log(`\nHas 'master-roles' permission: ${hasMasterRoles ? '✅ Yes' : '❌ No'}`)
    } else {
      console.log("❌ No role assigned")
    }
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserPermission()
