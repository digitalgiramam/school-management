const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const subjectService = {
  async getAll(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const { departmentId, isElective, sectionId, isActive } = query;

    const where = {
      ...(departmentId && { departmentId }),
      ...(isElective !== undefined && { isElective: isElective === 'true' }),
      ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // If classId provided, restrict to subjects assigned to that class via ClassSubject
    const classId = query.classId || (sectionId ? await (async () => {
      const sec = await prisma.section.findUnique({ where: { id: sectionId }, select: { classId: true } });
      return sec?.classId;
    })() : null);

    if (classId) {
      try {
        const assigned = await prisma.classSubject.findMany({
          where: { classId },
          select: { subjectId: true },
        });
        where.id = { in: assigned.map((cs) => cs.subjectId) };
      } catch {
        // class_subjects table may not exist yet (run npx prisma db push)
      }
    }

    const [items, total] = await Promise.all([
      prisma.subject.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { teacherSubjects: true } },
        },
      }),
      prisma.subject.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async getById(id) {
    const item = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: true,
        teacherSubjects: {
          include: { teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
        },
      },
    });
    if (!item) throw new AppError('Subject not found', 404);
    return item;
  },

  async create(data) {
    const { name, code, departmentId, isElective, isActive, passMark, totalMark } = data;
    if (code) {
      const exists = await prisma.subject.findFirst({ where: { code } });
      if (exists) throw new AppError('Subject code already exists', 400);
    }
    return prisma.subject.create({
      data: {
        name,
        code: code || null,
        departmentId: departmentId || null,
        isElective: isElective === true || isElective === 'true',
        isActive: isActive !== false && isActive !== 'false',
        passMark: parseFloat(passMark) || 40,
        totalMark: parseFloat(totalMark) || 100,
      },
      include: { department: { select: { name: true } } },
    });
  },

  async update(id, data) {
    const { name, code, departmentId, isElective, isActive, passMark, totalMark } = data;
    return prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code: code || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(isElective !== undefined && { isElective: isElective === true || isElective === 'true' }),
        ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
        ...(passMark !== undefined && { passMark: parseFloat(passMark) }),
        ...(totalMark !== undefined && { totalMark: parseFloat(totalMark) }),
      },
      include: { department: { select: { name: true } } },
    });
  },

  async remove(id) {
    const sub = await prisma.subject.findUnique({
      where: { id }, include: { _count: { select: { teacherSubjects: true, examSubjects: true } } },
    });
    if (!sub) throw new AppError('Subject not found', 404);
    if (sub._count.examSubjects > 0) throw new AppError('Cannot delete subject used in exams', 400);
    return prisma.subject.delete({ where: { id } });
  },
};

module.exports = subjectService;
