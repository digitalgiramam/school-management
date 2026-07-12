const service = require('../services/library.service');
const { success, paginate } = require('../utils/response');

const ctrl = {
  async getBooks(req, res, next) {
    try {
      const { data, total, page, limit } = await service.getBooks(req.query);
      paginate(res, data, total, page, limit);
    } catch (err) { next(err); }
  },
  async getBook(req, res, next) {
    try { success(res, await service.getBook(req.params.id)); }
    catch (err) { next(err); }
  },
  async createBook(req, res, next) {
    try { success(res, await service.createBook(req.body), 'Book created', 201); }
    catch (err) { next(err); }
  },
  async updateBook(req, res, next) {
    try { success(res, await service.updateBook(req.params.id, req.body)); }
    catch (err) { next(err); }
  },
  async deleteBook(req, res, next) {
    try {
      await service.deleteBook(req.params.id);
      success(res, {}, 'Book deleted');
    } catch (err) { next(err); }
  },
  async issueBook(req, res, next) {
    try { success(res, await service.issueBook(req.body), 'Book issued', 201); }
    catch (err) { next(err); }
  },
  async returnBook(req, res, next) {
    try { success(res, await service.returnBook(req.params.id, req.body), 'Book returned'); }
    catch (err) { next(err); }
  },
  async getActiveIssues(req, res, next) {
    try {
      const { data, total, page, limit } = await service.getActiveIssues(req.query);
      paginate(res, data, total, page, limit);
    } catch (err) { next(err); }
  },
  async getCategories(req, res, next) {
    try { success(res, await service.getCategories()); }
    catch (err) { next(err); }
  },
};
module.exports = ctrl;
