const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');

const classSubjectService = {
  /** Return all subjects assigned to a class, with full subject info */
  async getByClass(classId) {
    try { await prisma.$queryRaw`SELECT 1 FROM class_subjects LIMIT 1`; }
    catch { return []; } // table doesn't exist yet — run npx prisma db push

    const rows = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: {
          select: { id: true, name: true, code: true, isElective: true, department: { select: { name: true } } },
        },
      },
      orderBy: { subject: { name: 'asc' } },
    });
    return rows.map((r) => ({ mappingId: r.id, ...r.subject }));
  },

  /** Assign a subject to a class (idempotent) */
  async assign(classId, subjectId) {
    // Verify class & subject exist
    const [cls, sub] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
    ]);
    if (!cls) throw new AppError('Class not found', 404);
    if (!sub) throw new AppError('Subject not found', 404);

    return prisma.classSubject.upsert({
      where: { classId_subjectId: { classId, subjectId } },
      create: { classId, subjectId },
      update: {},
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });
  },

  /** Remove a subject from a class */
  async remove(classId, subjectId) {
    const row = await prisma.classSubject.findUnique({
      where: { classId_subjectId: { classId, subjectId } },
    });
    if (!row) throw new AppError('Mapping not found', 404);
    return prisma.classSubject.delete({ where: { id: row.id } });
  },

  /** Bulk-replace: set exactly these subjects for a class */
  async setSubjects(classId, subjectIds) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new AppError('Class not found', 404);

    await prisma.classSubject.deleteMany({ where: { classId } });
    if (!subjectIds?.length) return [];

    await prisma.classSubject.createMany({
      data: subjectIds.map((subjectId) => ({ classId, subjectId })),
      skipDuplicates: true,
    });
    return classSubjectService.getByClass(classId);
  },
};

module.exports = classSubjectService;
