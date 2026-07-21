const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const classService = {
  async getAll(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const { academicYearId, branchId, isActive } = query;

    const where = {
      ...(academicYearId && { academicYearId }),
      ...(branchId && { branchId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      prisma.class.findMany({
        where, skip, take: limit,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
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
        classSubjects: {
          include: { subject: { select: { id: true, name: true, code: true, isActive: true } } },
          orderBy: { subject: { name: 'asc' } },
        },
        feeStructures: true,
      },
    });
    if (!item) throw new AppError('Class not found', 404);
    return item;
  },

  async create(data) {
    const { name, academicYearId, branchId, displayOrder } = data;

    // Auto-resolve academicYearId if not provided
    let ayId = academicYearId;
    if (!ayId) {
      const current = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      if (!current) throw new AppError('No current academic year set. Please configure it in Settings.', 400);
      ayId = current.id;
    }

    // Auto-resolve branchId if not provided
    let brId = branchId;
    if (!brId) {
      const first = await prisma.branch.findFirst({ orderBy: { name: 'asc' } });
      if (!first) throw new AppError('No branch configured. Please add a branch in Settings.', 400);
      brId = first.id;
    }

    const exists = await prisma.class.findUnique({
      where: { name_academicYearId_branchId: { name, academicYearId: ayId, branchId: brId } },
    });
    if (exists) throw new AppError('Class already exists for this academic year', 400);

    return prisma.class.create({
      data: {
        name,
        academicYearId: ayId,
        branchId: brId,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: true,
      },
      include: {
        academicYear: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });
  },

  async update(id, data) {
    const { name, displayOrder, isActive } = data;
    return prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) || 0 }),
        ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
      },
      include: {
        academicYear: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });
  },

  async remove(id) {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { sections: true } } },
    });
    if (!cls) throw new AppError('Class not found', 404);
    if (cls._count.sections > 0) throw new AppError('Cannot delete class with enrolled sections. Remove students first.', 400);
    return prisma.class.delete({ where: { id } });
  },
};

module.exports = classService;
