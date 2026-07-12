const service = require('../services/attendance.service');
const { success } = require('../utils/response');

const ctrl = {
  async getBySection(req, res, next) {
    try {
      const { sectionId, date } = req.query;
      success(res, await service.getBySection(sectionId, date || new Date().toISOString().slice(0, 10)));
    } catch (err) { next(err); }
  },
  async markBulk(req, res, next) {
    try {
      const { sectionId, date, attendance } = req.body;
      success(res, await service.markBulk(sectionId, date, attendance, req.user.id));
    } catch (err) { next(err); }
  },
  async getStudentAttendance(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      success(res, await service.getStudentAttendance(req.params.studentId, startDate, endDate));
    } catch (err) { next(err); }
  },
};
module.exports = ctrl;
