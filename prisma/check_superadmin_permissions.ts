import { PrismaClient } from "../lib/generated/prisma"
import { getWIBDate } from "../lib/utils"

const prisma = new PrismaClient()

async function checkSuperAdminPermissions() {
  try {
    const superAdmin = await prisma.auth_roles.findFirst({
      where: { isSuperAdmin: true },
      include: {
        role_permissions: true
      }
    })

    if (!superAdmin) {
      console.log("❌ No Super Admin role found")
      return
    }

    console.log(`Super Admin Role: ${superAdmin.name} (ID: ${superAdmin.id})`)
    console.log(`Total permissions: ${superAdmin.role_permissions.length}`)
    console.log("\nPermissions:")
    superAdmin.role_permissions
      .sort((a, b) => a.pageKey.localeCompare(b.pageKey))
      .forEach(p => console.log(`  - ${p.pageKey}`))

    // Check if master-roles is included
    const hasMasterRoles = superAdmin.role_permissions.some(p => p.pageKey === 'master-roles')
    console.log(`\nHas 'master-roles' permission: ${hasMasterRoles ? '✅ Yes' : '❌ No'}`)

    if (!hasMasterRoles) {
      console.log("\nAdding master-roles permission...")
      await prisma.role_permissions.create({
        data: {
          roleId: superAdmin.id,
          pageKey: 'master-roles',
          createdAt: getWIBDate(),
          updatedAt: getWIBDate()
        }
      })
      console.log("✅ Added master-roles permission")
    }
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSuperAdminPermissions()
