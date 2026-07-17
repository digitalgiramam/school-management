jest.mock('../../config/prisma');
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../config', () => ({
  env: 'test',
  bcrypt: { rounds: 1 },
  jwt: { secret: 'test', expiresIn: '1d', refreshSecret: 'rtest', refreshExpiresIn: '7d' },
  clientUrl: 'http://localhost:3000',
  auth: { maxFailedLogins: 5, lockDurationMinutes: 30 },
  email: {},
}));

const prisma = require('../../config/prisma');
const teacherService = require('../../services/teacher.service');
const { AppError } = require('../../utils/errors');

const mockTeacher = {
  id: 't1',
  firstName: 'Jane',
  lastName: 'Smith',
  employeeId: 'EMP001',
  experience: 5,
  isActive: true,
  userId: 'u1',
  dateOfBirth: new Date('1990-01-01'),
};

describe('teacherService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns paginated teachers', async () => {
      prisma.teacher.findMany.mockResolvedValue([mockTeacher]);
      prisma.teacher.count.mockResolvedValue(1);

      const result = await teacherService.getAll({});
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters isActive from query string', async () => {
      prisma.teacher.findMany.mockResolvedValue([]);
      prisma.teacher.count.mockResolvedValue(0);

      await teacherService.getAll({ isActive: 'false' });
      const [[{ where }]] = prisma.teacher.findMany.mock.calls;
      expect(where.isActive).toBe(false);
    });
  });

  describe('getById', () => {
    it('returns teacher', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      expect(await teacherService.getById('t1')).toBe(mockTeacher);
    });

    it('throws 404 when not found', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);
      await expect(teacherService.getById('x')).rejects.toThrow(
        new AppError('Teacher not found', 404)
      );
    });
  });

  describe('create', () => {
    it('parses experience string to integer', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.teacher.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.user.create.mockResolvedValue({ id: 'u1' });
      prisma.teacher.create.mockResolvedValue(mockTeacher);

      await teacherService.create({
        email: 'jane@school.com',
        firstName: 'Jane',
        lastName: 'Smith',
        employeeId: 'EMP001',
        experience: '7',   // string from form
        dateOfBirth: '1990-01-15',
        gender: 'FEMALE',
      });

      const [[{ data }]] = prisma.teacher.create.mock.calls;
      expect(data.experience).toBe(7);
      expect(typeof data.experience).toBe('number');
      expect(data.dateOfBirth).toBeInstanceOf(Date);
    });

    it('throws 400 when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      prisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        teacherService.create({ email: 'taken@school.com', employeeId: 'EMP999' })
      ).rejects.toThrow(new AppError('Email already in use', 400));
    });

    it('throws 400 when employee ID already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.teacher.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        teacherService.create({ email: 'new@school.com', employeeId: 'EMP001' })
      ).rejects.toThrow(new AppError('Employee ID already exists', 400));
    });
  });

  describe('update', () => {
    it('parses experience string to integer', async () => {
      prisma.teacher.update.mockResolvedValue(mockTeacher);

      await teacherService.update('t1', { experience: '10' });

      const [[{ data }]] = prisma.teacher.update.mock.calls;
      expect(data.experience).toBe(10);
    });

    it('coerces isActive string to boolean', async () => {
      prisma.teacher.update.mockResolvedValue(mockTeacher);

      await teacherService.update('t1', { isActive: 'false' });

      const [[{ data }]] = prisma.teacher.update.mock.calls;
      expect(data.isActive).toBe(false);
    });

    it('converts dateOfBirth string to Date', async () => {
      prisma.teacher.update.mockResolvedValue(mockTeacher);

      await teacherService.update('t1', { dateOfBirth: '1990-03-20' });

      const [[{ data }]] = prisma.teacher.update.mock.calls;
      expect(data.dateOfBirth).toBeInstanceOf(Date);
    });

    it('converts joiningDate string to Date', async () => {
      prisma.teacher.update.mockResolvedValue(mockTeacher);

      await teacherService.update('t1', { joiningDate: '2022-07-01' });

      const [[{ data }]] = prisma.teacher.update.mock.calls;
      expect(data.joiningDate).toBeInstanceOf(Date);
    });
  });

  describe('deactivate', () => {
    it('deactivates teacher and user', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.$transaction.mockResolvedValue([{}, {}]);

      await teacherService.deactivate('t1');

      expect(prisma.teacher.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } })
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } })
      );
    });

    it('throws 404 when not found', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);
      await expect(teacherService.deactivate('x')).rejects.toThrow(
        new AppError('Teacher not found', 404)
      );
    });
  });
});
