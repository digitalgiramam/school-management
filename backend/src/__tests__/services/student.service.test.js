jest.mock('../../config/prisma');
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({}),
  emailTemplates: { welcomeUser: jest.fn().mockReturnValue('<html>welcome</html>') },
}));
// Config must resolve before requiring the service
jest.mock('../../config', () => ({
  env: 'test',
  bcrypt: { rounds: 1 },
  jwt: { secret: 'test', expiresIn: '1d', refreshSecret: 'rtest', refreshExpiresIn: '7d' },
  clientUrl: 'http://localhost:3000',
  auth: { maxFailedLogins: 5, lockDurationMinutes: 30 },
  email: {},
}));

const prisma = require('../../config/prisma');
const studentService = require('../../services/student.service');
const { AppError } = require('../../utils/errors');

const mockStudent = {
  id: 'st1',
  firstName: 'John',
  lastName: 'Doe',
  admissionNumber: 'ADM001',
  dateOfBirth: new Date('2010-05-15'),
  isActive: true,
  userId: 'u1',
  user: { email: 'john@school.com' },
  section: null,
};

describe('studentService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns paginated students', async () => {
      prisma.student.findMany.mockResolvedValue([mockStudent]);
      prisma.student.count.mockResolvedValue(1);

      const result = await studentService.getAll({});
      expect(result.students).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters isActive as boolean from query string', async () => {
      prisma.student.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(0);

      await studentService.getAll({ isActive: 'true' });
      const [[{ where }]] = prisma.student.findMany.mock.calls;
      expect(where.isActive).toBe(true);
    });
  });

  describe('getById', () => {
    it('returns student by id', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      const result = await studentService.getById('st1');
      expect(result).toBe(mockStudent);
    });

    it('throws 404 when not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      await expect(studentService.getById('x')).rejects.toThrow(
        new AppError('Student not found', 404)
      );
    });
  });

  describe('create', () => {
    it('converts dateOfBirth string to Date', async () => {
      // $transaction calls the callback with prisma as tx
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'john@school.com' });
      prisma.student.create.mockResolvedValue(mockStudent);

      await studentService.create({
        email: 'john@school.com',
        firstName: 'John',
        lastName: 'Doe',
        admissionNumber: 'ADM001',
        dateOfBirth: '2010-05-15',
        gender: 'MALE',
      });

      const [[{ data }]] = prisma.student.create.mock.calls;
      expect(data.dateOfBirth).toBeInstanceOf(Date);
      expect(data.dateOfBirth.getFullYear()).toBe(2010);
    });

    it('coerces isActive string "true" to boolean', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'john@school.com' });
      prisma.student.create.mockResolvedValue(mockStudent);

      await studentService.create({
        email: 'john@school.com',
        firstName: 'John',
        lastName: 'Doe',
        admissionNumber: 'ADM001',
        dateOfBirth: '2010-05-15',
        gender: 'MALE',
        isActive: 'true',
      });

      const [[{ data }]] = prisma.student.create.mock.calls;
      expect(data.isActive).toBe(true);
    });

    it('creates a user with STUDENT role inside transaction', async () => {
      prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'john@school.com' });
      prisma.student.create.mockResolvedValue(mockStudent);

      await studentService.create({
        email: 'john@school.com',
        firstName: 'John',
        lastName: 'Doe',
        admissionNumber: 'ADM001',
        dateOfBirth: '2010-05-15',
        gender: 'MALE',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'STUDENT' }) })
      );
    });
  });

  describe('update', () => {
    it('converts dateOfBirth string to Date on update', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.student.update.mockResolvedValue(mockStudent);

      await studentService.update('st1', { dateOfBirth: '2010-05-15' });

      const [[{ data }]] = prisma.student.update.mock.calls;
      expect(data.dateOfBirth).toBeInstanceOf(Date);
    });

    it('coerces isActive on update', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.student.update.mockResolvedValue(mockStudent);

      await studentService.update('st1', { isActive: 'false' });

      const [[{ data }]] = prisma.student.update.mock.calls;
      expect(data.isActive).toBe(false);
    });

    it('throws 404 when student not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      await expect(studentService.update('x', {})).rejects.toThrow(
        new AppError('Student not found', 404)
      );
    });
  });

  describe('deactivate', () => {
    it('sets isActive false on student and user', async () => {
      prisma.student.findUnique.mockResolvedValue({ ...mockStudent, userId: 'u1' });
      prisma.$transaction.mockResolvedValue([{}, {}]);

      await studentService.deactivate('st1');

      const [[txArgs]] = prisma.$transaction.mock.calls;
      expect(txArgs).toHaveLength(2);
      expect(prisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } })
      );
    });

    it('throws 404 when student not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      await expect(studentService.deactivate('x')).rejects.toThrow(
        new AppError('Student not found', 404)
      );
    });
  });
});
