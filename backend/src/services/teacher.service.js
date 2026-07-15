const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const teacherService = {
  async getAll(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const { departmentId, isActive } = query;

    const where = {
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: {
          user: { select: { email: true, profilePhoto: true, isActive: true } },
          department: { select: { id: true, name: true } },
          _count: { select: { sections: true, subjects: true } },
        },
      }),
      prisma.teacher.count({ where }),
    ]);

    return { data: items, total, page, limit };
  },

  async getById(id) {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, profilePhoto: true, lastLoginAt: true, isActive: true } },
        department: true,
        sections: { include: { class: { select: { name: true } } } },
        subjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            section: { select: { id: true, name: true, class: { select: { name: true } } } },
          },
        },
        salaries: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
        leaves: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { sections: true, subjects: true, teacherAttendances: true, homeworks: true } },
      },
    });
    if (!teacher) throw new AppError('Teacher not found', 404);
    return teacher;
  },

  async create(data) {
    const { email, password, firstName, lastName, employeeId, departmentId,
            phone, address, qualification, experience, dateOfBirth, gender,
            joiningDate, subjectIds = [] } = data;

    const [emailExists, empExists] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.teacher.findUnique({ where: { employeeId } }),
    ]);
    if (emailExists) throw new AppError('Email already in use', 400);
    if (empExists) throw new AppError('Employee ID already exists', 400);

    const hashedPassword = await bcrypt.hash(password || 'School@1234', config.bcrypt.rounds);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, role: 'TEACHER' },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          firstName,
          lastName,
          departmentId: departmentId || null,
          phone,
          address,
          qualification,
          experience: experience ? parseInt(experience) : null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        },
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: { select: { id: true, name: true } },
        },
      });

      if (subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjectIds.map((subjectId) => ({ teacherId: teacher.id, subjectId })),
          skipDuplicates: true,
        });
      }

      return teacher;
    });
  },

  async update(id, data) {
    const { firstName, lastName, phone, address, qualification, experience,
            departmentId, dateOfBirth, gender, joiningDate, isActive } = data;

    return prisma.teacher.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        phone,
        address,
        qualification,
        experience: experience !== undefined ? parseInt(experience) : undefined,
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender && { gender }),
        ...(joiningDate && { joiningDate: new Date(joiningDate) }),
        ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
      },
      include: {
        user: { select: { email: true, profilePhoto: true } },
        department: { select: { id: true, name: true } },
      },
    });
  },

  async deactivate(id) {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new AppError('Teacher not found', 404);
    await prisma.$transaction([
      prisma.teacher.update({ where: { id }, data: { isActive: false } }),
      prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } }),
    ]);
  },

  async assignSubjects(teacherId, subjectIds) {
    await prisma.teacherSubject.deleteMany({ where: { teacherId } });
    if (subjectIds.length > 0) {
      await prisma.teacherSubject.createMany({
        data: subjectIds.map((subjectId) => ({ teacherId, subjectId })),
        skipDuplicates: true,
      });
    }
    return teacherService.getById(teacherId);
  },

  async getAttendanceSummary(teacherId, query) {
    const m = parseInt(query.month) || new Date().getMonth() + 1;
    const y = parseInt(query.year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    const records = await prisma.teacherAttendance.findMany({
      where: { teacherId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    const summary = { total: records.length, present: 0, absent: 0, late: 0, halfDay: 0 };
    records.forEach((r) => {
      if (r.status === 'PRESENT') summary.present++;
      else if (r.status === 'ABSENT') summary.absent++;
      else if (r.status === 'LATE') summary.late++;
      else if (r.status === 'HALF_DAY') summary.halfDay++;
    });

    return { ...summary, records };
  },
};

module.exports = teacherService;
