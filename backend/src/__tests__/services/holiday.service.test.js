jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const service = require('../../services/holiday.service');
const { AppError } = require('../../utils/errors');

describe('holidayService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns holidays ordered by date', async () => {
      const mockData = [{ id: 'h1', name: 'New Year' }];
      prisma.holiday.findMany.mockResolvedValue(mockData);
      prisma.holiday.count.mockResolvedValue(1);

      const result = await service.getAll({});
      expect(result.data).toBe(mockData);
      expect(prisma.holiday.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { date: 'asc' } })
      );
    });
  });

  describe('getById', () => {
    it('returns holiday', async () => {
      const mock = { id: 'h1', name: 'New Year' };
      prisma.holiday.findUnique.mockResolvedValue(mock);
      expect(await service.getById('h1')).toBe(mock);
    });

    it('throws 404 when not found', async () => {
      prisma.holiday.findUnique.mockResolvedValue(null);
      await expect(service.getById('x')).rejects.toThrow(new AppError('Not found', 404));
    });
  });

  describe('create', () => {
    it('converts date string to Date object', async () => {
      prisma.holiday.create.mockResolvedValue({ id: 'h1' });

      await service.create({ name: 'New Year', date: '2026-01-01', isPublic: 'true' });

      const [[{ data }]] = prisma.holiday.create.mock.calls;
      expect(data.date).toBeInstanceOf(Date);
      expect(data.date.getFullYear()).toBe(2026);
    });

    it('coerces isPublic string "true" to boolean true', async () => {
      prisma.holiday.create.mockResolvedValue({ id: 'h1' });

      await service.create({ name: 'New Year', date: '2026-01-01', isPublic: 'true' });

      const [[{ data }]] = prisma.holiday.create.mock.calls;
      expect(data.isPublic).toBe(true);
    });

    it('coerces isPublic string "false" to boolean false', async () => {
      prisma.holiday.create.mockResolvedValue({ id: 'h1' });

      await service.create({ name: 'Internal Day', date: '2026-03-15', isPublic: 'false' });

      const [[{ data }]] = prisma.holiday.create.mock.calls;
      expect(data.isPublic).toBe(false);
    });

    it('coerces isPublic boolean true correctly', async () => {
      prisma.holiday.create.mockResolvedValue({ id: 'h1' });

      await service.create({ name: 'New Year', date: '2026-01-01', isPublic: true });

      const [[{ data }]] = prisma.holiday.create.mock.calls;
      expect(data.isPublic).toBe(true);
    });
  });

  describe('update', () => {
    it('updates holiday with date and boolean coercion', async () => {
      prisma.holiday.update.mockResolvedValue({ id: 'h1' });

      await service.update('h1', { name: 'New Year', date: '2026-01-01', isPublic: 'false' });

      const [[{ data }]] = prisma.holiday.update.mock.calls;
      expect(data.date).toBeInstanceOf(Date);
      expect(data.isPublic).toBe(false);
    });
  });

  describe('remove', () => {
    it('deletes holiday', async () => {
      prisma.holiday.delete.mockResolvedValue({ id: 'h1' });
      await service.remove('h1');
      expect(prisma.holiday.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
    });
  });
});
