const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const feeService = {
  async getStructures(classId, academicYearId) {
    return prisma.feeStructure.findMany({
      where: { ...(classId && { classId }), ...(academicYearId && { academicYearId }) },
      include: { feeCategory: true, class: true, academicYear: true },
    });
  },

  async createStructure(data) {
    // Upsert fee category by name if provided
    let feeCategoryId = data.feeCategoryId;
    if (!feeCategoryId && data.feeCategoryName) {
      const cat = await prisma.feeCategory.upsert({
        where: { name: data.feeCategoryName },
        update: {},
        create: { name: data.feeCategoryName },
      });
      feeCategoryId = cat.id;
    }
    const { feeCategoryName, ...rest } = data;
    return prisma.feeStructure.create({
      data: { ...rest, feeCategoryId },
      include: { feeCategory: true, class: true },
    });
  },

  async updateStructure(id, data) {
    return prisma.feeStructure.update({ where: { id }, data });
  },

  async deleteStructure(id) {
    return prisma.feeStructure.delete({ where: { id } });
  },

  async getInvoices(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const { studentId, status } = query;
    const where = {
      ...(studentId && { studentId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { invoiceNo: { contains: search, mode: 'insensitive' } },
          { student: { admissionNumber: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const [invoices, total] = await Promise.all([
      prisma.feeInvoice.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          payments: true,
        },
      }),
      prisma.feeInvoice.count({ where }),
    ]);
    return { invoices, total, page, limit };
  },

  async getInvoiceById(id) {
    const inv = await prisma.feeInvoice.findUnique({
      where: { id },
      include: { student: true, payments: true },
    });
    if (!inv) throw new AppError('Invoice not found', 404);
    return inv;
  },

  async createInvoice(data) {
    const totalAmount = Number(data.amount || 0) - Number(data.discount || 0) + Number(data.fine || 0);
    // Auto-generate invoice number
    const count = await prisma.feeInvoice.count();
    const invoiceNo = `INV-${String(count + 1).padStart(5, '0')}`;
    const { amount, ...rest } = data;
    return prisma.feeInvoice.create({
      data: { ...rest, invoiceNo, totalAmount, amount: Number(amount) },
      include: { student: true },
    });
  },

  async recordPayment(invoiceId, paymentData) {
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);
    const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0) + Number(paymentData.amount);
    const newStatus = totalPaid >= invoice.totalAmount ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
    return prisma.$transaction([
      prisma.payment.create({ data: { ...paymentData, amount: Number(paymentData.amount), invoiceId, paidAt: paymentData.paidAt ? new Date(paymentData.paidAt) : new Date() } }),
      prisma.feeInvoice.update({ where: { id: invoiceId }, data: { status: newStatus } }),
    ]);
  },

  async getCollectionReport(startDate, endDate) {
    const where = {};
    if (startDate) where.paidAt = { gte: new Date(startDate) };
    if (endDate) where.paidAt = { ...where.paidAt, lte: new Date(endDate) };
    const payments = await prisma.payment.findMany({
      where,
      include: { invoice: { include: { student: { select: { firstName: true, lastName: true } } } } },
    });
    const total = payments.reduce((s, p) => s + p.amount, 0);
    return { payments, total, count: payments.length };
  },

  async getPendingFees(query) {
    const { classId } = query;
    return prisma.feeInvoice.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        ...(classId && { student: { section: { classId } } }),
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  },
};

module.exports = feeService;
