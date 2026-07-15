const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');

const examService = {
  async getAll(query) {
    const { academicYearId, status } = query;
    return prisma.exam.findMany({
      where: {
        ...(status && { status }),
        ...(academicYearId && { examType: { academicYearId } }),
      },
      include: { examType: true, subjects: { include: { subject: true } }, _count: { select: { subjects: true } } },
      orderBy: { startDate: 'desc' },
    });
  },

  async getById(id) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { examType: true, subjects: { include: { subject: true } } },
    });
    if (!exam) throw new AppError('Exam not found', 404);
    return exam;
  },

  async create(data) {
    const { subjects, ...examData } = data;
    return prisma.exam.create({
      data: {
        ...examData,
        startDate: new Date(examData.startDate),
        endDate: new Date(examData.endDate),
        ...(subjects && {
          subjects: {
            create: subjects.map((s) => ({
              ...s,
              date: new Date(s.date),
              maxMark: parseFloat(s.maxMark),
              passMark: parseFloat(s.passMark),
            })),
          },
        }),
      },
      include: { examType: true, subjects: { include: { subject: true } } },
    });
  },

  async update(id, data) {
    return prisma.exam.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
    });
  },

  async remove(id) {
    const exam = await prisma.exam.findUnique({ where: { id }, include: { _count: { select: { subjects: true } } } });
    if (!exam) throw new AppError('Exam not found', 404);
    return prisma.exam.delete({ where: { id } });
  },

  async saveBulkMarks(examSubjectId, marksData) {
    const examSubject = await prisma.examSubject.findUnique({ where: { id: examSubjectId } });
    if (!examSubject) throw new AppError('Exam subject not found', 404);
    const gradeSetting = await prisma.gradeSetting.findMany({ orderBy: { minMark: 'asc' } });
    const calculateGrade = (marks, max) => {
      const pct = (marks / max) * 100;
      const gs = gradeSetting.find((g) => pct >= g.minMark && pct <= g.maxMark);
      return gs ? { grade: gs.grade, gradePoint: gs.gradePoint } : { grade: 'F', gradePoint: 0 };
    };
    const upserts = marksData.map((m) => {
      const isAbsent = m.isAbsent === true || m.isAbsent === 'true';
      const marksObtained = m.marksObtained !== undefined && m.marksObtained !== null
        ? parseFloat(m.marksObtained) : null;
      const { grade, gradePoint } = isAbsent
        ? { grade: 'AB', gradePoint: 0 }
        : calculateGrade(marksObtained, examSubject.maxMark);
      return prisma.mark.upsert({
        where: { studentId_examSubjectId: { studentId: m.studentId, examSubjectId } },
        update: { marksObtained, grade, gradePoint, isAbsent, remarks: m.remarks },
        create: { studentId: m.studentId, examSubjectId, marksObtained, grade, gradePoint, isAbsent, remarks: m.remarks },
      });
    });
    return prisma.$transaction(upserts);
  },

  async getReportCard(studentId, examId) {
    const marks = await prisma.mark.findMany({
      where: { studentId, examSubject: { examId } },
      include: { examSubject: { include: { subject: true, exam: { include: { examType: true } } } } },
    });
    if (!marks.length) throw new AppError('No marks found', 404);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { section: { include: { class: { include: { academicYear: true } } } } },
    });
    const totalMarks = marks.reduce((s, m) => s + (m.marksObtained || 0), 0);
    const maxMarks = marks.reduce((s, m) => s + m.examSubject.maxMark, 0);
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    const gpa = marks.reduce((s, m) => s + (m.gradePoint || 0), 0) / marks.length;
    return { student, marks, totalMarks, maxMarks, percentage, gpa, result: percentage >= 33 ? 'PASS' : 'FAIL' };
  },

  async getRankList(query) {
    const { examId, sectionId } = query;
    const marks = await prisma.mark.findMany({
      where: { examSubject: { examId, ...(sectionId && { sectionId }) } },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } },
    });
    const studentMarks = marks.reduce((acc, m) => {
      if (!acc[m.studentId]) acc[m.studentId] = { student: m.student, total: 0 };
      acc[m.studentId].total += m.marksObtained || 0;
      return acc;
    }, {});
    return Object.values(studentMarks).sort((a, b) => b.total - a.total).map((s, i) => ({ ...s, rank: i + 1 }));
  },
};

module.exports = examService;
