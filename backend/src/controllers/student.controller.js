const studentService = require('../services/student.service');
const { success, paginate } = require('../utils/response');
const { audit } = require('../utils/audit');

const studentController = {
  async getAll(req, res, next) {
    try {
      const { students, total, page, limit } = await studentService.getAll(req.query);
      paginate(res, students, total, page, limit, 'Students fetched');
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const student = await studentService.getById(req.params.id);
      success(res, student, 'Student fetched');
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const student = await studentService.create(req.body);
      await audit(req.user.id, 'CREATE', 'Student', student.id, null, req);
      success(res, student, 'Student created', 201);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const student = await studentService.update(req.params.id, req.body);
      await audit(req.user.id, 'UPDATE', 'Student', req.params.id, null, req);
      success(res, student, 'Student updated');
    } catch (err) { next(err); }
  },

  async deactivate(req, res, next) {
    try {
      await studentService.deactivate(req.params.id);
      await audit(req.user.id, 'DELETE', 'Student', req.params.id, null, req);
      success(res, {}, 'Student deactivated');
    } catch (err) { next(err); }
  },

  async promote(req, res, next) {
    try {
      await studentService.promote(req.params.id, req.body.toSectionId, req.body.remarks);
      success(res, {}, 'Student promoted');
    } catch (err) { next(err); }
  },

  async attendanceSummary(req, res, next) {
    try {
      const { month, year } = req.query;
      const summary = await studentService.getAttendanceSummary(
        req.params.id,
        parseInt(month, 10),
        parseInt(year, 10)
      );
      success(res, summary, 'Attendance summary fetched');
    } catch (err) { next(err); }
  },

  async uploadPhoto(req, res, next) {
    try {
      if (!req.file) throw new Error('No file uploaded');
      const url = `/uploads/${req.file.filename}`;
      await require('../config/prisma').student.update({
        where: { id: req.params.id },
        data: { user: { update: { profilePhoto: url } } },
      });
      success(res, { url }, 'Photo uploaded');
    } catch (err) { next(err); }
  },
};

module.exports = studentController;
