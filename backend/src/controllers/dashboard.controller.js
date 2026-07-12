const service = require('../services/dashboard.service');
const { success } = require('../utils/response');

const ctrl = {
  async getStats(req, res, next) {
    try { success(res, await service.getStats()); }
    catch (err) { next(err); }
  },
  async getAttendanceTrend(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;
      success(res, await service.getAttendanceTrend(days));
    } catch (err) { next(err); }
  },
  async getFeeCollectionTrend(req, res, next) {
    try {
      const months = parseInt(req.query.months) || 6;
      success(res, await service.getFeeCollectionTrend(months));
    } catch (err) { next(err); }
  },
};
module.exports = ctrl;
