const service = require('../services/payroll.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try { const r = await service.getAll(req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async generate(req, res, next) {
    try { success(res, await service.generate(req.body), 'Payroll generated', 201); }
    catch (err) { next(err); }
  },
  async markPaid(req, res, next) {
    try { success(res, await service.markPaid(req.params.id), 'Marked as paid'); }
    catch (err) { next(err); }
  },
  async getSummary(req, res, next) {
    try { success(res, await service.getSummary(req.query)); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
