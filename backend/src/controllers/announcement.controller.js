const service = require('../services/announcement.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try { const r = await service.getAll(req.query, req.user.role); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { success(res, await service.create({ ...req.body, publishedBy: req.user.id }), 'Announcement created', 201); }
    catch (err) { next(err); }
  },
  async update(req, res, next) {
    try { success(res, await service.update(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try { await service.remove(req.params.id); success(res, {}, 'Deleted'); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
