const settingsService = require('../services/settings.service');
const { success } = require('../utils/response');
const { audit } = require('../utils/audit');
const { uploadToCloudinary } = require('../middlewares/upload.middleware');
const { AppError } = require('../utils/errors');

const settingsController = {
  // ── Profile ───────────────────────────────────────────────────
  async getProfile(req, res, next) {
    try {
      const profile = await settingsService.getProfile(req.user.id);
      success(res, profile, 'Profile fetched');
    } catch (err) { next(err); }
  },

  async updateProfile(req, res, next) {
    try {
      const profile = await settingsService.updateProfile(req.user.id, req.user.role, req.body);
      await audit(req.user.id, 'UPDATE', 'Profile', req.user.id, null, req);
      success(res, profile, 'Profile updated');
    } catch (err) { next(err); }
  },

  async updateProfilePhoto(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const uploaded = await uploadToCloudinary(req.file.buffer, {
        folder: 'school/profiles',
        public_id: `user_${req.user.id}`,
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      const result = await settingsService.updateProfilePhoto(req.user.id, uploaded.secure_url);
      success(res, result, 'Profile photo updated');
    } catch (err) { next(err); }
  },

  // ── Password ──────────────────────────────────────────────────
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await settingsService.changePassword(req.user.id, currentPassword, newPassword);
      await audit(req.user.id, 'UPDATE', 'Password', req.user.id, null, req);
      success(res, {}, 'Password changed successfully');
    } catch (err) { next(err); }
  },

  // ── School Settings ───────────────────────────────────────────
  async getSchoolSettings(req, res, next) {
    try {
      const data = await settingsService.getSchoolSettings();
      success(res, data, 'School settings fetched');
    } catch (err) { next(err); }
  },

  async updateSchoolSettings(req, res, next) {
    try {
      const data = await settingsService.updateSchoolSettings(req.body);
      await audit(req.user.id, 'UPDATE', 'SchoolSettings', null, req.body, req);
      success(res, data, 'School settings updated');
    } catch (err) { next(err); }
  },

  // ── Grade Settings ────────────────────────────────────────────
  async getGradeSettings(req, res, next) {
    try {
      success(res, await settingsService.getGradeSettings(), 'Grade settings fetched');
    } catch (err) { next(err); }
  },

  async upsertGrade(req, res, next) {
    try {
      const grade = await settingsService.upsertGrade(req.body);
      success(res, grade, req.body.id ? 'Grade updated' : 'Grade created', req.body.id ? 200 : 201);
    } catch (err) { next(err); }
  },

  async deleteGrade(req, res, next) {
    try {
      await settingsService.deleteGrade(req.params.id);
      success(res, {}, 'Grade deleted');
    } catch (err) { next(err); }
  },

  // ── Academic Years ────────────────────────────────────────────
  async getAcademicYears(req, res, next) {
    try {
      success(res, await settingsService.getAcademicYears(), 'Academic years fetched');
    } catch (err) { next(err); }
  },

  async createAcademicYear(req, res, next) {
    try {
      const ay = await settingsService.createAcademicYear(req.body);
      success(res, ay, 'Academic year created', 201);
    } catch (err) { next(err); }
  },

  async setCurrentAcademicYear(req, res, next) {
    try {
      const ay = await settingsService.setCurrentAcademicYear(req.params.id);
      success(res, ay, 'Current academic year updated');
    } catch (err) { next(err); }
  },

  async deleteAcademicYear(req, res, next) {
    try {
      await settingsService.deleteAcademicYear(req.params.id);
      success(res, {}, 'Academic year deleted');
    } catch (err) { next(err); }
  },

  // ── Branches ──────────────────────────────────────────────────
  async getBranches(req, res, next) {
    try {
      success(res, await settingsService.getBranches(), 'Branches fetched');
    } catch (err) { next(err); }
  },

  async upsertBranch(req, res, next) {
    try {
      const branch = await settingsService.upsertBranch(req.body);
      success(res, branch, req.body.id ? 'Branch updated' : 'Branch created', req.body.id ? 200 : 201);
    } catch (err) { next(err); }
  },

  async deleteBranch(req, res, next) {
    try {
      await settingsService.deleteBranch(req.params.id);
      success(res, {}, 'Branch deleted');
    } catch (err) { next(err); }
  },
};

module.exports = settingsController;
