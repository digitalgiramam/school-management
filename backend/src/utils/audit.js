const prisma = require('../config/prisma');
const logger = require('../config/logger');

/**
 * Write an audit log entry (fire-and-forget — never throws).
 */
const audit = async (userId, action, resource, resourceId = null, details = null, req = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
};

module.exports = { audit };
