jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const examService = require('../../services/exam.service');
const { AppError } = require('../../utils/errors');

describe('examService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns exams filtered by status', async () => {
      const mockExams = [{ id: 'e1', name: 'Mid-Term' }];
      prisma.exam.findMany.mockResolvedValue(mockExams);

      const result = await examService.getAll({ status: 'PUBLISHED' });
      const [[{ where }]] = prisma.exam.findMany.mock.calls;
      expect(where.status).toBe('PUBLISHED');
      expect(result).toBe(mockExams);
    });
  });

  describe('getById', () => {
    it('returns exam by id', async () => {
      const mock = { id: 'e1', name: 'Mid-Term', subjects: [] };
      prisma.exam.findUnique.mockResolvedValue(mock);

      const result = await examService.getById('e1');
      expect(result).toBe(mock);
    });

    it('throws 404 when not found', async () => {
      prisma.exam.findUnique.mockResolvedValue(null);
      await expect(examService.getById('x')).rejects.toThrow(new AppError('Exam not found', 404));
    });
  });

  describe('create', () => {
    it('converts startDate and endDate strings to Date objects', async () => {
      prisma.exam.create.mockResolvedValue({ id: 'e1' });

      await examService.create({
        name: 'Mid-Term',
        examTypeId: 'et1',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      });

      const [[{ data }]] = prisma.exam.create.mock.calls;
      expect(data.startDate).toBeInstanceOf(Date);
      expect(data.endDate).toBeInstanceOf(Date);
      expect(data.startDate.getFullYear()).toBe(2026);
    });

    it('parses subjects maxMark and passMark as floats', async () => {
      prisma.exam.create.mockResolvedValue({ id: 'e1' });

      await examService.create({
        name: 'Final',
        examTypeId: 'et1',
        startDate: '2026-04-01',
        endDate: '2026-04-15',
        subjects: [
          { subjectId: 'sub1', date: '2026-04-02', startTime: '09:00', endTime: '12:00',
            maxMark: '100', passMark: '40' },
        ],
      });

      const [[{ data }]] = prisma.exam.create.mock.calls;
      const sub = data.subjects.create[0];
      expect(sub.maxMark).toBe(100);
      expect(sub.passMark).toBe(40);
      expect(sub.date).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('converts date strings to Date objects', async () => {
      prisma.exam.update.mockResolvedValue({ id: 'e1' });

      await examService.update('e1', { startDate: '2026-04-01', endDate: '2026-04-20' });

      const [[{ data }]] = prisma.exam.update.mock.calls;
      expect(data.startDate).toBeInstanceOf(Date);
      expect(data.endDate).toBeInstanceOf(Date);
    });

    it('passes through fields without date conversion when no dates given', async () => {
      prisma.exam.update.mockResolvedValue({ id: 'e1' });

      await examService.update('e1', { status: 'PUBLISHED' });

      const [[{ data }]] = prisma.exam.update.mock.calls;
      expect(data.startDate).toBeUndefined();
      expect(data.status).toBe('PUBLISHED');
    });
  });

  describe('saveBulkMarks', () => {
    const mockExamSubject = { id: 'es1', maxMark: 100 };
    const mockGradeSettings = [
      { minMark: 75, maxMark: 100, grade: 'A+', gradePoint: 10 },
      { minMark: 60, maxMark: 74.99, grade: 'A', gradePoint: 9 },
      { minMark: 0, maxMark: 59.99, grade: 'F', gradePoint: 0 },
    ];

    beforeEach(() => {
      prisma.examSubject.findUnique.mockResolvedValue(mockExamSubject);
      prisma.gradeSetting.findMany.mockResolvedValue(mockGradeSettings);
      prisma.mark.upsert.mockResolvedValue({ id: 'm1' });
      prisma.$transaction.mockResolvedValue([{ id: 'm1' }]);
    });

    it('parses marksObtained string to float', async () => {
      await examService.saveBulkMarks('es1', [
        { studentId: 'st1', marksObtained: '85', isAbsent: false },
      ]);

      expect(prisma.mark.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ marksObtained: 85 }),
        })
      );
    });

    it('coerces isAbsent string "true" to boolean true', async () => {
      await examService.saveBulkMarks('es1', [
        { studentId: 'st1', marksObtained: null, isAbsent: 'true' },
      ]);

      expect(prisma.mark.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ isAbsent: true, grade: 'AB', gradePoint: 0 }),
        })
      );
    });

    it('coerces isAbsent boolean true correctly', async () => {
      await examService.saveBulkMarks('es1', [
        { studentId: 'st1', isAbsent: true },
      ]);

      expect(prisma.mark.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ isAbsent: true }),
        })
      );
    });

    it('calculates grade based on percentage', async () => {
      await examService.saveBulkMarks('es1', [
        { studentId: 'st1', marksObtained: '80', isAbsent: false },
      ]);

      expect(prisma.mark.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ grade: 'A+', gradePoint: 10 }),
        })
      );
    });

    it('throws 404 when exam subject not found', async () => {
      prisma.examSubject.findUnique.mockResolvedValue(null);
      await expect(examService.saveBulkMarks('x', [])).rejects.toThrow(
        new AppError('Exam subject not found', 404)
      );
    });
  });
});
