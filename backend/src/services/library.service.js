const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const libraryService = {
  async getBooks(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const { status, categoryId } = query;

    const where = {
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } },
          { publisher: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.book.findMany({
        where, skip, take: limit,
        orderBy: { title: 'asc' },
        include: {
          author: { select: { name: true } },
          category: { select: { name: true } },
          _count: { select: { issues: true } },
        },
      }),
      prisma.book.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async getBook(id) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        issues: {
          orderBy: { issuedAt: 'desc' },
          take: 20,
          include: { book: { select: { title: true } } },
        },
      },
    });
    if (!book) throw new AppError('Book not found', 404);
    return book;
  },

  async createBook(data) {
    const { title, isbn, barcode, publisher, edition, totalCopies,
            location, authorName, categoryName } = data;

    let authorId = null;
    if (authorName) {
      const author = await prisma.author.upsert({
        where: { name: authorName },
        create: { name: authorName },
        update: {},
      });
      authorId = author.id;
    }

    let categoryId = null;
    if (categoryName) {
      const cat = await prisma.bookCategory.upsert({
        where: { name: categoryName },
        create: { name: categoryName },
        update: {},
      });
      categoryId = cat.id;
    }

    const copies = parseInt(totalCopies) || 1;
    return prisma.book.create({
      data: {
        title, isbn, barcode, publisher, edition,
        totalCopies: copies, available: copies,
        location, authorId, categoryId,
      },
      include: { author: { select: { name: true } }, category: { select: { name: true } } },
    });
  },

  async updateBook(id, data) {
    const { title, isbn, publisher, edition, totalCopies, location } = data;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new AppError('Book not found', 404);

    const copies = totalCopies ? parseInt(totalCopies) : undefined;
    const issued = book.totalCopies - book.available;
    const newAvailable = copies !== undefined ? copies - issued : undefined;

    return prisma.book.update({
      where: { id },
      data: {
        title, isbn, publisher, edition, location,
        ...(copies !== undefined && { totalCopies: copies, available: newAvailable }),
      },
    });
  },

  async deleteBook(id) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: { _count: { select: { issues: true } } },
    });
    if (!book) throw new AppError('Book not found', 404);
    if (book._count.issues > 0) throw new AppError('Cannot delete book with active or past issues', 400);
    return prisma.book.delete({ where: { id } });
  },

  async issueBook(data) {
    const { bookId, borrowerId, dueDays = 14 } = data;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new AppError('Book not found', 404);
    if (book.available <= 0) throw new AppError('No copies available', 400);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueDays));

    const [issue] = await prisma.$transaction([
      prisma.bookIssue.create({
        data: { bookId, borrowerId, dueDate },
        include: { book: { select: { title: true } } },
      }),
      prisma.book.update({
        where: { id: bookId },
        data: {
          available: { decrement: 1 },
          status: book.available - 1 === 0 ? 'ISSUED' : 'AVAILABLE',
        },
      }),
    ]);
    return issue;
  },

  async returnBook(issueId, data = {}) {
    const issue = await prisma.bookIssue.findUnique({
      where: { id: issueId },
      include: { book: true },
    });
    if (!issue) throw new AppError('Issue record not found', 404);
    if (issue.returnedAt) throw new AppError('Book already returned', 400);

    const now = new Date();
    let fineAmount = 0;
    if (now > issue.dueDate) {
      const overdueDays = Math.floor((now - issue.dueDate) / 86400000);
      fineAmount = overdueDays * (data.finePerDay || 5);
    }

    const [updated] = await prisma.$transaction([
      prisma.bookIssue.update({
        where: { id: issueId },
        data: { returnedAt: now, fineAmount, finePaid: fineAmount === 0 },
      }),
      prisma.book.update({
        where: { id: issue.bookId },
        data: { available: { increment: 1 }, status: 'AVAILABLE' },
      }),
    ]);
    return { ...updated, fineAmount };
  },

  async getActiveIssues(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.bookIssue.findMany({
        where: { returnedAt: null },
        skip, take: limit,
        orderBy: { dueDate: 'asc' },
        include: { book: { select: { title: true, isbn: true } } },
      }),
      prisma.bookIssue.count({ where: { returnedAt: null } }),
    ]);
    return { data: items, total, page, limit };
  },

  async getCategories() {
    return prisma.bookCategory.findMany({ orderBy: { name: 'asc' } });
  },
};

module.exports = libraryService;
