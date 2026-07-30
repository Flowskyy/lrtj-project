const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function check() {
  const wp = await prisma.welcome_point.findFirst();
  console.log(JSON.stringify(wp, null, 2));
  await prisma.$disconnect();
}

check().catch(console.error);
