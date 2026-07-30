const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.welcome_point.findFirst({ orderBy: { id: 'asc' } })
  .then(wp => {
    console.log(JSON.stringify(wp, null, 2));
    prisma.$disconnect();
  })
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
  });
