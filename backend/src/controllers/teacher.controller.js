const service = require('../services/teacher.service');
const { success, paginate } = require('../utils/response');
const { audit } = require('../utils/audit');
const { uploadToCloudinary } = require('../middlewares/upload.middleware');
const { AppError } = require('../utils/errors');
const prisma = require('../config/prisma');

const ctrl = {
  async getAll(req, res, next) {
    try {
      const { data, total, page, limit } = await service.getAll(req.query);
      paginate(res, data, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try { success(res, await service.getById(req.params.id)); }
    catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const teacher = await service.create(req.body);
      await audit(req.user.id, 'CREATE', 'Teacher', teacher.id, req.body, req);
      success(res, teacher, 'Teacher created', 201);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const teacher = await service.update(req.params.id, req.body);
      await audit(req.user.id, 'UPDATE', 'Teacher', req.params.id, req.body, req);
      success(res, teacher, 'Teacher updated');
    } catch (err) { next(err); }
  },

  async deactivate(req, res, next) {
    try {
      await service.deactivate(req.params.id);
      await audit(req.user.id, 'DELETE', 'Teacher', req.params.id, null, req);
      success(res, {}, 'Teacher deactivated');
    } catch (err) { next(err); }
  },

  async assignSubjects(req, res, next) {
    try {
      const teacher = await service.assignSubjects(req.params.id, req.body.subjectIds || []);
      success(res, teacher, 'Subjects assigned');
    } catch (err) { next(err); }
  },

  async getAttendance(req, res, next) {
    try {
      const result = await service.getAttendanceSummary(req.params.id, req.query);
      success(res, result);
    } catch (err) { next(err); }
  },

  async uploadPhoto(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const uploaded = await uploadToCloudinary(req.file.buffer, {
        folder: 'school/profiles',
        public_id: `teacher_${req.params.id}`,
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      await prisma.teacher.update({
        where: { id: req.params.id },
        data: { user: { update: { profilePhoto: uploaded.secure_url } } },
      });
      success(res, { url: uploaded.secure_url }, 'Photo uploaded');
    } catch (err) { next(err); }
  },
};

module.exports = ctrl;
