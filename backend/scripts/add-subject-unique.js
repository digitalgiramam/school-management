const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "subjects_name_key" ON "subjects"("name");`
    );
    console.log('✓ Unique index on subjects.name applied');
  } catch (e) {
    console.log('Index may already exist:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
