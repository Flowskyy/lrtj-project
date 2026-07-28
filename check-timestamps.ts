import { prisma } from './lib/prisma';

async function checkTimestamps() {
  console.log('=== Checking merchandise_category timestamps ===\n');
  
  const categories = await prisma.merchandise_category.findMany({
    select: {
      id: true,
      category_name: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log('Direct database query results:');
  console.log('ID | Category Name | Status | Created At | Updated At');
  console.log('---|---------------|--------|------------|------------');
  
  categories.forEach(cat => {
    console.log(
      `${cat.id} | ${cat.category_name || 'NULL'} | ${cat.status} | ${cat.created_at?.toISOString() || 'NULL'} | ${cat.updated_at?.toISOString() || 'NULL'}`
    );
  });

  console.log('\n=== First 3 categories detailed ===\n');
  categories.slice(0, 3).forEach(cat => {
    console.log(`Category ID: ${cat.id}`);
    console.log(`  Name: ${cat.category_name}`);
    console.log(`  Status: ${cat.status}`);
    console.log(`  Created At (DB): ${cat.created_at?.toISOString()}`);
    console.log(`  Updated At (DB): ${cat.updated_at?.toISOString()}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkTimestamps().catch(console.error);
