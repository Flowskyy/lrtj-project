import { prisma } from './lib/prisma';

async function migrateRedeemStatus() {
  console.log('Starting migration: Updating all "process" status to "completed"...');
  
  // First, count how many records will be updated
  const processCount = await prisma.redeem.count({
    where: { status: 'process' }
  });
  
  console.log(`Found ${processCount} records with status='process'`);
  
  if (processCount === 0) {
    console.log('No records to update. Migration complete.');
    return;
  }
  
  // Update all records with status='process' to '_completed'
  const result = await prisma.redeem.updateMany({
    where: { status: 'process' },
    data: { status: 'completed' }
  });
  
  console.log(`Updated ${result.count} records from 'process' to 'completed'`);
  console.log('Migration complete!');
}

migrateRedeemStatus()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
