const router = require('express').Router();
const ctrl = require('../controllers/fee.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'];

// Fee structures
router.get('/structures', ctrl.getStructures);
router.post('/structures', authorize(...ADMINS), ctrl.createStructure);
router.put('/structures/:id', authorize(...ADMINS), ctrl.updateStructure);
router.delete('/structures/:id', authorize(...ADMINS), ctrl.deleteStructure);

// Fee invoices
router.get('/invoices', ctrl.getInvoices);
router.post('/invoices', authorize(...ADMINS), ctrl.createInvoice);
router.get('/invoices/:id', ctrl.getInvoiceById);

// Payments
router.post('/invoices/:id/payment', authorize(...ADMINS), ctrl.recordPayment);

// Reports
router.get('/collection-report', authorize(...ADMINS), ctrl.getCollectionReport);
router.get('/pending', ctrl.getPendingFees);

module.exports = router;
