const service = require('../services/notification.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getAll(req, res, next) {
    try {
      const r = await service.getAll(req.user.id, req.query);
      paginate(res, r.data, r.total, r.page, r.limit, { unreadCount: r.unreadCount });
    } catch (err) { next(err); }
  },
  async markRead(req, res, next) {
    try { success(res, await service.markRead(req.params.id, req.user.id)); }
    catch (err) { next(err); }
  },
  async markAllRead(req, res, next) {
    try { success(res, await service.markAllRead(req.user.id)); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
