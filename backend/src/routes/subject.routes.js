const router = require('express').Router();
const ctrl = require('../controllers/subject.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize(...ADMINS), ctrl.create);
router.put('/:id', authorize(...ADMINS), ctrl.update);
router.delete('/:id', authorize(...ADMINS), ctrl.remove);
module.exports = router;
