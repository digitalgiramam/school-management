const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');

const classSectionService = {
  /** Get all sections mapped to a class */
  async getByClass(classId) {
    const rows = await prisma.classSection.findMany({
      where: { classId },
      include: {
        section: { select: { id: true, name: true, isActive: true, capacity: true } },
      },
      orderBy: { section: { name: 'asc' } },
    });
    return rows.map((r) => ({ mappingId: r.id, ...r.section }));
  },

  /** Assign a section to a class */
  async assign(classId, sectionId) {
    const [cls, sec] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.section.findUnique({ where: { id: sectionId } }),
    ]);
    if (!cls) throw new AppError('Class not found', 404);
    if (!sec) throw new AppError('Section not found', 404);

    return prisma.classSection.upsert({
      where: { classId_sectionId: { classId, sectionId } },
      create: { classId, sectionId },
      update: {},
    });
  },

  /** Remove a section from a class */
  async remove(classId, sectionId) {
    const row = await prisma.classSection.findUnique({
      where: { classId_sectionId: { classId, sectionId } },
    });
    if (!row) throw new AppError('Mapping not found', 404);
    return prisma.classSection.delete({ where: { id: row.id } });
  },

  /** Bulk save: replace all section+subject mappings for a class in one call */
  async saveMapping(classId, sectionIds, subjectIds) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new AppError('Class not found', 404);

    await prisma.$transaction([
      // Replace section mappings
      prisma.classSection.deleteMany({ where: { classId } }),
      ...(sectionIds?.length ? [prisma.classSection.createMany({
        data: sectionIds.map((sectionId) => ({ classId, sectionId })),
        skipDuplicates: true,
      })] : []),
      // Replace subject mappings
      prisma.classSubject.deleteMany({ where: { classId } }),
      ...(subjectIds?.length ? [prisma.classSubject.createMany({
        data: subjectIds.map((subjectId) => ({ classId, subjectId })),
        skipDuplicates: true,
      })] : []),
    ]);

    return {
      sections: await classSectionService.getByClass(classId),
      subjects: await prisma.classSubject.findMany({
        where: { classId },
        include: { subject: { select: { id: true, name: true, code: true } } },
      }),
    };
  },
};

module.exports = classSectionService;
