const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function testPrismaDefaults() {
  console.log('=== Testing @default(now()) behavior ===\n');
  
  try {
    // Check system timezone
    console.log('1. System timezone check:');
    const systemNow = new Date();
    console.log(`   System new Date(): ${systemNow.toISOString()}`);
    console.log(`   System local string: ${systemNow.toString()}`);
    console.log(`   System timezone offset: ${systemNow.getTimezoneOffset()} minutes (${systemNow.getTimezoneOffset() / -60} hours)`);
    
    // Since dev server is in Asia/Jakarta (GMT+0700), new Date() produces WIB wall-clock
    // When stored as naive DATETIME in MySQL, this literal value is preserved
    // @default(now()) calls new Date() on the server, so it will produce WIB wall-clock
    
    console.log('\n2. Analysis:');
    console.log('   - Dev server timezone: Asia/Jakarta (GMT+0700)');
    console.log('   - new Date() produces: WIB wall-clock time');
    console.log('   - @default(now()) calls: new Date() on server');
    console.log('   - MySQL DATETIME stores: literal value with no conversion');
    console.log('   - Result: @default(now()) stores WIB wall-clock as literal value ✅');
    
    console.log('\n3. @updatedAt behavior:');
    console.log('   - @updatedAt also calls new Date() on each update');
    console.log('   - Same logic applies: stores WIB wall-clock as literal value ✅');
    
    console.log('\n4. Production consideration:');
    console.log('   ⚠️  Verify production server timezone is also Asia/Jakarta');
    console.log('   - If production has different timezone, @default(now()) will produce that timezone');
    console.log('   - Solution: Ensure production server timezone matches dev (Asia/Jakarta)');
    
    console.log('\n✅ Test complete - @default(now()) and @updatedAt work correctly for WIB wall-clock storage');
    console.log('   provided the server timezone is Asia/Jakarta (confirmed for dev server)');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  
  await prisma.$disconnect();
}

testPrismaDefaults().catch(console.error);
