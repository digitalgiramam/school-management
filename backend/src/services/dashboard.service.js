const prisma = require('../config/prisma');

const dashboardService = {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents,
      totalTeachers,
      presentToday,
      feeCollection,
      upcomingExams,
      recentAdmissions,
      pendingFeesCount,
      birthdaysToday,
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.attendance.count({ where: { date: today, status: 'PRESENT' } }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.exam.findMany({
        where: { startDate: { gte: today }, status: { in: ['PUBLISHED', 'ONGOING'] } },
        take: 5,
        orderBy: { startDate: 'asc' },
        include: { examType: true },
      }),
      prisma.student.findMany({
        where: { isActive: true },
        orderBy: { admissionDate: 'desc' },
        take: 5,
        select: { firstName: true, lastName: true, admissionDate: true, admissionNumber: true,
                  user: { select: { profilePhoto: true } } },
      }),
      prisma.feeInvoice.count({ where: { status: { in: ['UNPAID', 'OVERDUE'] } } }),
      prisma.student.findMany({
        where: {
          dateOfBirth: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
          },
          isActive: true,
        },
        select: { firstName: true, lastName: true, user: { select: { profilePhoto: true } } },
        take: 10,
      }),
    ]);

    return {
      totalStudents,
      totalTeachers,
      presentToday,
      feeCollectionToday: feeCollection._sum.amount || 0,
      upcomingExams,
      recentAdmissions,
      pendingFeesCount,
      birthdaysToday,
    };
  },

  async getAttendanceTrend(days = 7) {
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const [present, absent] = await Promise.all([
        prisma.attendance.count({ where: { date, status: 'PRESENT' } }),
        prisma.attendance.count({ where: { date, status: 'ABSENT' } }),
      ]);
      results.push({ date: date.toISOString().split('T')[0], present, absent });
    }
    return results;
  },

  async getFeeCollectionTrend(months = 6) {
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const agg = await prisma.payment.aggregate({
        where: { paidAt: { gte: d, lte: end } },
        _sum: { amount: true },
      });

      results.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        amount: agg._sum.amount || 0,
      });
    }
    return results;
  },
};

module.exports = dashboardService;
