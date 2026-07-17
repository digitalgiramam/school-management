jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const service = require('../../services/academicYear.service');
const { AppError } = require('../../utils/errors');

describe('academicYearService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns paginated academic years ordered by startDate desc', async () => {
      const mockData = [{ id: 'ay1', name: '2025-2026' }];
      prisma.academicYear.findMany.mockResolvedValue(mockData);
      prisma.academicYear.count.mockResolvedValue(1);

      const result = await service.getAll({});
      expect(result).toEqual({ data: mockData, total: 1, page: 1, limit: 10 });
      expect(prisma.academicYear.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { startDate: 'desc' } })
      );
    });
  });

  describe('getById', () => {
    it('returns academic year by id', async () => {
      const mock = { id: 'ay1', name: '2025-2026' };
      prisma.academicYear.findUnique.mockResolvedValue(mock);
      expect(await service.getById('ay1')).toBe(mock);
    });

    it('throws 404 when not found', async () => {
      prisma.academicYear.findUnique.mockResolvedValue(null);
      await expect(service.getById('x')).rejects.toThrow(new AppError('Not found', 404));
    });
  });

  describe('create', () => {
    it('converts startDate and endDate strings to Date objects', async () => {
      const created = { id: 'ay1', name: '2025-2026' };
      prisma.academicYear.create.mockResolvedValue(created);

      await service.create({
        name: '2025-2026',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        isCurrent: 'false',
      });

      const [[{ data }]] = prisma.academicYear.create.mock.calls;
      expect(data.startDate).toBeInstanceOf(Date);
      expect(data.endDate).toBeInstanceOf(Date);
      expect(data.startDate.getFullYear()).toBe(2025);
    });

    it('coerces isCurrent string "true" to boolean true', async () => {
      prisma.academicYear.create.mockResolvedValue({ id: 'ay1' });

      await service.create({
        name: '2025-2026',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        isCurrent: 'true',
      });

      const [[{ data }]] = prisma.academicYear.create.mock.calls;
      expect(data.isCurrent).toBe(true);
    });

    it('coerces isCurrent boolean true correctly', async () => {
      prisma.academicYear.create.mockResolvedValue({ id: 'ay1' });

      await service.create({
        name: '2025-2026',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        isCurrent: true,
      });

      const [[{ data }]] = prisma.academicYear.create.mock.calls;
      expect(data.isCurrent).toBe(true);
    });
  });

  describe('update', () => {
    it('converts date strings to Date objects', async () => {
      prisma.academicYear.update.mockResolvedValue({ id: 'ay1' });

      await service.update('ay1', {
        startDate: '2025-06-01',
        endDate: '2026-05-31',
      });

      const [[{ data }]] = prisma.academicYear.update.mock.calls;
      expect(data.startDate).toBeInstanceOf(Date);
      expect(data.endDate).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('deletes academic year with no classes and not current', async () => {
      prisma.academicYear.findUnique.mockResolvedValue({
        id: 'ay1',
        isCurrent: false,
        _count: { classes: 0 },
      });
      prisma.academicYear.delete.mockResolvedValue({ id: 'ay1' });

      await service.remove('ay1');
      expect(prisma.academicYear.delete).toHaveBeenCalledWith({ where: { id: 'ay1' } });
    });

    it('throws 404 when not found', async () => {
      prisma.academicYear.findUnique.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(new AppError('Not found', 404));
    });

    it('throws 400 when academic year has classes', async () => {
      prisma.academicYear.findUnique.mockResolvedValue({
        id: 'ay1',
        isCurrent: false,
        _count: { classes: 3 },
      });
      await expect(service.remove('ay1')).rejects.toThrow(
        new AppError('Cannot delete academic year with existing classes', 400)
      );
    });

    it('throws 400 when academic year is current', async () => {
      prisma.academicYear.findUnique.mockResolvedValue({
        id: 'ay1',
        isCurrent: true,
        _count: { classes: 0 },
      });
      await expect(service.remove('ay1')).rejects.toThrow(
        new AppError('Cannot delete the current academic year', 400)
      );
    });
  });
});
