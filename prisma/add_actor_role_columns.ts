import { PrismaClient } from "../lib/generated/prisma"

const prisma = new PrismaClient()

async function addActorRoleColumns() {
  try {
    console.log('Adding actorRoleId and actorRoleName columns to system_activity_logs...')

    // Add actorRoleId column (nullable Int)
    await prisma.$executeRaw`
      ALTER TABLE system_activity_logs 
      ADD COLUMN actorRoleId INT NULL AFTER actorEmail
    `
    console.log('✅ Added actorRoleId column')

    // Add actorRoleName column (nullable Varchar)
    await prisma.$executeRaw`
      ALTER TABLE system_activity_logs 
      ADD COLUMN actorRoleName VARCHAR(255) NULL AFTER actorRoleId
    `
    console.log('✅ Added actorRoleName column')

    // Add index on actorRoleId for better query performance
    await prisma.$executeRaw`
      CREATE INDEX idx_system_activity_logs_actorRoleId 
      ON system_activity_logs(actorRoleId)
    `
    console.log('✅ Added index on actorRoleId')

    console.log('✅ Migration completed successfully')
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addActorRoleColumns()
