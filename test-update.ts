import { prisma } from './lib/prisma';

async function testUpdate() {
  console.log('=== Testing update with timestamp ===\n');
  
  // Get current state of category ID 1
  const before = await prisma.merchandise_category.findUnique({
    where: { id: 1 },
    select: {
      id: true,
      category_name: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });

  console.log('BEFORE UPDATE:');
  console.log(`  ID: ${before?.id}`);
  console.log(`  Name: ${before?.category_name}`);
  console.log(`  Status: ${before?.status}`);
  console.log(`  Created At: ${before?.created_at?.toISOString() || 'NULL'}`);
  console.log(`  Updated At: ${before?.updated_at?.toISOString() || 'NULL'}`);
  console.log('');

  // Update the category
  const updated = await prisma.merchandise_category.update({
    where: { id: 1 },
    data: {
      category_name: 'Merchandise Updated',
      updated_at: new Date(),
    },
  });

  console.log('AFTER UPDATE (API response):');
  console.log(`  ID: ${updated.id}`);
  console.log(`  Name: ${updated.category_name}`);
  console.log(`  Status: ${updated.status}`);
  console.log(`  Created At: ${updated.created_at?.toISOString() || 'NULL'}`);
  console.log(`  Updated At: ${updated.updated_at?.toISOString() || 'NULL'}`);
  console.log('');

  // Query database again to verify
  const after = await prisma.merchandise_category.findUnique({
    where: { id: 1 },
    select: {
      id: true,
      category_name: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });

  console.log('AFTER UPDATE (Direct DB query):');
  console.log(`  ID: ${after?.id}`);
  console.log(`  Name: ${after?.category_name}`);
  console.log(`  Status: ${after?.status}`);
  console.log(`  Created At: ${after?.created_at?.toISOString() || 'NULL'}`);
  console.log(`  Updated At: ${after?.updated_at?.toISOString() || 'NULL'}`);
  console.log('');

  // Compare
  if (before?.updated_at === null && after?.updated_at !== null) {
    console.log('✅ SUCCESS: updated_at changed from NULL to a timestamp');
  } else if (before?.updated_at?.toISOString() !== after?.updated_at?.toISOString()) {
    console.log('✅ SUCCESS: updated_at changed to a new timestamp');
  } else {
    console.log('❌ FAILURE: updated_at did not change');
  }

  // Revert the name change
  await prisma.merchandise_category.update({
    where: { id: 1 },
    data: { category_name: 'Merchandise' },
  });

  await prisma.$disconnect();
}

testUpdate().catch(console.error);
