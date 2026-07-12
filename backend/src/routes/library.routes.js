const router = require('express').Router();
const ctrl = require('../controllers/library.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const LIBRARIANS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN'];

router.get('/books', ctrl.getBooks);
router.get('/books/:id', ctrl.getBook);
router.post('/books', authorize(...LIBRARIANS), ctrl.createBook);
router.put('/books/:id', authorize(...LIBRARIANS), ctrl.updateBook);
router.delete('/books/:id', authorize(...LIBRARIANS), ctrl.deleteBook);
router.get('/issues', ctrl.getActiveIssues);
router.post('/issue', authorize(...LIBRARIANS), ctrl.issueBook);
router.post('/return/:id', authorize(...LIBRARIANS), ctrl.returnBook);
router.get('/categories', ctrl.getCategories);

module.exports = router;
