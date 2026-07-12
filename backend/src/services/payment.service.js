const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const service = {
  async getAll(query) {
    const { page, limit, skip, search, sortBy, sortOrder } = parsePaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.payment.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.payment.count(),
    ]);
    return { data: items, total, page, limit };
  },
  async getById(id) {
    const item = await prisma.payment.findUnique({ where: { id } });
    if (!item) throw new AppError('Not found', 404);
    return item;
  },
  async create(data) {
    return prisma.payment.create({ data });
  },
  async update(id, data) {
    return prisma.payment.update({ where: { id }, data });
  },
  async remove(id) {
    return prisma.payment.delete({ where: { id } });
  },
};
module.exports = service;
