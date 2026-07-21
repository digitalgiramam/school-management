const service = require('../services/classSubject.service');
const { success } = require('../utils/response');
const { AppError } = require('../utils/errors');

const ctrl = {
  /** GET /class-subjects?classId= */
  async getByClass(req, res, next) {
    try {
      const { classId } = req.query;
      if (!classId) throw new AppError('classId is required', 400);
      success(res, await service.getByClass(classId));
    } catch (err) { next(err); }
  },

  /** POST /class-subjects  { classId, subjectId } */
  async assign(req, res, next) {
    try {
      const { classId, subjectId } = req.body;
      if (!classId || !subjectId) throw new AppError('classId and subjectId are required', 400);
      success(res, await service.assign(classId, subjectId), 'Subject assigned to class', 201);
    } catch (err) { next(err); }
  },

  /** DELETE /class-subjects  { classId, subjectId } */
  async remove(req, res, next) {
    try {
      const { classId, subjectId } = req.body;
      if (!classId || !subjectId) throw new AppError('classId and subjectId are required', 400);
      await service.remove(classId, subjectId);
      success(res, null, 'Subject removed from class');
    } catch (err) { next(err); }
  },
};

module.exports = ctrl;
