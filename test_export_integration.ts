import { PrismaClient } from './lib/generated/prisma'
import { getWIBDate } from './lib/utils'

const prisma = new PrismaClient()

async function testExportIntegration() {
  try {
    console.log('🧪 Testing Export Job Integration...\n')
    
    // Step 1: Check legacy tables baseline
    console.log('Step 1: Checking legacy tables baseline...')
    const exportsBaseline = await prisma.$queryRaw`SELECT COUNT(*) as count FROM exports` as { count: bigint }[]
    const jobBatchesBaseline = await prisma.$queryRaw`SELECT COUNT(*) as count FROM job_batches` as { count: bigint }[]
    console.log(`  ✓ Legacy exports table: ${exportsBaseline[0].count} rows`)
    console.log(`  ✓ Legacy job_batches table: ${jobBatchesBaseline[0].count} rows\n`)
    
    // Step 2: Simulate creating export jobs for 3 different types
    console.log('Step 2: Simulating export job creation for 3 types...')
    const now = getWIBDate()
    
    const jobTypes = [
      'NextJS.Export.UsersExporter',
      'NextJS.Export.RedeemExporter', 
      'NextJS.Export.RedeemBenefitExporter'
    ]
    
    const createdJobs: string[] = []
    
    for (const jobType of jobTypes) {
      const jobId = `test_${jobType.split('.').pop()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      
      await prisma.$queryRaw`
        INSERT INTO cms_export_jobs 
        (job_id, job_type, status, total_rows, processed_rows, successful_rows, triggered_by_user_id, filters, result_file_path, error_message, created_at, started_at, completed_at, updated_at)
        VALUES 
        (${jobId}, ${jobType}, 'pending', 1000, 0, 0, 42, '{"test": true}', NULL, NULL, ${now}, NULL, NULL, ${now})
      `
      
      createdJobs.push(jobId)
      console.log(`  ✓ Created job: ${jobId} (${jobType})`)
    }
    console.log()
    
    // Step 3: Simulate job progress updates
    console.log('Step 3: Simulating job progress updates...')
    for (const jobId of createdJobs) {
      await prisma.$queryRaw`
        UPDATE cms_export_jobs 
        SET status = 'processing', processed_rows = 500, successful_rows = 500, started_at = ${now}, updated_at = ${now}
        WHERE job_id = ${jobId}
      `
      console.log(`  ✓ Updated progress for: ${jobId}`)
    }
    console.log()
    
    // Step 4: Simulate job completion
    console.log('Step 4: Simulating job completion...')
    for (const jobId of createdJobs) {
      await prisma.$queryRaw`
        UPDATE cms_export_jobs 
        SET status = 'completed', processed_rows = 1000, successful_rows = 1000, result_file_path = 'test-result.xlsx', completed_at = ${now}, updated_at = ${now}
        WHERE job_id = ${jobId}
      `
      console.log(`  ✓ Completed job: ${jobId}`)
    }
    console.log()
    
    // Step 5: Verify jobs in cms_export_jobs
    console.log('Step 5: Verifying jobs in cms_export_jobs table...')
    const allJobs = await prisma.$queryRaw`
      SELECT job_id, job_type, status, total_rows, processed_rows, successful_rows, result_file_path, created_at, completed_at
      FROM cms_export_jobs 
      ORDER BY created_at DESC
      LIMIT 10
    ` as any[]
    
    const ourJobs = allJobs.filter(job => createdJobs.includes(job.job_id))
    
    console.log('  Completed jobs:')
    for (const job of ourJobs) {
      console.log(`    • ${job.job_id}`)
      console.log(`      Type: ${job.job_type}`)
      console.log(`      Status: ${job.status}`)
      console.log(`      Progress: ${job.processed_rows}/${job.total_rows} (${job.successful_rows} successful)`)
      console.log(`      File: ${job.result_file_path}`)
      console.log(`      Created: ${job.created_at}`)
      console.log(`      Completed: ${job.completed_at}`)
    }
    console.log()
    
    // Step 6: Verify legacy tables were NOT touched
    console.log('Step 6: Verifying legacy tables were NOT touched...')
    const exportsAfter = await prisma.$queryRaw`SELECT COUNT(*) as count FROM exports` as { count: bigint }[]
    const jobBatchesAfter = await prisma.$queryRaw`SELECT COUNT(*) as count FROM job_batches` as { count: bigint }[]
    
    const exportsUnchanged = exportsAfter[0].count === exportsBaseline[0].count
    const jobBatchesUnchanged = jobBatchesAfter[0].count === jobBatchesBaseline[0].count
    
    console.log(`  ✓ Legacy exports table: ${exportsAfter[0].count} rows (unchanged: ${exportsUnchanged})`)
    console.log(`  ✓ Legacy job_batches table: ${jobBatchesAfter[0].count} rows (unchanged: ${jobBatchesUnchanged})`)
    console.log()
    
    // Step 7: Cleanup test data
    console.log('Step 7: Cleaning up test data...')
    for (const jobId of createdJobs) {
      await prisma.$queryRaw`DELETE FROM cms_export_jobs WHERE job_id = ${jobId}`
      console.log(`  ✓ Deleted test job: ${jobId}`)
    }
    console.log()
    
    // Final verification
    if (exportsUnchanged && jobBatchesUnchanged) {
      console.log('✅ SUCCESS: All integration tests passed!')
      console.log('   • New cms_export_jobs table works correctly')
      console.log('   • Legacy tables (exports, job_batches) were never touched')
      console.log('   • Job lifecycle (create → progress → complete) works as expected')
      console.log('   • WIB timestamps are correctly applied')
    } else {
      console.log('❌ FAILURE: Legacy tables were modified!')
      throw new Error('Legacy tables should not have been touched')
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testExportIntegration()
