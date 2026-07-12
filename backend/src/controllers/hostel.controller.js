const service = require('../services/hostel.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try { const r = await service.getAll(req.query); paginate(res, r.data, r.total, r.page, r.limit); }
    catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { success(res, await service.create(req.body), 'Hostel created', 201); }
    catch (err) { next(err); }
  },
  async update(req, res, next) {
    try { success(res, await service.update(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async getRooms(req, res, next) {
    try { success(res, await service.getRooms(req.params.id)); }
    catch (err) { next(err); }
  },
  async addRoom(req, res, next) {
    try { success(res, await service.addRoom(req.params.id, req.body), 'Room added', 201); }
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
  async vacate(req, res, next) {
    try { success(res, await service.vacate(req.params.id), 'Student vacated'); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
