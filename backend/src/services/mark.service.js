const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

// Helper to coerce Mark fields from strings (form submissions) to correct types
const coerceMark = (data) => ({
  ...data,
  ...(data.marksObtained !== undefined && {
    marksObtained: data.marksObtained !== null && data.marksObtained !== ''
      ? parseFloat(data.marksObtained)
      : null,
  }),
  ...(data.gradePoint !== undefined && {
    gradePoint: data.gradePoint !== null && data.gradePoint !== ''
      ? parseFloat(data.gradePoint)
      : null,
  }),
  ...(data.isAbsent !== undefined && {
    isAbsent: data.isAbsent === true || data.isAbsent === 'true',
  }),
});

const service = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.mark.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.mark.count(),
    ]);
    return { data: items, total, page, limit };
  },
  async getById(id) {
    const item = await prisma.mark.findUnique({ where: { id } });
    if (!item) throw new AppError('Not found', 404);
    return item;
  },
  async create(data) {
    return prisma.mark.create({ data: coerceMark(data) });
  },
  async update(id, data) {
    return prisma.mark.update({ where: { id }, data: coerceMark(data) });
  },
  async remove(id) {
    return prisma.mark.delete({ where: { id } });
  },
};
module.exports = service;
