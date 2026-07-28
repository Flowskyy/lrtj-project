import { prisma } from './lib/prisma';

async function testTimestamps() {
  console.log('=== Testing automatic timestamps ===\n');

  // Test 1: Create new category
  console.log('TEST 1: Creating new category...');
  const newCategory = await prisma.merchandise_category.create({
    data: {
      category_name: 'Test Category Auto Timestamp',
      status: true,
    },
  });

  console.log('Created category:');
  console.log(`  ID: ${newCategory.id}`);
  console.log(`  Name: ${newCategory.category_name}`);
  console.log(`  Created At: ${newCategory.created_at?.toISOString() || 'NULL'}`);
  console.log(`  Updated At: ${newCategory.updated_at?.toISOString() || 'NULL'}`);
  console.log('');

  // Verify created_at is set
  if (newCategory.created_at) {
    console.log('✅ PASS: created_at was set automatically');
  } else {
    console.log('❌ FAIL: created_at is NULL');
  }

  // Test 2: Update category
  console.log('\nTEST 2: Updating category...');
  const beforeUpdate = await prisma.merchandise_category.findUnique({
    where: { id: newCategory.id },
    select: { updated_at: true },
  });

  console.log(`Before update: ${beforeUpdate?.updated_at?.toISOString() || 'NULL'}`);

  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

  const updated = await prisma.merchandise_category.update({
    where: { id: newCategory.id },
    data: {
      category_name: 'Test Category Updated',
    },
  });

  console.log(`After update: ${updated.updated_at?.toISOString() || 'NULL'}`);

  // Verify updated_at changed
  if (beforeUpdate?.updated_at?.toISOString() !== updated.updated_at?.toISOString()) {
    console.log('✅ PASS: updated_at changed automatically');
  } else {
    console.log('❌ FAIL: updated_at did not change');
  }

  // Test 3: Query from database to verify persistence
  console.log('\nTEST 3: Verifying database persistence...');
  const fromDB = await prisma.merchandise_category.findUnique({
    where: { id: newCategory.id },
  });

  console.log('Direct DB query:');
  console.log(`  Created At: ${fromDB?.created_at?.toISOString() || 'NULL'}`);
  console.log(`  Updated At: ${fromDB?.updated_at?.toISOString() || 'NULL'}`);

  if (fromDB?.created_at?.toISOString() === newCategory.created_at?.toISOString() &&
      fromDB?.updated_at?.toISOString() === updated.updated_at?.toISOString()) {
    console.log('✅ PASS: Database values match API response');
  } else {
    console.log('❌ FAIL: Database values do not match API response');
  }

  // Cleanup
  await prisma.merchandise_category.delete({
    where: { id: newCategory.id },
  });

  console.log('\n=== Test complete ===');
  await prisma.$disconnect();
}

testTimestamps().catch(console.error);
