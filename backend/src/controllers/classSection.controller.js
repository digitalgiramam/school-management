const service = require('../services/classSection.service');
const { success } = require('../utils/response');
const { AppError } = require('../utils/errors');

const ctrl = {
  /** GET /class-mappings?classId= */
  async getByClass(req, res, next) {
    try {
      const { classId } = req.query;
      if (!classId) throw new AppError('classId is required', 400);
      const sections = await service.getByClass(classId);

      // Also return subjects for this class
      const prisma = require('../config/prisma');
      const subjects = await prisma.classSubject.findMany({
        where: { classId },
        include: { subject: { select: { id: true, name: true, code: true, isActive: true } } },
        orderBy: { subject: { name: 'asc' } },
      });

      success(res, { sections, subjects: subjects.map((s) => ({ mappingId: s.id, ...s.subject })) });
    } catch (err) { next(err); }
  },

  /** POST /class-mappings  { classId, sectionIds[], subjectIds[] } — bulk save */
  async saveMapping(req, res, next) {
    try {
      const { classId, sectionIds, subjectIds } = req.body;
      if (!classId) throw new AppError('classId is required', 400);
      success(res, await service.saveMapping(classId, sectionIds || [], subjectIds || []), 'Mapping saved');
    } catch (err) { next(err); }
  },
};

module.exports = ctrl;
