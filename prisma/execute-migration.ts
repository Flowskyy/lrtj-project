import { PrismaClient } from "../lib/generated/prisma"
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function executeMigration() {
  try {
    const steps = [
      'step1_add_issuperadmin.sql',
      'step2_create_role_permissions.sql',
      'step3_create_super_admin.sql'
    ]
    
    for (let i = 0; i < steps.length; i++) {
      const stepPath = path.join(__dirname, steps[i])
      const sql = fs.readFileSync(stepPath, 'utf-8').trim()
      
      console.log(`Executing step ${i + 1}/${steps.length}: ${steps[i]}`)
      
      try {
        await prisma.$executeRawUnsafe(sql)
        console.log(`✅ Step ${i + 1} completed`)
      } catch (error: any) {
        // Ignore duplicate column/table errors (might already exist from partial run)
        if (error.code === 'P2010' && (
          error.meta?.message?.includes('Duplicate column') ||
          error.meta?.message?.includes('already exists')
        )) {
          console.log(`⚠️  Step ${i + 1} skipped (already exists)`)
        } else {
          throw error
        }
      }
    }
    
    // Step 4: Seed permissions using TypeScript
    console.log('Executing step 4: Seeding permissions...')
    await execAsync('npx tsx prisma/step4_permissions.ts')
    console.log('✅ Step 4 completed')
    
    console.log('✅ Migration executed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

executeMigration()
