const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function testDatetime() {
  console.log('=== DATETIME FIELD TEST ===\n');
  
  // Test 1: Insert a specific datetime value
  const testDate = '2026-07-30T14:00:00';
  console.log('Input value:', testDate);
  
  try {
    // Insert into welcome_point
    const result = await prisma.$executeRaw`
      INSERT INTO welcome_point (point, active_from, active_to, updated_by, created_at, updated_at)
      VALUES (100, ${testDate}, ${testDate}, 'test', NOW(), NOW())
    `;
    console.log('Insert result:', result);
    
    // Read back the raw value
    const rows = await prisma.$queryRaw`
      SELECT id, point, active_from, active_to, created_at, updated_at
      FROM welcome_point
      WHERE updated_by = 'test'
      ORDER BY id DESC
      LIMIT 1
    `;
    
    console.log('\nRaw DB value:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Clean up
    await prisma.$executeRaw`DELETE FROM welcome_point WHERE updated_by = 'test'`;
    console.log('\nTest data cleaned up.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatetime();
