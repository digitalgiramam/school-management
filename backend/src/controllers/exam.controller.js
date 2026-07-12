const service = require('../services/exam.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try { success(res, await service.getAll(req.query)); }
    catch (err) { next(err); }
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
    try { await service.remove(req.params.id); success(res, {}, 'Deleted'); }
    catch (err) { next(err); }
  },
  async saveBulkMarks(req, res, next) {
    try { success(res, await service.saveBulkMarks(req.params.examSubjectId, req.body.marks || req.body)); }
    catch (err) { next(err); }
  },
  async getReportCard(req, res, next) {
    try { success(res, await service.getReportCard(req.query.studentId, req.query.examId)); }
    catch (err) { next(err); }
  },
  async getRankList(req, res, next) {
    try { success(res, await service.getRankList(req.query)); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
