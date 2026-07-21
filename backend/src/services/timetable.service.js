const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const timetableService = {
  async getBySection(sectionId, academicYearId) {
    let timetable = await prisma.timetable.findUnique({
      where: { sectionId_academicYearId: { sectionId, academicYearId } },
      include: {
        section: { include: { class: true } },
        slots: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    return timetable;
  },

  async upsert(data) {
    const { sectionId, academicYearId } = data;
    return prisma.timetable.upsert({
      where: { sectionId_academicYearId: { sectionId, academicYearId } },
      create: { sectionId, academicYearId },
      update: {},
      include: { slots: true },
    });
  },

  async addSlot(timetableId, data) {
    const { dayOfWeek, startTime, endTime, subjectId, teacherId, room } = data;

    if (endTime <= startTime) throw new AppError('End time must be after start time', 400);

    // Check teacher conflict across ALL timetables (single overlap condition covers all cases)
    const conflict = await prisma.timetableSlot.findFirst({
      where: {
        timetableId: { not: timetableId },
        dayOfWeek: parseInt(dayOfWeek),
        teacherId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (conflict) throw new AppError('Teacher has a conflicting slot at this time', 400);

    return prisma.timetableSlot.create({
      data: {
        timetableId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        subjectId,
        teacherId,
        room: room || null,
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async updateSlot(slotId, data) {
    const { dayOfWeek, startTime, endTime, subjectId, teacherId, room } = data;

    if (endTime <= startTime) throw new AppError('End time must be after start time', 400);

    // Check teacher conflict excluding this slot itself
    if (teacherId && startTime && endTime && dayOfWeek) {
      const conflict = await prisma.timetableSlot.findFirst({
        where: {
          id: { not: slotId },
          dayOfWeek: parseInt(dayOfWeek),
          teacherId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (conflict) throw new AppError('Teacher has a conflicting slot at this time', 400);
    }

    return prisma.timetableSlot.update({
      where: { id: slotId },
      data: {
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        subjectId,
        teacherId,
        room: room || null,
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async deleteSlot(slotId) {
    return prisma.timetableSlot.delete({ where: { id: slotId } });
  },
};

module.exports = timetableService;
