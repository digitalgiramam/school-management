const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const sectionService = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { classId } = query;

    const where = { ...(classId && { classId }) };

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
          select: { id: true, firstName: true, lastName: true, admissionNumber: true, user: { select: { profilePhoto: true } } },
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
    const { name, classId, teacherId, capacity } = data;
    const exists = await prisma.section.findUnique({ where: { name_classId: { name, classId } } });
    if (exists) throw new AppError('Section already exists in this class', 400);
    return prisma.section.create({
      data: { name, classId, teacherId: teacherId || null, capacity: parseInt(capacity) || 40 },
      include: {
        class: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async update(id, data) {
    return prisma.section.update({
      where: { id },
      data: {
        name: data.name,
        teacherId: data.teacherId || null,
        capacity: data.capacity ? parseInt(data.capacity) : undefined,
      },
      include: {
        class: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async remove(id) {
    const sec = await prisma.section.findUnique({
      where: { id }, include: { _count: { select: { students: true } } },
    });
    if (!sec) throw new AppError('Section not found', 404);
    if (sec._count.students > 0) throw new AppError('Cannot delete section with enrolled students', 400);
    return prisma.section.delete({ where: { id } });
  },
};

module.exports = sectionService;
