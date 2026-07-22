const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.subject.deleteMany({});
  console.log(`Deleted ${result.count} subjects`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
