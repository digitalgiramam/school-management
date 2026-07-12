const service = require('../services/timetable.service');
const { success } = require('../utils/response');

const ctrl = {
  async getBySection(req, res, next) {
    try {
      const { sectionId, academicYearId } = req.query;
      if (!sectionId || !academicYearId)
        return res.status(400).json({ success: false, message: 'sectionId and academicYearId required' });
      const result = await service.getBySection(sectionId, academicYearId);
      success(res, result);
    } catch (err) { next(err); }
  },
  async upsert(req, res, next) {
    try {
      const result = await service.upsert(req.body);
      success(res, result, 'Timetable created', 201);
    } catch (err) { next(err); }
  },
  async addSlot(req, res, next) {
    try {
      const slot = await service.addSlot(req.params.id, req.body);
      success(res, slot, 'Slot added', 201);
    } catch (err) { next(err); }
  },
  async updateSlot(req, res, next) {
    try {
      const slot = await service.updateSlot(req.params.slotId, req.body);
      success(res, slot);
    } catch (err) { next(err); }
  },
  async deleteSlot(req, res, next) {
    try {
      await service.deleteSlot(req.params.slotId);
      success(res, {}, 'Slot deleted');
    } catch (err) { next(err); }
  },
};
module.exports = ctrl;
