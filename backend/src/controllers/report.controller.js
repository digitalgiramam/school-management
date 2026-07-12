const service = require('../services/report.service');
const { success } = require('../utils/response');

const ctrl = {
  async getStudentReport(req, res, next) {
    try { success(res, await service.getStudentReport(req.query)); }
    catch (err) { next(err); }
  },
  async getAttendanceReport(req, res, next) {
    try { success(res, await service.getAttendanceReport(req.query)); }
    catch (err) { next(err); }
  },
  async getFeeReport(req, res, next) {
    try { success(res, await service.getFeeReport(req.query)); }
    catch (err) { next(err); }
  },
  async getPayrollReport(req, res, next) {
    try { success(res, await service.getPayrollReport(req.query)); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
