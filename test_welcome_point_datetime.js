const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function testWelcomePointDatetime() {
  console.log('=== WELCOME POINT DATETIME END-TO-END TEST ===\n');
  
  try {
    // Step 1: Get current configuration
    console.log('Step 1: Fetch current welcome point configuration');
    const current = await prisma.welcome_point.findFirst({
      orderBy: { id: 'asc' }
    });
    
    if (!current) {
      console.log('ERROR: No welcome point configuration found');
      return;
    }
    
    console.log('Current configuration:');
    console.log(`  ID: ${current.id}`);
    console.log(`  Point: ${current.point}`);
    console.log(`  Active From: ${current.active_from}`);
    console.log(`  Active To: ${current.active_to}`);
    console.log(`  Updated By: ${current.updated_by}\n`);
    
    // Step 2: Update with specific datetime (14:00 on 2026-08-01) using raw SQL
    const testDate = '2026-08-01T14:00:00';
    console.log(`Step 2: Update with test datetime: ${testDate}`);
    
    await prisma.$executeRaw`
      UPDATE welcome_point 
      SET active_from = ${testDate}, 
          active_to = '2026-08-01T18:00:00',
          updated_by = 'datetime_test',
          updated_at = NOW()
      WHERE id = ${current.id}
    `;
    
    console.log('Update successful\n');
    
    // Step 3: Query raw DB value
    console.log('Step 3: Query raw DB value');
    const raw = await prisma.$queryRaw`
      SELECT id, point, active_from, active_to, updated_at, updated_by
      FROM welcome_point
      WHERE id = ${current.id}
    `;
    
    console.log('Raw DB value:');
    console.log(JSON.stringify(raw, null, 2));
    console.log();
    
    // Step 4: Verify the values match
    console.log('Step 4: Verification');
    const inputFrom = '2026-08-01T14:00:00';
    const inputTo = '2026-08-01T18:00:00';
    const dbFrom = raw[0].active_from;
    const dbTo = raw[0].active_to;
    
    console.log(`Input From:  ${inputFrom}`);
    console.log(`DB From:     ${dbFrom}`);
    console.log(`Match: ${inputFrom === dbFrom ? '✓ YES' : '✗ NO'}`);
    console.log();
    console.log(`Input To:    ${inputTo}`);
    console.log(`DB To:       ${dbTo}`);
    console.log(`Match: ${inputTo === dbTo ? '✓ YES' : '✗ NO'}`);
    console.log();
    
    // Step 5: Restore original values
    console.log('Step 5: Restore original values');
    await prisma.welcome_point.update({
      where: { id: current.id },
      data: {
        active_from: current.active_from,
        active_to: current.active_to,
        updated_by: current.updated_by,
        updated_at: current.updated_at,
      }
    });
    
    console.log('Original values restored');
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWelcomePointDatetime();
