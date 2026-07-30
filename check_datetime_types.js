const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumnTypes() {
  const tables = [
    'welcome_point',
    'news',
    'merchandise',
    'banners',
    'popups',
    'daily_benefit',
    'users',
    'redeem',
    'redeem_benefit',
    'slc_earning_history'
  ];

  for (const table of tables) {
    try {
      const columns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM ${table}`);
      const datetimeColumns = columns.filter(col => 
        col.Type.includes('datetime') || col.Type.includes('timestamp')
      );
      console.log(`\n=== ${table} ===`);
      datetimeColumns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type}`);
      });
    } catch (error) {
      console.log(`\n=== ${table} ===`);
      console.log(`  Error: ${error.message}`);
    }
  }

  await prisma.$disconnect();
}

checkColumnTypes();
