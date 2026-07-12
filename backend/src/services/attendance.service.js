const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');

const attendanceService = {
  /**
   * Mark attendance for all students in a section on a given date.
   * @param {string} sectionId
   * @param {string} date  ISO date string "YYYY-MM-DD"
   * @param {Array}  records [{ studentId, status, remarks }]
   * @param {string} markedBy  teacherId
   */
  async markBulk(sectionId, date, records, markedBy) {
    const dateObj = new Date(date);

    const upserts = records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date: dateObj } },
        update: { status: r.status, remarks: r.remarks, markedBy },
        create: {
          studentId: r.studentId,
          sectionId,
          date: dateObj,
          status: r.status,
          remarks: r.remarks,
          markedBy,
        },
      })
    );

    return prisma.$transaction(upserts);
  },

  async getBySection(sectionId, date) {
    const dateObj = new Date(date);
    // Get all students in section
    const students = await prisma.student.findMany({
      where: { sectionId, isActive: true },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true,
                user: { select: { profilePhoto: true } } },
    });

    const existing = await prisma.attendance.findMany({
      where: { sectionId, date: dateObj },
    });

    const attendanceMap = Object.fromEntries(existing.map((a) => [a.studentId, a]));

    return students.map((s) => ({
      ...s,
      attendance: attendanceMap[s.id] || { status: 'NOT_MARKED' },
    }));
  },

  async getStudentAttendance(studentId, startDate, endDate) {
    return prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      orderBy: { date: 'asc' },
    });
  },

  async getDailyReport(branchId, date) {
    const dateObj = new Date(date);
    const records = await prisma.attendance.groupBy({
      by: ['status'],
      where: { date: dateObj, section: { class: { branchId } } },
      _count: { status: true },
    });
    return records.map((r) => ({ status: r.status, count: r._count.status }));
  },
};

module.exports = attendanceService;
