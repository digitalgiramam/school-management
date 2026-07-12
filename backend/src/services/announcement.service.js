const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const announcementService = {
  async getAll(query, userRole) {
    const { page, limit, skip } = parsePaginationParams(query);
    const now = new Date();
    const where = {
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      OR: [{ targetRole: null }, { targetRole: userRole }],
    };
    const [items, total] = await Promise.all([
      prisma.announcement.findMany({ where, skip, take: limit, orderBy: { publishedAt: 'desc' } }),
      prisma.announcement.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async create(data) {
    const { title, content, targetRole, publishedBy, expiresAt } = data;
    return prisma.announcement.create({
      data: {
        title, content,
        targetRole: targetRole || null,
        publishedBy,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
  },

  async update(id, data) {
    const { title, content, targetRole, expiresAt } = data;
    return prisma.announcement.update({
      where: { id },
      data: { title, content, targetRole: targetRole || null, expiresAt: expiresAt ? new Date(expiresAt) : null },
    });
  },

  async remove(id) {
    return prisma.announcement.delete({ where: { id } });
  },
};

module.exports = announcementService;
