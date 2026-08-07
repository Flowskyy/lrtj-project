import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

async function createTestRole() {
  try {
    // Create a "Viewer" role with limited permissions
    const viewerRole = await prisma.auth_roles.upsert({
      where: { name: 'Viewer' },
      update: {},
      create: {
        name: 'Viewer',
        isSuperAdmin: false,
        updatedAt: new Date()
      }
    })

    console.log(`Viewer role ID: ${viewerRole.id}`)

    // Grant limited permissions (only Dashboard and News)
    const limitedPermissions = ['dashboard', 'news']
    
    await prisma.role_permissions.deleteMany({
      where: { roleId: viewerRole.id }
    })

    await prisma.role_permissions.createMany({
      data: limitedPermissions.map(pageKey => ({
        roleId: viewerRole.id,
        pageKey
      }))
    })

    console.log('✅ Created Viewer role with limited permissions (dashboard, news)')
    console.log('You can now assign this role to a test user to test the permission system')
  } catch (error) {
    console.error('❌ Failed to create test role:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestRole()
