const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const classService = {
  async getAll(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const { academicYearId, branchId } = query;

    const where = {
      ...(academicYearId && { academicYearId }),
      ...(branchId && { branchId }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      prisma.class.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: {
          academicYear: { select: { id: true, name: true, isCurrent: true } },
          branch: { select: { id: true, name: true } },
          _count: { select: { sections: true } },
        },
      }),
      prisma.class.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async getById(id) {
    const item = await prisma.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        branch: true,
        sections: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { students: true } },
          },
        },
        feeStructures: true,
      },
    });
    if (!item) throw new AppError('Class not found', 404);
    return item;
  },

  async create(data) {
    const { name, academicYearId, branchId } = data;
    const exists = await prisma.class.findUnique({
      where: { name_academicYearId_branchId: { name, academicYearId, branchId } },
    });
    if (exists) throw new AppError('Class already exists for this academic year and branch', 400);
    return prisma.class.create({
      data: { name, academicYearId, branchId },
      include: { academicYear: { select: { name: true } }, branch: { select: { name: true } } },
    });
  },

  async update(id, data) {
    return prisma.class.update({
      where: { id },
      data: { name: data.name },
      include: { academicYear: { select: { name: true } }, branch: { select: { name: true } } },
    });
  },

  async remove(id) {
    const cls = await prisma.class.findUnique({
      where: { id }, include: { _count: { select: { sections: true } } },
    });
    if (!cls) throw new AppError('Class not found', 404);
    if (cls._count.sections > 0) throw new AppError('Cannot delete class with existing sections', 400);
    return prisma.class.delete({ where: { id } });
  },
};

module.exports = classService;
