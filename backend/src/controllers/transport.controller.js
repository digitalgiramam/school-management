const service = require('../services/transport.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getBuses(req, res, next) {
    try { const r = await service.getBuses(req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async createBus(req, res, next) {
    try { success(res, await service.createBus(req.body), 'Bus created', 201); }
    catch (err) { next(err); }
  },
  async updateBus(req, res, next) {
    try { success(res, await service.updateBus(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async getRoutes(req, res, next) {
    try { const r = await service.getRoutes(req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async createRoute(req, res, next) {
    try { success(res, await service.createRoute(req.body), 'Route created', 201); }
    catch (err) { next(err); }
  },
  async updateRoute(req, res, next) {
    try { success(res, await service.updateRoute(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async deleteRoute(req, res, next) {
    try { await service.deleteRoute(req.params.id); success(res, {}, 'Deleted'); }
    catch (err) { next(err); }
  },
  async allocate(req, res, next) {
    try { success(res, await service.allocate(req.body), 'Student allocated', 201); }
    catch (err) { next(err); }
  },
  async getAllocations(req, res, next) {
    try { const r = await service.getAllocations(req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async deallocate(req, res, next) {
    try { success(res, await service.deallocate(req.params.id), 'Student deallocated'); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
