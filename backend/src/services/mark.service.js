const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const service = {
  async getAll(query) {
    const { page, limit, skip, search, sortBy, sortOrder } = parsePaginationParams(query);
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
    return prisma.mark.create({ data });
  },
  async update(id, data) {
    return prisma.mark.update({ where: { id }, data });
  },
  async remove(id) {
    return prisma.mark.delete({ where: { id } });
  },
};
module.exports = service;
