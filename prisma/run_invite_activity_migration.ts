import { PrismaClient } from '../lib/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function run() {
  const before = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM admin_invitations')
  const beforeCount = Number((before as any[])[0].c)
  console.log('Rows before:', beforeCount)

  const sql = fs.readFileSync(path.join(__dirname, 'manual_migration_add_invite_activity_columns.sql'), 'utf-8').trim()
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean)

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt)
      console.log('OK:', stmt.slice(0, 80))
    } catch (err: any) {
      if (err?.meta?.message?.includes('Duplicate column')) {
        console.log('SKIP (already exists):', stmt.slice(0, 80))
      } else {
        throw err
      }
    }
  }

  const after = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM admin_invitations')
  const afterCount = Number((after as any[])[0].c)
  console.log('Rows after:', afterCount)
  if (afterCount !== beforeCount) {
    throw new Error(`Row count changed: ${beforeCount} -> ${afterCount}`)
  }

  const cols = await prisma.$queryRawUnsafe(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_invitations' ORDER BY ORDINAL_POSITION"
  )
  console.log('columns:', (cols as any[]).map((x: any) => x.COLUMN_NAME).join(', '))

  await prisma.$disconnect()
}

run()