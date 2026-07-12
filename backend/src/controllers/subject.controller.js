const service = require('../services/subject.service');
const { success, paginate } = require('../utils/response');
const { audit } = require('../utils/audit');

const ctrl = {
  async getAll(req, res, next) {
    try {
      const { data, total, page, limit } = await service.getAll(req.query);
      paginate(res, data, total, page, limit);
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try { success(res, await service.getById(req.params.id)); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const item = await service.create(req.body);
      await audit(req.user.id, 'CREATE', 'subject', item.id, req.body, req);
      success(res, item, 'Created', 201);
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const item = await service.update(req.params.id, req.body);
      await audit(req.user.id, 'UPDATE', 'subject', req.params.id, req.body, req);
      success(res, item);
    } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await service.remove(req.params.id);
      await audit(req.user.id, 'DELETE', 'subject', req.params.id, null, req);
      success(res, {}, 'Deleted');
    } catch (err) { next(err); }
  },
};
module.exports = ctrl;
