const service = require('../services/leave.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try { const r = await service.getAll(req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async apply(req, res, next) {
    try { success(res, await service.apply(req.body), 'Leave applied', 201); }
    catch (err) { next(err); }
  },
  async approve(req, res, next) {
    try {
      const result = await service.approve(req.params.id, { ...req.body, approverId: req.user.id });
      success(res, result, 'Leave updated');
    } catch (err) { next(err); }
  },
  async getMyLeaves(req, res, next) {
    try { const r = await service.getMyLeaves(req.user.id, req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
