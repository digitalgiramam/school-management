const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');

const attendanceService = {
  /**
   * Return sections the calling user is allowed to mark/view attendance for.
   * Admins → all sections.
   * Teachers → sections where they are class teacher + sections where they teach a subject.
   * Others → empty (handled separately in controller).
   */
  async getAccessibleSections(userId, role) {
    const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
    if (ADMINS.includes(role)) {
      // Only return sections that are associated with a class (skip independent master sections)
      const direct = await prisma.section.findMany({
        where: { classId: { not: null } },
        include: { class: { select: { id: true, name: true } } },
        orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
      });
      // Also include sections mapped via ClassSection (independent sections assigned to a class)
      let mappedIds = [];
      try {
        const mappings = await prisma.classSection.findMany({
          select: { sectionId: true },
        });
        mappedIds = mappings.map((m) => m.sectionId);
      } catch { /* class_sections table may not exist yet */ }

      if (mappedIds.length > 0) {
        const mapped = await prisma.section.findMany({
          where: { id: { in: mappedIds }, classId: null },
          include: { class: { select: { id: true, name: true } } },
          orderBy: { name: 'asc' },
        });
        // Combine and deduplicate
        const seen = new Set(direct.map((s) => s.id));
        for (const s of mapped) {
          if (!seen.has(s.id)) { direct.push(s); seen.add(s.id); }
        }
      }
      return direct.sort((a, b) =>
        (a.class?.name || '').localeCompare(b.class?.name || '') || a.name.localeCompare(b.name)
      );
    }

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        include: {
          // sections where this teacher is the class teacher
          sections: {
            include: { class: { select: { id: true, name: true } } },
          },
          // sections where this teacher teaches a subject
          subjects: {
            where: { sectionId: { not: null } },
            include: {
              section: { include: { class: { select: { id: true, name: true } } } },
            },
          },
        },
      });
      if (!teacher) return [];

      const sectionMap = new Map();
      teacher.sections.forEach((s) => sectionMap.set(s.id, s));
      teacher.subjects.forEach((ts) => {
        if (ts.section) sectionMap.set(ts.section.id, ts.section);
      });
      return Array.from(sectionMap.values()).sort((a, b) =>
        (a.class?.name || '').localeCompare(b.class?.name || '') ||
        a.name.localeCompare(b.name)
      );
    }

    return [];
  },

  /**
   * Mark attendance for all students in a section on a given date.
   * markedBy is the teacher's id (resolved from userId by controller).
   */
  async markBulk(sectionId, date, records, markedBy) {
    const dateObj = new Date(date);

    const upserts = records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date: dateObj } },
        update: { status: r.status, remarks: r.remarks || null, markedBy },
        create: {
          studentId: r.studentId,
          sectionId,
          date: dateObj,
          status: r.status,
          remarks: r.remarks || null,
          markedBy,
        },
      })
    );

    return prisma.$transaction(upserts);
  },

  /**
   * Returns students in a section with their attendance status for the given date.
   * Each item: { id, firstName, lastName, admissionNumber, user, attendance }
   */
  async getBySection(sectionId, date) {
    const dateObj = new Date(date);

    const students = await prisma.student.findMany({
      where: { sectionId, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        user: { select: { profilePhoto: true } },
      },
      orderBy: { firstName: 'asc' },
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
