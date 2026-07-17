jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const service = require('../../services/department.service');
const { AppError } = require('../../utils/errors');

describe('departmentService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns paginated departments', async () => {
      const mockData = [{ id: 'd1', name: 'Science' }];
      prisma.department.findMany.mockResolvedValue(mockData);
      prisma.department.count.mockResolvedValue(1);

      const result = await service.getAll({});
      expect(result).toEqual({ data: mockData, total: 1, page: 1, limit: 10 });
    });
  });

  describe('getById', () => {
    it('returns department', async () => {
      const mock = { id: 'd1', name: 'Science' };
      prisma.department.findUnique.mockResolvedValue(mock);

      const result = await service.getById('d1');
      expect(result).toBe(mock);
    });

    it('throws 404 when not found', async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      await expect(service.getById('x')).rejects.toThrow(new AppError('Not found', 404));
    });
  });

  describe('create', () => {
    it('creates department with given data', async () => {
      const created = { id: 'd1', name: 'Science' };
      prisma.department.create.mockResolvedValue(created);

      const result = await service.create({ name: 'Science' });
      expect(prisma.department.create).toHaveBeenCalledWith({ data: { name: 'Science' } });
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('updates department', async () => {
      const updated = { id: 'd1', name: 'Mathematics' };
      prisma.department.update.mockResolvedValue(updated);

      const result = await service.update('d1', { name: 'Mathematics' });
      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { name: 'Mathematics' },
      });
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('deletes department', async () => {
      prisma.department.delete.mockResolvedValue({ id: 'd1' });
      await service.remove('d1');
      expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
    });
  });
});
