const service = require('../services/attendance.service');
const { success } = require('../utils/response');
const { AppError } = require('../utils/errors');
const prisma = require('../config/prisma');

const ctrl = {
  /** GET /attendance/my-sections — sections the current user can mark attendance for */
  async getMySections(req, res, next) {
    try {
      const sections = await service.getAccessibleSections(req.user.id, req.user.role);
      success(res, sections);
    } catch (err) { next(err); }
  },

  /** GET /attendance?sectionId=&date= */
  async getBySection(req, res, next) {
    try {
      const { sectionId, date } = req.query;
      if (!sectionId) throw new AppError('sectionId is required', 400);
      const dateStr = date || new Date().toISOString().slice(0, 10);
      success(res, await service.getBySection(sectionId, dateStr));
    } catch (err) { next(err); }
  },

  /** POST /attendance/bulk */
  async markBulk(req, res, next) {
    try {
      const { sectionId, date, attendance } = req.body;
      if (!sectionId || !date || !Array.isArray(attendance)) {
        throw new AppError('sectionId, date, and attendance[] are required', 400);
      }

      // Resolve teacherId from userId (store teacherId in markedBy, fall back to userId)
      let markedBy = req.user.id;
      if (req.user.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
        if (teacher) markedBy = teacher.id;
      }

      success(res, await service.markBulk(sectionId, date, attendance, markedBy));
    } catch (err) { next(err); }
  },

  /** GET /attendance/student/:studentId */
  async getStudentAttendance(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) throw new AppError('startDate and endDate are required', 400);
      success(res, await service.getStudentAttendance(req.params.studentId, startDate, endDate));
    } catch (err) { next(err); }
  },
};

module.exports = ctrl;
