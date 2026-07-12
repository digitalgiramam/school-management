const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const homeworkService = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { sectionId, subjectId, teacherId } = query;

    const where = {
      ...(sectionId && { sectionId }),
      ...(subjectId && { subjectId }),
      ...(teacherId && { teacherId }),
    };

    const [items, total] = await Promise.all([
      prisma.homework.findMany({
        where, skip, take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          subject: { select: { name: true, code: true } },
          section: { include: { class: { select: { name: true } } } },
          teacher: { select: { firstName: true, lastName: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.homework.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async getById(id) {
    const hw = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: true,
        section: { include: { class: true } },
        teacher: { select: { firstName: true, lastName: true } },
        submissions: {
          include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } } },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
    if (!hw) throw new AppError('Homework not found', 404);
    return hw;
  },

  async create(data) {
    const { title, description, subjectId, sectionId, teacherId, dueDate, attachments = [] } = data;
    return prisma.homework.create({
      data: { title, description, subjectId, sectionId, teacherId, dueDate: new Date(dueDate), attachments },
      include: {
        subject: { select: { name: true } },
        section: { include: { class: { select: { name: true } } } },
      },
    });
  },

  async update(id, data) {
    return prisma.homework.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  },

  async remove(id) {
    return prisma.homework.delete({ where: { id } });
  },

  async submit(homeworkId, data) {
    const { studentId, content, attachments = [] } = data;
    const hw = await prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) throw new AppError('Homework not found', 404);

    return prisma.homeworkSubmission.upsert({
      where: { homeworkId_studentId: { homeworkId, studentId } },
      create: { homeworkId, studentId, content, attachments, status: 'SUBMITTED' },
      update: { content, attachments, status: 'SUBMITTED', submittedAt: new Date() },
    });
  },

  async grade(submissionId, data) {
    const { grade, marks, feedback } = data;
    return prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: { grade: grade || String(marks || ''), feedback, status: 'GRADED' },
    });
  },
};

module.exports = homeworkService;
