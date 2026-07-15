const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const coerceHoliday = (data) => ({
  ...data,
  ...(data.date && { date: new Date(data.date) }),
  ...(data.isPublic !== undefined && {
    isPublic: data.isPublic === true || data.isPublic === 'true',
  }),
});

const service = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.holiday.findMany({ skip, take: limit, orderBy: { date: 'asc' } }),
      prisma.holiday.count(),
    ]);
    return { data: items, total, page, limit };
  },
  async getById(id) {
    const item = await prisma.holiday.findUnique({ where: { id } });
    if (!item) throw new AppError('Not found', 404);
    return item;
  },
  async create(data) {
    return prisma.holiday.create({ data: coerceHoliday(data) });
  },
  async update(id, data) {
    return prisma.holiday.update({ where: { id }, data: coerceHoliday(data) });
  },
  async remove(id) {
    return prisma.holiday.delete({ where: { id } });
  },
};
module.exports = service;
