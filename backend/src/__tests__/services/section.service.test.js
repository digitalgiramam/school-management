jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const sectionService = require('../../services/section.service');
const { AppError } = require('../../utils/errors');

describe('sectionService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns paginated sections', async () => {
      const mockSections = [{ id: 's1', name: 'A' }];
      prisma.section.findMany.mockResolvedValue(mockSections);
      prisma.section.count.mockResolvedValue(1);

      const result = await sectionService.getAll({});
      expect(result).toEqual({ data: mockSections, total: 1, page: 1, limit: 10 });
    });

    it('filters by classId', async () => {
      prisma.section.findMany.mockResolvedValue([]);
      prisma.section.count.mockResolvedValue(0);

      await sectionService.getAll({ classId: 'c1' });
      const [[{ where }]] = prisma.section.findMany.mock.calls;
      expect(where).toEqual({ classId: 'c1' });
    });
  });

  describe('getById', () => {
    it('returns section with students', async () => {
      const mock = { id: 's1', name: 'A', students: [] };
      prisma.section.findUnique.mockResolvedValue(mock);

      const result = await sectionService.getById('s1');
      expect(result).toBe(mock);
    });

    it('throws 404 when not found', async () => {
      prisma.section.findUnique.mockResolvedValue(null);
      await expect(sectionService.getById('x')).rejects.toThrow(
        new AppError('Section not found', 404)
      );
    });
  });

  describe('create', () => {
    it('creates section with parsed capacity', async () => {
      prisma.section.findUnique.mockResolvedValue(null);
      const created = { id: 's1', name: 'A', classId: 'c1', capacity: 35 };
      prisma.section.create.mockResolvedValue(created);

      const result = await sectionService.create({
        name: 'A',
        classId: 'c1',
        capacity: '35', // string from form
      });

      const [[{ data }]] = prisma.section.create.mock.calls;
      expect(data.capacity).toBe(35); // parsed to int
      expect(result).toBe(created);
    });

    it('uses default capacity of 40 when not provided', async () => {
      prisma.section.findUnique.mockResolvedValue(null);
      prisma.section.create.mockResolvedValue({ id: 's1' });

      await sectionService.create({ name: 'A', classId: 'c1' });
      const [[{ data }]] = prisma.section.create.mock.calls;
      expect(data.capacity).toBe(40);
    });

    it('throws 400 if section already exists in class', async () => {
      prisma.section.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        sectionService.create({ name: 'A', classId: 'c1' })
      ).rejects.toThrow(new AppError('Section already exists in this class', 400));
    });

    it('sets teacherId to null when not provided', async () => {
      prisma.section.findUnique.mockResolvedValue(null);
      prisma.section.create.mockResolvedValue({ id: 's1' });

      await sectionService.create({ name: 'A', classId: 'c1' });
      const [[{ data }]] = prisma.section.create.mock.calls;
      expect(data.teacherId).toBeNull();
    });
  });

  describe('update', () => {
    it('parses capacity string to int', async () => {
      prisma.section.update.mockResolvedValue({ id: 's1', capacity: 30 });

      await sectionService.update('s1', { capacity: '30' });
      const [[{ data }]] = prisma.section.update.mock.calls;
      expect(data.capacity).toBe(30);
    });

    it('sets teacherId to null when empty string', async () => {
      prisma.section.update.mockResolvedValue({ id: 's1' });

      await sectionService.update('s1', { teacherId: '' });
      const [[{ data }]] = prisma.section.update.mock.calls;
      expect(data.teacherId).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes section when no students enrolled', async () => {
      prisma.section.findUnique.mockResolvedValue({ id: 's1', _count: { students: 0 } });
      prisma.section.delete.mockResolvedValue({ id: 's1' });

      await sectionService.remove('s1');
      expect(prisma.section.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });

    it('throws 404 when section not found', async () => {
      prisma.section.findUnique.mockResolvedValue(null);
      await expect(sectionService.remove('x')).rejects.toThrow(
        new AppError('Section not found', 404)
      );
    });

    it('throws 400 when section has students', async () => {
      prisma.section.findUnique.mockResolvedValue({ id: 's1', _count: { students: 5 } });
      await expect(sectionService.remove('s1')).rejects.toThrow(
        new AppError('Cannot delete section with enrolled students', 400)
      );
    });
  });
});
