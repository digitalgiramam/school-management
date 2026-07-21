const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const sectionService = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { classId, isActive } = query;

    // If classId is provided, use ClassSection mapping (new way) OR fall back to classId on section
    let where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    if (classId) {
      // Return sections mapped to this class via ClassSection
      const mappings = await prisma.classSection.findMany({
        where: { classId },
        select: { sectionId: true },
      });
      const sectionIds = mappings.map((m) => m.sectionId);
      // Also include sections with direct classId (backward compat)
      const directSections = await prisma.section.findMany({
        where: { classId, ...where },
        select: { id: true },
      });
      const allIds = [...new Set([...sectionIds, ...directSections.map((s) => s.id)])];
      where.id = { in: allIds };
    }

    const [items, total] = await Promise.all([
      prisma.section.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: {
          class: { select: { id: true, name: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { students: true } },
        },
      }),
      prisma.section.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async getById(id) {
    const item = await prisma.section.findUnique({
      where: { id },
      include: {
        class: { include: { academicYear: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        students: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true,
            user: { select: { profilePhoto: true } },
          },
          where: { isActive: true },
          orderBy: { firstName: 'asc' },
        },
        _count: { select: { students: true } },
      },
    });
    if (!item) throw new AppError('Section not found', 404);
    return item;
  },

  async create(data) {
    const { name, classId, teacherId, capacity, isActive } = data;

    // Check duplicate name (for master sections: unique globally; for class sections: unique per class)
    if (classId) {
      const exists = await prisma.section.findFirst({ where: { name, classId } });
      if (exists) throw new AppError('Section with this name already exists in this class', 400);
    } else {
      const exists = await prisma.section.findFirst({ where: { name, classId: null } });
      if (exists) throw new AppError('Section with this name already exists', 400);
    }

    return prisma.section.create({
      data: {
        name,
        classId: classId || null,
        teacherId: teacherId || null,
        capacity: parseInt(capacity) || 40,
        isActive: isActive !== false && isActive !== 'false',
      },
      include: {
        class: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async update(id, data) {
    const { name, teacherId, capacity, isActive } = data;
    return prisma.section.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(teacherId !== undefined && { teacherId: teacherId || null }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
      },
      include: {
        class: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async remove(id) {
    const sec = await prisma.section.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!sec) throw new AppError('Section not found', 404);
    if (sec._count.students > 0) throw new AppError('Cannot delete section with enrolled students', 400);
    return prisma.section.delete({ where: { id } });
  },
};

module.exports = sectionService;
