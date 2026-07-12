const router = require('express').Router();
const ctrl = require('../controllers/homework.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const TEACHERS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize(...TEACHERS), ctrl.create);
router.put('/:id', authorize(...TEACHERS), ctrl.update);
router.delete('/:id', authorize(...TEACHERS), ctrl.remove);
router.post('/:id/submit', ctrl.submit);
router.patch('/:id/submissions/:submissionId/grade', authorize(...TEACHERS), ctrl.grade);
module.exports = router;
