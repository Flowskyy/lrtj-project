import { PrismaClient } from "../lib/generated/prisma"
import { getWIBDate } from "../lib/utils"

const prisma = new PrismaClient()

const ALL_PAGE_KEYS = [
  'dashboard',
  'users',
  'news',
  'notifications',
  'larata-club-earning',
  'merchandise',
  'redeem-merchandise',
  'daily-benefit',
  'redeem-benefit',
  'master-merchandise-category',
  'master-welcome-point',
  'master-banner',
  'master-popups',
  'master-membership',
  'master-roles',
  'master-admin-management',
  'master-activity-log'
]

async function seedPermissions() {
  try {
    // Get Super Admin role
    const superAdmin = await prisma.auth_roles.findUnique({
      where: { name: 'Super Admin' }
    })

    if (!superAdmin) {
      console.error('Super Admin role not found')
      return
    }

    console.log(`Granting ${ALL_PAGE_KEYS.length} permissions to Super Admin role (ID: ${superAdmin.id})`)

    // Grant all permissions
    const now = getWIBDate()
    for (const pageKey of ALL_PAGE_KEYS) {
      await prisma.role_permissions.upsert({
        where: {
          roleId_pageKey: {
            roleId: superAdmin.id,
            pageKey
          }
        },
        update: { updatedAt: now },
        create: {
          roleId: superAdmin.id,
          pageKey,
          createdAt: now,
          updatedAt: now
        }
      })
    }

    console.log('✅ All permissions granted to Super Admin')
  } catch (error) {
    console.error('❌ Failed to seed permissions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedPermissions()
