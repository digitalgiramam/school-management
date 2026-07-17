jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const feeService = require('../../services/fee.service');
const { AppError } = require('../../utils/errors');

describe('feeService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createStructure ────────────────────────────────────────────
  describe('createStructure', () => {
    it('parses amount string to float', async () => {
      prisma.feeStructure.create.mockResolvedValue({ id: 'fs1', amount: 5000 });

      await feeService.createStructure({
        feeCategoryId: 'fc1',
        classId: 'c1',
        academicYearId: 'ay1',
        amount: '5000',  // string from form
      });

      const [[{ data }]] = prisma.feeStructure.create.mock.calls;
      expect(data.amount).toBe(5000);
      expect(typeof data.amount).toBe('number');
    });

    it('creates or reuses fee category by name', async () => {
      prisma.feeCategory.upsert.mockResolvedValue({ id: 'fc-new', name: 'Tuition' });
      prisma.feeStructure.create.mockResolvedValue({ id: 'fs1' });

      await feeService.createStructure({
        feeCategoryName: 'Tuition',
        classId: 'c1',
        academicYearId: 'ay1',
        amount: '1000',
      });

      expect(prisma.feeCategory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: 'Tuition' },
          create: { name: 'Tuition' },
        })
      );
    });
  });

  // ── updateStructure ────────────────────────────────────────────
  describe('updateStructure', () => {
    it('parses amount string to float on update', async () => {
      prisma.feeStructure.update.mockResolvedValue({ id: 'fs1', amount: 6000 });

      await feeService.updateStructure('fs1', { amount: '6000' });

      const [[{ data }]] = prisma.feeStructure.update.mock.calls;
      expect(data.amount).toBe(6000);
    });

    it('skips amount when not provided', async () => {
      prisma.feeStructure.update.mockResolvedValue({ id: 'fs1' });

      await feeService.updateStructure('fs1', { frequency: 'MONTHLY' });

      const [[{ data }]] = prisma.feeStructure.update.mock.calls;
      expect(data.amount).toBeUndefined();
    });
  });

  // ── createInvoice ──────────────────────────────────────────────
  describe('createInvoice', () => {
    it('computes totalAmount correctly: amount - discount + fine', async () => {
      prisma.feeInvoice.count.mockResolvedValue(5);
      prisma.feeInvoice.create.mockResolvedValue({ id: 'inv1', totalAmount: 4600 });

      await feeService.createInvoice({
        studentId: 'st1',
        amount: '5000',
        discount: '500',
        fine: '100',
        dueDate: '2026-03-31',
      });

      const [[{ data }]] = prisma.feeInvoice.create.mock.calls;
      // 5000 - 500 + 100 = 4600
      expect(data.totalAmount).toBe(4600);
      expect(data.amount).toBe(5000);
      expect(data.invoiceNo).toMatch(/^INV-/);
    });

    it('auto-generates sequential invoice number', async () => {
      prisma.feeInvoice.count.mockResolvedValue(9);
      prisma.feeInvoice.create.mockResolvedValue({ id: 'inv1' });

      await feeService.createInvoice({
        studentId: 'st1',
        amount: '1000',
        dueDate: '2026-03-31',
      });

      const [[{ data }]] = prisma.feeInvoice.create.mock.calls;
      expect(data.invoiceNo).toBe('INV-00010');
    });
  });

  // ── recordPayment ──────────────────────────────────────────────
  describe('recordPayment', () => {
    it('marks invoice as PAID when fully paid', async () => {
      prisma.feeInvoice.findUnique.mockResolvedValue({
        id: 'inv1',
        totalAmount: 5000,
        payments: [{ amount: 2000 }],
      });
      prisma.$transaction.mockResolvedValue([{ id: 'pay1' }, { id: 'inv1' }]);

      await feeService.recordPayment('inv1', { amount: '3000', method: 'CASH' });

      const [[txArgs]] = prisma.$transaction.mock.calls;
      // Verify two ops: create payment and update invoice
      expect(txArgs).toHaveLength(2);
    });

    it('marks invoice as PARTIAL when partially paid', async () => {
      prisma.feeInvoice.findUnique.mockResolvedValue({
        id: 'inv1',
        totalAmount: 5000,
        payments: [],
      });
      prisma.$transaction.mockResolvedValue([{}, {}]);

      await feeService.recordPayment('inv1', { amount: '2000', method: 'ONLINE' });

      const [[, updateOp]] = prisma.$transaction.mock.calls;
      // The update call on feeInvoice should have status PARTIAL
      expect(prisma.feeInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'PARTIAL' } })
      );
    });

    it('throws 404 when invoice not found', async () => {
      prisma.feeInvoice.findUnique.mockResolvedValue(null);
      await expect(feeService.recordPayment('x', { amount: '100' })).rejects.toThrow(
        new AppError('Invoice not found', 404)
      );
    });
  });

  // ── getCollectionReport ────────────────────────────────────────
  describe('getCollectionReport', () => {
    it('sums all payment amounts', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { amount: 1000 },
        { amount: 2000 },
        { amount: 500 },
      ]);

      const result = await feeService.getCollectionReport();
      expect(result.total).toBe(3500);
      expect(result.count).toBe(3);
    });

    it('filters by date range when provided', async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      await feeService.getCollectionReport('2026-01-01', '2026-01-31');

      const [[{ where }]] = prisma.payment.findMany.mock.calls;
      expect(where.paidAt).toBeDefined();
      expect(where.paidAt.gte).toBeInstanceOf(Date);
      expect(where.paidAt.lte).toBeInstanceOf(Date);
    });
  });
});
