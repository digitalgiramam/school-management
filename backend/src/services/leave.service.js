const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const leaveService = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { status, employeeType, employeeId } = query;

    // employeeId query param searches both teacherId and staffId
    const where = {
      ...(status && { status }),
      ...(employeeType && { employeeType }),
      ...(employeeId && {
        OR: [{ teacherId: employeeId }, { staffId: employeeId }],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.leave.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: { select: { firstName: true, lastName: true, employeeId: true } },
          staff: { select: { firstName: true, lastName: true, employeeId: true } },
        },
      }),
      prisma.leave.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async apply(data) {
    const { employeeId, employeeType, type, startDate, endDate, reason } = data;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) throw new AppError('End date must be after start date', 400);

    const isTeacher = employeeType === 'TEACHER';
    return prisma.leave.create({
      data: {
        ...(isTeacher ? { teacherId: employeeId } : { staffId: employeeId }),
        employeeType,
        type,
        startDate: start,
        endDate: end,
        reason,
        status: 'PENDING',
      },
    });
  },

  async approve(id, data) {
    const { status, remarks, approverId } = data;
    const leave = await prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new AppError('Leave not found', 404);
    if (leave.status !== 'PENDING') throw new AppError('Leave is already processed', 400);

    return prisma.leave.update({
      where: { id },
      data: { status, remarks, approvedBy: approverId },
    });
  },

  async getMyLeaves(userId, query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const [teacher, staff] = await Promise.all([
      prisma.teacher.findUnique({ where: { userId }, select: { id: true } }),
      prisma.staff.findUnique({ where: { userId }, select: { id: true } }),
    ]);

    const where = teacher
      ? { teacherId: teacher.id }
      : staff
      ? { staffId: staff.id }
      : null;

    if (!where) return { data: [], total: 0, page: 1, limit };

    const [items, total] = await Promise.all([
      prisma.leave.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.leave.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },
};

module.exports = leaveService;
