const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const service = {
  async getAll(query) {
    const { page, limit, skip, sortBy = 'createdAt', sortOrder = 'desc', search } = parsePaginationParams(query);
    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    } : {};
    const [items, total] = await Promise.all([
      prisma.parent.findMany({
        where, skip, take: limit, orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { students: true } } },
      }),
      prisma.parent.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async getById(id) {
    const item = await prisma.parent.findUnique({
      where: { id },
      include: { students: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } },
    });
    if (!item) throw new AppError('Parent not found', 404);
    return item;
  },

  async create(data) {
    return prisma.parent.create({ data });
  },

  async update(id, data) {
    return prisma.parent.update({ where: { id }, data });
  },

  async remove(id) {
    const p = await prisma.parent.findUnique({ where: { id }, include: { _count: { select: { students: true } } } });
    if (!p) throw new AppError('Parent not found', 404);
    if (p._count.students > 0) throw new AppError('Cannot delete parent with linked students', 400);
    return prisma.parent.delete({ where: { id } });
  },
};
module.exports = service;
