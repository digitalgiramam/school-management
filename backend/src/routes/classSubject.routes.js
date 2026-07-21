const router = require('express').Router();
const ctrl = require('../controllers/classSubject.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

router.get('/',    ctrl.getByClass);                   // anyone authenticated
router.post('/',   authorize(...ADMINS), ctrl.assign);
router.delete('/', authorize(...ADMINS), ctrl.remove);

module.exports = router;
