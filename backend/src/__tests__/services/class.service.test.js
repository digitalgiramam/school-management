jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const classService = require('../../services/class.service');
const { AppError } = require('../../utils/errors');

describe('classService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getAll ─────────────────────────────────────────────────────
  describe('getAll', () => {
    it('returns paginated classes', async () => {
      const mockClasses = [{ id: 'c1', name: 'Grade 10' }];
      prisma.class.findMany.mockResolvedValue(mockClasses);
      prisma.class.count.mockResolvedValue(1);

      const result = await classService.getAll({});

      expect(prisma.class.findMany).toHaveBeenCalled();
      expect(prisma.class.count).toHaveBeenCalled();
      expect(result).toEqual({ data: mockClasses, total: 1, page: 1, limit: 10 });
    });

    it('filters by academicYearId and branchId', async () => {
      prisma.class.findMany.mockResolvedValue([]);
      prisma.class.count.mockResolvedValue(0);

      await classService.getAll({ academicYearId: 'ay1', branchId: 'b1' });

      const [[{ where }]] = prisma.class.findMany.mock.calls;
      expect(where).toMatchObject({ academicYearId: 'ay1', branchId: 'b1' });
    });

    it('applies search filter', async () => {
      prisma.class.findMany.mockResolvedValue([]);
      prisma.class.count.mockResolvedValue(0);

      await classService.getAll({ search: 'Grade' });

      const [[{ where }]] = prisma.class.findMany.mock.calls;
      expect(where.name).toMatchObject({ contains: 'Grade', mode: 'insensitive' });
    });
  });

  // ── getById ────────────────────────────────────────────────────
  describe('getById', () => {
    it('returns a class by id', async () => {
      const mockClass = { id: 'c1', name: 'Grade 10', sections: [] };
      prisma.class.findUnique.mockResolvedValue(mockClass);

      const result = await classService.getById('c1');
      expect(result).toBe(mockClass);
    });

    it('throws 404 when class not found', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(classService.getById('missing')).rejects.toThrow(
        new AppError('Class not found', 404)
      );
    });
  });

  // ── create ─────────────────────────────────────────────────────
  describe('create', () => {
    it('creates a class when name is unique', async () => {
      prisma.class.findUnique.mockResolvedValue(null); // no duplicate
      const created = { id: 'c1', name: 'Grade 10', academicYearId: 'ay1', branchId: 'b1' };
      prisma.class.create.mockResolvedValue(created);

      const result = await classService.create({
        name: 'Grade 10',
        academicYearId: 'ay1',
        branchId: 'b1',
      });

      expect(prisma.class.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Grade 10', academicYearId: 'ay1', branchId: 'b1' },
        })
      );
      expect(result).toBe(created);
    });

    it('throws 400 if class already exists', async () => {
      prisma.class.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        classService.create({ name: 'Grade 10', academicYearId: 'ay1', branchId: 'b1' })
      ).rejects.toThrow(new AppError('Class already exists for this academic year and branch', 400));

      expect(prisma.class.create).not.toHaveBeenCalled();
    });
  });

  // ── update ─────────────────────────────────────────────────────
  describe('update', () => {
    it('updates only the class name', async () => {
      const updated = { id: 'c1', name: 'Grade 11' };
      prisma.class.update.mockResolvedValue(updated);

      const result = await classService.update('c1', { name: 'Grade 11' });

      expect(prisma.class.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'c1' }, data: { name: 'Grade 11' } })
      );
      expect(result).toBe(updated);
    });
  });

  // ── remove ─────────────────────────────────────────────────────
  describe('remove', () => {
    it('deletes class when no sections exist', async () => {
      prisma.class.findUnique.mockResolvedValue({ id: 'c1', _count: { sections: 0 } });
      prisma.class.delete.mockResolvedValue({ id: 'c1' });

      await classService.remove('c1');
      expect(prisma.class.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('throws 404 when class not found', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(classService.remove('missing')).rejects.toThrow(
        new AppError('Class not found', 404)
      );
    });

    it('throws 400 when class has sections', async () => {
      prisma.class.findUnique.mockResolvedValue({ id: 'c1', _count: { sections: 3 } });

      await expect(classService.remove('c1')).rejects.toThrow(
        new AppError('Cannot delete class with existing sections', 400)
      );
      expect(prisma.class.delete).not.toHaveBeenCalled();
    });
  });
});
