const service = require('../services/academicYear.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try {
      const result = await service.getAll(req.query);
      if (Array.isArray(result)) return success(res, result);
      const { data, total, page, limit } = result;
      paginate(res, data, total, page, limit);
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try { success(res, await service.getById(req.params.id)); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { success(res, await service.create(req.body), 'Created', 201); }
    catch (err) { next(err); }
  },
  async update(req, res, next) {
    try { success(res, await service.update(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await service.remove(req.params.id);
      success(res, {}, 'Deleted');
    } catch (err) { next(err); }
  },
};
module.exports = ctrl;
