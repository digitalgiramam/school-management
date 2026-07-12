const router = require('express').Router();
const ctrl = require('../controllers/exam.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];

router.get('/', ctrl.getAll);
router.get('/report-card', ctrl.getReportCard);
router.get('/rank-list', ctrl.getRankList);
router.get('/:id', ctrl.getById);
router.post('/', authorize(...ADMINS), ctrl.create);
router.put('/:id', authorize(...ADMINS), ctrl.update);
router.delete('/:id', authorize(...ADMINS), ctrl.remove);
router.post('/:examSubjectId/marks', authorize(...ADMINS), ctrl.saveBulkMarks);

module.exports = router;
