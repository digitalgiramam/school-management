const service = require('../services/homework.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try { const r = await service.getAll(req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try { success(res, await service.getById(req.params.id)); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { success(res, await service.create(req.body), 'Homework created', 201); }
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
  async submit(req, res, next) {
    try { success(res, await service.submit(req.params.id, req.body), 'Submitted', 201); }
    catch (err) { next(err); }
  },
  async grade(req, res, next) {
    try { success(res, await service.grade(req.params.submissionId, req.body)); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
