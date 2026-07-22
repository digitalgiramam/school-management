const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.subject.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`Found ${all.length} subjects total`);

  // Group by name
  const byName = {};
  for (const s of all) {
    if (!byName[s.name]) byName[s.name] = [];
    byName[s.name].push(s);
  }

  // Delete duplicates (keep the first/oldest, delete the rest)
  let deleted = 0;
  for (const [name, rows] of Object.entries(byName)) {
    if (rows.length > 1) {
      const toDelete = rows.slice(1).map((r) => r.id);
      console.log(`  Deduping "${name}" — keeping ${rows[0].id}, deleting ${toDelete.length}`);
      // Delete dependent records first to avoid FK violations
      await prisma.teacherSubject.deleteMany({ where: { subjectId: { in: toDelete } } });
      await prisma.classSubject.deleteMany({ where: { subjectId: { in: toDelete } } });
      await prisma.timetableSlot.deleteMany({ where: { subjectId: { in: toDelete } } });
      await prisma.homework.deleteMany({ where: { subjectId: { in: toDelete } } });
      await prisma.subject.deleteMany({ where: { id: { in: toDelete } } });
      deleted += toDelete.length;
    }
  }

  console.log(`✓ Deleted ${deleted} duplicate subjects`);

  // Now add unique index
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "subjects_name_key" ON "subjects"("name");`
    );
    console.log('✓ Unique index on subjects.name applied');
  } catch (e) {
    console.log('Index note:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
