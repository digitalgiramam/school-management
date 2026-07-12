const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const service = {
  async getAll(query) {
    const { page, limit, skip, search, sortBy, sortOrder } = parsePaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.academicYear.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
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
    return prisma.academicYear.create({ data });
  },
  async update(id, data) {
    return prisma.academicYear.update({ where: { id }, data });
  },
  async remove(id) {
    return prisma.academicYear.delete({ where: { id } });
  },
};
module.exports = service;
