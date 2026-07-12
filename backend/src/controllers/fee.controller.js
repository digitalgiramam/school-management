const service = require('../services/fee.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getStructures(req, res, next) {
    try { success(res, await service.getStructures(req.query.classId, req.query.academicYearId)); }
    catch (err) { next(err); }
  },
  async createStructure(req, res, next) {
    try { success(res, await service.createStructure(req.body), 'Created', 201); }
    catch (err) { next(err); }
  },
  async updateStructure(req, res, next) {
    try { success(res, await service.updateStructure(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async deleteStructure(req, res, next) {
    try { await service.deleteStructure(req.params.id); success(res, {}, 'Deleted'); }
    catch (err) { next(err); }
  },
  async getInvoices(req, res, next) {
    try {
      const { invoices, total, page, limit } = await service.getInvoices(req.query);
      paginate(res, invoices, total, page, limit);
    } catch (err) { next(err); }
  },
  async getInvoiceById(req, res, next) {
    try { success(res, await service.getInvoiceById(req.params.id)); }
    catch (err) { next(err); }
  },
  async createInvoice(req, res, next) {
    try { success(res, await service.createInvoice(req.body), 'Created', 201); }
    catch (err) { next(err); }
  },
  async recordPayment(req, res, next) {
    try { success(res, await service.recordPayment(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async getCollectionReport(req, res, next) {
    try { success(res, await service.getCollectionReport(req.query.startDate, req.query.endDate)); }
    catch (err) { next(err); }
  },
  async getPendingFees(req, res, next) {
    try { success(res, await service.getPendingFees(req.query)); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
