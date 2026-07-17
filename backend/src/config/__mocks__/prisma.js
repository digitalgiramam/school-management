/**
 * Shared Prisma mock for Jest unit tests.
 * Every Prisma model method is replaced with a jest.fn() that tests can configure.
 */

const createModelMock = () => ({
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

const prismaMock = {
  // Core models
  user: createModelMock(),
  student: createModelMock(),
  teacher: createModelMock(),
  parent: createModelMock(),
  staff: createModelMock(),

  // School structure
  academicYear: createModelMock(),
  branch: createModelMock(),
  department: createModelMock(),
  class: createModelMock(),
  section: createModelMock(),
  subject: createModelMock(),
  teacherSubject: createModelMock(),

  // Timetable
  timetable: createModelMock(),
  timetableSlot: createModelMock(),

  // Attendance
  attendance: createModelMock(),
  teacherAttendance: createModelMock(),

  // Exams & marks
  examType: createModelMock(),
  exam: createModelMock(),
  examSubject: createModelMock(),
  mark: createModelMock(),
  gradeSetting: createModelMock(),

  // Fees & payments
  feeCategory: createModelMock(),
  feeStructure: createModelMock(),
  feeInvoice: createModelMock(),
  payment: createModelMock(),
  scholarship: createModelMock(),

  // Library
  bookCategory: createModelMock(),
  author: createModelMock(),
  book: createModelMock(),
  bookIssue: createModelMock(),

  // Transport
  driver: createModelMock(),
  bus: createModelMock(),
  route: createModelMock(),
  routeStop: createModelMock(),
  busAllocation: createModelMock(),

  // Hostel
  hostel: createModelMock(),
  hostelRoom: createModelMock(),
  hostelAllocation: createModelMock(),

  // Payroll & leave
  salary: createModelMock(),
  leave: createModelMock(),

  // Homework
  homework: createModelMock(),
  homeworkSubmission: createModelMock(),

  // Communication
  notification: createModelMock(),
  announcement: createModelMock(),
  message: createModelMock(),

  // Misc
  holiday: createModelMock(),
  auditLog: createModelMock(),
  studentDocument: createModelMock(),
  medicalInfo: createModelMock(),
  studentPromotion: createModelMock(),
  studentTransfer: createModelMock(),
  idCard: createModelMock(),

  // Prisma client methods
  $transaction: jest.fn().mockImplementation(async (fnOrArray) => {
    if (typeof fnOrArray === 'function') {
      return fnOrArray(prismaMock);
    }
    return Promise.all(fnOrArray);
  }),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(),
};

module.exports = prismaMock;
