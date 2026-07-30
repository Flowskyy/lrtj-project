const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function testUserDeleteRestore() {
  console.log('=== USER DELETE/RESTORE TEST ===\n');
  
  try {
    // Step 1: Find a test user (use a user with ID > 1000 to avoid critical users)
    console.log('Step 1: Find a test user');
    const testUser = await prisma.users.findFirst({
      where: {
        status: 1,
        id: { gt: 1000 }
      },
      orderBy: { id: 'asc' }
    });
    
    if (!testUser) {
      console.log('ERROR: No suitable test user found');
      return;
    }
    
    console.log(`Test user found: ID ${testUser.id}, Name: ${testUser.name}, Email: ${testUser.email}, Status: ${testUser.status}\n`);
    
    // Step 2: Verify initial status
    console.log('Step 2: Verify initial status in DB');
    const initialCheck = await prisma.$queryRaw`
      SELECT id, name, email, status FROM users WHERE id = ${testUser.id}
    `;
    console.log('DB Status:', JSON.stringify(initialCheck[0], null, 2));
    console.log(`Status field value: ${initialCheck[0].status}\n`);
    
    // Step 3: Simulate DELETE API call
    console.log('Step 3: Simulate DELETE API call (soft-delete)');
    await prisma.users.update({
      where: { id: testUser.id },
      data: { status: 0 }
    });
    console.log('DELETE executed\n');
    
    // Step 4: Verify status after delete
    console.log('Step 4: Verify status after delete');
    const afterDelete = await prisma.$queryRaw`
      SELECT id, name, email, status FROM users WHERE id = ${testUser.id}
    `;
    console.log('DB Status:', JSON.stringify(afterDelete[0], null, 2));
    console.log(`Status field value: ${afterDelete[0].status}`);
    console.log(`Status changed: ${initialCheck[0].status !== afterDelete[0].status ? '✓ YES' : '✗ NO'}\n`);
    
    // Step 5: Verify user is gone from default list (status=1 filter)
    console.log('Step 5: Verify user is gone from default list (status=1 filter)');
    const defaultListCheck = await prisma.users.findFirst({
      where: {
        id: testUser.id,
        status: 1
      }
    });
    console.log(`User in default list: ${defaultListCheck ? '✗ YES (BUG!)' : '✓ NO (CORRECT)'}\n`);
    
    // Step 6: Simulate PATCH API call (restore)
    console.log('Step 6: Simulate PATCH API call (restore)');
    await prisma.users.update({
      where: { id: testUser.id },
      data: { status: 1 }
    });
    console.log('RESTORE executed\n');
    
    // Step 7: Verify status after restore
    console.log('Step 7: Verify status after restore');
    const afterRestore = await prisma.$queryRaw`
      SELECT id, name, email, status FROM users WHERE id = ${testUser.id}
    `;
    console.log('DB Status:', JSON.stringify(afterRestore[0], null, 2));
    console.log(`Status field value: ${afterRestore[0].status}`);
    console.log(`Status restored to 1: ${afterRestore[0].status === 1 ? '✓ YES' : '✗ NO'}\n`);
    
    // Step 8: Verify user reappears in default list
    console.log('Step 8: Verify user reappears in default list');
    const restoredListCheck = await prisma.users.findFirst({
      where: {
        id: testUser.id,
        status: 1
      }
    });
    console.log(`User in default list: ${restoredListCheck ? '✓ YES (CORRECT)' : '✗ NO (BUG!)'}\n`);
    
    console.log('=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserDeleteRestore();
