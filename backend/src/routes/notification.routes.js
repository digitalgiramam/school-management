const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Specific routes before parameterised /:id to avoid shadowing
router.patch('/read-all', ctrl.markAllRead);

router.get('/', ctrl.getAll);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
