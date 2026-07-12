const router = require('express').Router();
const ctrl = require('../controllers/leave.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
router.get('/', authorize(...ADMINS), ctrl.getAll);
router.get('/my', ctrl.getMyLeaves);
router.post('/', ctrl.apply);
router.patch('/:id/approve', authorize(...ADMINS), ctrl.approve);
module.exports = router;
