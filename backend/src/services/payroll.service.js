const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const payrollService = {
  async getAll(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { month, year, employeeType, isPaid } = query;

    const where = {
      ...(month && { month: parseInt(month) }),
      ...(year && { year: parseInt(year) }),
      ...(employeeType && { employeeType }),
      ...(isPaid !== undefined && { isPaid: isPaid === 'true' }),
    };

    const [items, total] = await Promise.all([
      prisma.salary.findMany({
        where, skip, take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          teacher: { select: { firstName: true, lastName: true, employeeId: true } },
          staff: { select: { firstName: true, lastName: true, employeeId: true } },
        },
      }),
      prisma.salary.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async generate(data) {
    const { month, year, employeeType, basicSalary, allowances = 0, deductions = 0, employeeIds = [] } = data;

    const m = parseInt(month);
    const y = parseInt(year);
    const basic = parseFloat(basicSalary);
    const allow = parseFloat(allowances);
    const deduct = parseFloat(deductions);
    const net = basic + allow - deduct;

    const isTeacher = employeeType === 'TEACHER';
    let targetIds = employeeIds;

    if (!targetIds.length) {
      if (isTeacher) {
        const teachers = await prisma.teacher.findMany({ where: { isActive: true }, select: { id: true } });
        targetIds = teachers.map((t) => t.id);
      } else {
        const staff = await prisma.staff.findMany({ where: { isActive: true }, select: { id: true } });
        targetIds = staff.map((s) => s.id);
      }
    }

    const created = [];
    for (const empId of targetIds) {
      try {
        // Check for existing record using the right FK field
        const whereClause = isTeacher
          ? { teacherId: empId, month: m, year: y }
          : { staffId: empId, month: m, year: y };

        const existing = await prisma.salary.findFirst({ where: whereClause });

        let salary;
        if (existing) {
          salary = await prisma.salary.update({
            where: { id: existing.id },
            data: { basicSalary: basic, allowances: allow, deductions: deduct, netSalary: net },
          });
        } else {
          const createData = isTeacher
            ? { teacherId: empId, employeeType, month: m, year: y, basicSalary: basic, allowances: allow, deductions: deduct, netSalary: net }
            : { staffId: empId, employeeType, month: m, year: y, basicSalary: basic, allowances: allow, deductions: deduct, netSalary: net };
          salary = await prisma.salary.create({ data: createData });
        }
        created.push(salary);
      } catch (e) {
        console.error(`Salary upsert failed for ${empId}:`, e.message);
      }
    }

    return { generated: created.length, month: m, year: y };
  },

  async markPaid(id) {
    const salary = await prisma.salary.findUnique({ where: { id } });
    if (!salary) throw new AppError('Salary record not found', 404);
    if (salary.isPaid) throw new AppError('Already marked as paid', 400);
    return prisma.salary.update({ where: { id }, data: { isPaid: true, paidAt: new Date() } });
  },

  async getSummary(query) {
    const { month, year } = query;
    const where = {
      ...(month && { month: parseInt(month) }),
      ...(year && { year: parseInt(year) }),
    };

    const [totalRecords, paidRecords, agg] = await Promise.all([
      prisma.salary.count({ where }),
      prisma.salary.count({ where: { ...where, isPaid: true } }),
      prisma.salary.aggregate({ where, _sum: { netSalary: true, basicSalary: true } }),
    ]);

    return {
      totalRecords,
      paidCount: paidRecords,
      pendingCount: totalRecords - paidRecords,
      totalPayable: agg._sum.netSalary || 0,
    };
  },
};

module.exports = payrollService;
