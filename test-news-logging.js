const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewsLogging() {
  try {
    console.log('Checking for existing news activity logs...');
    const newsLogs = await prisma.system_activity_logs.findMany({
      where: { tableName: 'news' },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${newsLogs.length} news activity logs`);
    if (newsLogs.length > 0) {
      console.log('Latest news log:', JSON.stringify(newsLogs[0], null, 2));
    } else {
      console.log('No news activity logs found in database');
    }
    
    // Check all activity logs to see what tables are being logged
    console.log('\nChecking all activity logs by table...');
    const logsByTable = await prisma.system_activity_logs.groupBy({
      by: ['tableName'],
      _count: { tableName: true }
    });
    
    console.log('Activity logs by table:');
    logsByTable.forEach(item => {
      console.log(`  ${item.tableName}: ${item._count.tableName}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewsLogging();
