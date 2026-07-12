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

    // Check teacher conflict
    const conflict = await prisma.timetableSlot.findFirst({
      where: {
        timetable: { id: { not: timetableId } },
        dayOfWeek: parseInt(dayOfWeek),
        teacherId,
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
        ],
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
        room,
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async updateSlot(slotId, data) {
    return prisma.timetableSlot.update({
      where: { id: slotId },
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        room: data.room,
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
