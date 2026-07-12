const prisma = require('../config/prisma');

const reportService = {
  async getStudentReport(query) {
    const { classId, sectionId, isActive } = query;
    const where = {
      ...(sectionId && { sectionId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(!sectionId && classId && { section: { classId } }),
    };
    return prisma.student.findMany({
      where,
      orderBy: [{ firstName: 'asc' }],
      include: {
        section: { include: { class: { include: { academicYear: true } } } },
        user: { select: { email: true, isActive: true } },
      },
    });
  },

  async getAttendanceReport(query) {
    const { sectionId, startDate, endDate } = query;
    const where = {
      ...(sectionId && { sectionId }),
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };
    const records = await prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'asc' }, { studentId: 'asc' }],
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        section: { include: { class: { select: { name: true } } } },
      },
    });

    const summary = {};
    records.forEach((r) => {
      const key = r.studentId;
      if (!summary[key]) {
        summary[key] = { student: r.student, total: 0, present: 0, absent: 0, late: 0 };
      }
      summary[key].total++;
      if (r.status === 'PRESENT') summary[key].present++;
      else if (r.status === 'ABSENT') summary[key].absent++;
      else if (r.status === 'LATE') summary[key].late++;
    });

    return Object.values(summary).map((s) => ({
      ...s,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0',
    }));
  },

  async getFeeReport(query) {
    const { startDate, endDate, classId } = query;
    const invoiceWhere = {
      ...(startDate && endDate && { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }),
      ...(classId && { student: { section: { classId } } }),
    };
    const paymentWhere = {
      // Payment model uses paidAt, not createdAt
      ...(startDate && endDate && { paidAt: { gte: new Date(startDate), lte: new Date(endDate) } }),
    };

    const [invoices, payments] = await Promise.all([
      prisma.feeInvoice.findMany({
        where: invoiceWhere,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
    // FeeInvoice has no paidAmount field — sum from nested payments
    const totalPaid = invoices.reduce(
      (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
      0
    );

    return {
      invoices,
      summary: {
        totalBilled,
        totalPaid,
        totalPending: totalBilled - totalPaid,
        paymentCount: payments._count,
        paymentTotal: payments._sum.amount || 0,
      },
    };
  },

  async getPayrollReport(query) {
    const { month, year } = query;
    const where = {
      ...(month && { month: parseInt(month) }),
      ...(year && { year: parseInt(year) }),
    };
    const salaries = await prisma.salary.findMany({
      where,
      include: {
        teacher: { select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } },
        staff: { select: { firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const total = salaries.reduce((s, r) => s + r.netSalary, 0);
    const paid = salaries.filter((r) => r.isPaid).reduce((s, r) => s + r.netSalary, 0);

    return { salaries, summary: { total, paid, pending: total - paid, count: salaries.length } };
  },
};

module.exports = reportService;
