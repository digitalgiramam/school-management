const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');
const { sendMail, emailTemplates } = require('../config/mailer');

const studentService = {
  async getAll(query) {
    const { page, limit, skip, search, sortBy, sortOrder } = parsePaginationParams(query);
    const { sectionId, classId, academicYearId, isActive } = query;

    const where = {
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(sectionId && { sectionId }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { email: true, profilePhoto: true } },
          section: { include: { class: true } },
          parent: { select: { firstName: true, lastName: true, phone: true } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return { students, total, page, limit };
  },

  async getById(id) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, profilePhoto: true, lastLoginAt: true } },
        section: { include: { class: { include: { academicYear: true } } } },
        parent: true,
        medicalInfo: true,
        documents: true,
        hostelAllocation: { include: { room: { include: { hostel: true } } } },
        busAllocations: { include: { bus: true, route: true } },
      },
    });
    if (!student) throw new AppError('Student not found', 404);
    return student;
  },

  async create(data) {
    const { email, sectionId, parentId, ...studentData } = data;

    // Generate temp password
    const tempPassword = `School@${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, config.bcrypt.rounds);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, role: 'STUDENT' },
      });

      const student = await tx.student.create({
        data: {
          ...studentData,
          userId: user.id,
          // Coerce types — form data arrives as strings
          ...(studentData.dateOfBirth && { dateOfBirth: new Date(studentData.dateOfBirth) }),
          ...(studentData.admissionDate && { admissionDate: new Date(studentData.admissionDate) }),
          ...(studentData.isActive !== undefined && {
            isActive: studentData.isActive === true || studentData.isActive === 'true',
          }),
          ...(sectionId && { sectionId }),
          ...(parentId && { parentId }),
        },
        include: { user: { select: { email: true } }, section: true },
      });

      return { student, tempPassword };
    });

    // Send welcome email (non-blocking)
    sendMail(
      email,
      'Welcome — Your Student Account',
      emailTemplates.welcomeUser(
        `${result.student.firstName} ${result.student.lastName}`,
        'STUDENT',
        tempPassword
      )
    ).catch(() => {});

    return result.student;
  },

  async update(id, data) {
    const { email, ...studentData } = data;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Student not found', 404);

    return prisma.student.update({
      where: { id },
      data: {
        ...studentData,
        ...(studentData.dateOfBirth && { dateOfBirth: new Date(studentData.dateOfBirth) }),
        ...(studentData.admissionDate && { admissionDate: new Date(studentData.admissionDate) }),
        ...(studentData.isActive !== undefined && {
          isActive: studentData.isActive === true || studentData.isActive === 'true',
        }),
      },
      include: { section: true, user: { select: { email: true } } },
    });
  },

  async deactivate(id) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Student not found', 404);

    return prisma.$transaction([
      prisma.student.update({ where: { id }, data: { isActive: false } }),
      prisma.user.update({ where: { id: student.userId }, data: { isActive: false } }),
    ]);
  },

  async promote(id, toSectionId, remarks) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError('Student not found', 404);

    return prisma.$transaction([
      prisma.student.update({ where: { id }, data: { sectionId: toSectionId } }),
      prisma.studentPromotion.create({
        data: {
          studentId: id,
          fromSection: student.sectionId || '',
          toSection: toSectionId,
          remarks,
        },
      }),
    ]);
  },

  async getAttendanceSummary(studentId, month, year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const records = await prisma.attendance.findMany({
      where: { studentId, date: { gte: start, lte: end } },
    });

    const summary = records.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, HALF_DAY: 0 }
    );

    summary.total = records.length;
    summary.percentage =
      summary.total > 0
        ? ((summary.PRESENT + summary.HALF_DAY * 0.5) / summary.total) * 100
        : 0;

    return summary;
  },
};

module.exports = studentService;
