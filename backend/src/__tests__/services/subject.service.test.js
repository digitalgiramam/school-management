jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const subjectService = require('../../services/subject.service');
const { AppError } = require('../../utils/errors');

describe('subjectService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns paginated subjects', async () => {
      const mockSubjects = [{ id: 'sub1', name: 'Mathematics', code: 'MATH' }];
      prisma.subject.findMany.mockResolvedValue(mockSubjects);
      prisma.subject.count.mockResolvedValue(1);

      const result = await subjectService.getAll({});
      expect(result.data).toBe(mockSubjects);
      expect(result.total).toBe(1);
    });

    it('filters isElective as boolean from string', async () => {
      prisma.subject.findMany.mockResolvedValue([]);
      prisma.subject.count.mockResolvedValue(0);

      await subjectService.getAll({ isElective: 'true' });
      const [[{ where }]] = prisma.subject.findMany.mock.calls;
      expect(where.isElective).toBe(true);
    });
  });

  describe('getById', () => {
    it('returns subject by id', async () => {
      const mock = { id: 'sub1', name: 'Mathematics', teacherSubjects: [] };
      prisma.subject.findUnique.mockResolvedValue(mock);

      const result = await subjectService.getById('sub1');
      expect(result).toBe(mock);
    });

    it('throws 404 when not found', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);
      await expect(subjectService.getById('x')).rejects.toThrow(
        new AppError('Subject not found', 404)
      );
    });
  });

  describe('create', () => {
    const validData = {
      name: 'Mathematics',
      code: 'MATH',
      passMark: '35',    // string from form
      totalMark: '100',  // string from form
      isElective: 'false',
    };

    it('parses passMark and totalMark as floats', async () => {
      prisma.subject.findUnique.mockResolvedValue(null); // code unique check
      prisma.subject.create.mockResolvedValue({ id: 'sub1', ...validData });

      await subjectService.create(validData);

      const [[{ data }]] = prisma.subject.create.mock.calls;
      expect(data.passMark).toBe(35);
      expect(data.totalMark).toBe(100);
      expect(typeof data.passMark).toBe('number');
      expect(typeof data.totalMark).toBe('number');
    });

    it('coerces isElective string "true" to boolean true', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);
      prisma.subject.create.mockResolvedValue({ id: 'sub1' });

      await subjectService.create({ ...validData, isElective: 'true' });

      const [[{ data }]] = prisma.subject.create.mock.calls;
      expect(data.isElective).toBe(true);
    });

    it('coerces isElective boolean true correctly', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);
      prisma.subject.create.mockResolvedValue({ id: 'sub1' });

      await subjectService.create({ ...validData, isElective: true });

      const [[{ data }]] = prisma.subject.create.mock.calls;
      expect(data.isElective).toBe(true);
    });

    it('defaults passMark=40 and totalMark=100 when not provided', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);
      prisma.subject.create.mockResolvedValue({ id: 'sub1' });

      await subjectService.create({ name: 'Science', code: 'SCI' });

      const [[{ data }]] = prisma.subject.create.mock.calls;
      expect(data.passMark).toBe(40);
      expect(data.totalMark).toBe(100);
    });

    it('throws 400 when subject code already exists', async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(subjectService.create(validData)).rejects.toThrow(
        new AppError('Subject code already exists', 400)
      );
    });
  });

  describe('update', () => {
    it('parses passMark and totalMark as floats', async () => {
      prisma.subject.update.mockResolvedValue({ id: 'sub1' });

      await subjectService.update('sub1', { passMark: '40', totalMark: '100' });

      const [[{ data }]] = prisma.subject.update.mock.calls;
      expect(data.passMark).toBe(40);
      expect(data.totalMark).toBe(100);
    });

    it('handles isElective string coercion in update', async () => {
      prisma.subject.update.mockResolvedValue({ id: 'sub1' });

      await subjectService.update('sub1', { isElective: 'true' });

      const [[{ data }]] = prisma.subject.update.mock.calls;
      expect(data.isElective).toBe(true);
    });

    it('skips passMark/totalMark when not in update payload', async () => {
      prisma.subject.update.mockResolvedValue({ id: 'sub1' });

      await subjectService.update('sub1', { name: 'Physics' });

      const [[{ data }]] = prisma.subject.update.mock.calls;
      expect(data.passMark).toBeUndefined();
      expect(data.totalMark).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('deletes subject with no exam usage', async () => {
      prisma.subject.findUnique.mockResolvedValue({
        id: 'sub1',
        _count: { teacherSubjects: 0, examSubjects: 0 },
      });
      prisma.subject.delete.mockResolvedValue({ id: 'sub1' });

      await subjectService.remove('sub1');
      expect(prisma.subject.delete).toHaveBeenCalledWith({ where: { id: 'sub1' } });
    });

    it('throws 404 when not found', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);
      await expect(subjectService.remove('x')).rejects.toThrow(
        new AppError('Subject not found', 404)
      );
    });

    it('throws 400 when subject used in exams', async () => {
      prisma.subject.findUnique.mockResolvedValue({
        id: 'sub1',
        _count: { teacherSubjects: 0, examSubjects: 2 },
      });
      await expect(subjectService.remove('sub1')).rejects.toThrow(
        new AppError('Cannot delete subject used in exams', 400)
      );
    });
  });
});
