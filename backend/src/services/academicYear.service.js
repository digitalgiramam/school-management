const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const coerceAcademicYear = (data) => ({
  ...data,
  ...(data.startDate && { startDate: new Date(data.startDate) }),
  ...(data.endDate && { endDate: new Date(data.endDate) }),
  ...(data.isCurrent !== undefined && {
    isCurrent: data.isCurrent === true || data.isCurrent === 'true',
  }),
});

const service = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.academicYear.findMany({ skip, take: limit, orderBy: { startDate: 'desc' } }),
      prisma.academicYear.count(),
    ]);
    return { data: items, total, page, limit };
  },
  async getById(id) {
    const item = await prisma.academicYear.findUnique({ where: { id } });
    if (!item) throw new AppError('Not found', 404);
    return item;
  },
  async create(data) {
    return prisma.academicYear.create({ data: coerceAcademicYear(data) });
  },
  async update(id, data) {
    return prisma.academicYear.update({ where: { id }, data: coerceAcademicYear(data) });
  },
  async remove(id) {
    const item = await prisma.academicYear.findUnique({
      where: { id },
      include: { _count: { select: { classes: true } } },
    });
    if (!item) throw new AppError('Not found', 404);
    if (item._count.classes > 0) throw new AppError('Cannot delete academic year with existing classes', 400);
    if (item.isCurrent) throw new AppError('Cannot delete the current academic year', 400);
    return prisma.academicYear.delete({ where: { id } });
  },
};
module.exports = service;
