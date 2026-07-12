const prisma = require('../config/prisma');
const { parsePaginationParams } = require('../utils/pagination');

const notificationService = {
  async getAll(userId, query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { isRead } = query;
    const where = {
      userId,
      ...(isRead !== undefined && { isRead: isRead === 'true' }),
    };
    const [items, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { sentAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
    return { data: items, total, page, limit, unreadCount };
  },

  async markRead(id, userId) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  async markAllRead(userId) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },

  async create(data) {
    const { userId, title, body, type = 'IN_APP', metadata } = data;
    return prisma.notification.create({ data: { userId, title, body, type, metadata } });
  },
};

module.exports = notificationService;
