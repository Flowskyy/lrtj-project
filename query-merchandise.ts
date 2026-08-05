import { PrismaClient } from './lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  const keyko = await prisma.merchandise.findFirst({
    where: { name: { contains: 'Keyko' } },
    select: { id: true, name: true, description: true }
  })

  const paradigm = await prisma.merchandise.findFirst({
    where: { name: { contains: 'Paradigm' } },
    select: { id: true, name: true, description: true }
  })

  console.log('=== KEYKO GANTENG ===')
  console.log(JSON.stringify(keyko, null, 2))
  console.log('\n=== PARADIGM FITNESS #TRIAL ===')
  console.log(JSON.stringify(paradigm, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
