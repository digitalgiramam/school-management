const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const config = require('./config');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { requestId, requestLogger } = require('./middlewares/requestLogger.middleware');

// ── Process-level exception / rejection handlers ─────────────────
process.on('uncaughtException', (err) => {
  logger.error({ message: 'UNCAUGHT EXCEPTION — process will exit', error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack   = reason instanceof Error ? reason.stack  : undefined;
  logger.error({ message: 'UNHANDLED PROMISE REJECTION', error: message, stack });
});

// ── Routes ──────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const settingsRoutes     = require('./routes/settings.routes');
const userRoutes         = require('./routes/user.routes');
const studentRoutes      = require('./routes/student.routes');
const teacherRoutes      = require('./routes/teacher.routes');
const parentRoutes       = require('./routes/parent.routes');
const classRoutes        = require('./routes/class.routes');
const sectionRoutes      = require('./routes/section.routes');
const subjectRoutes      = require('./routes/subject.routes');
const attendanceRoutes   = require('./routes/attendance.routes');
const timetableRoutes    = require('./routes/timetable.routes');
const examRoutes         = require('./routes/exam.routes');
const markRoutes         = require('./routes/mark.routes');
const feeRoutes          = require('./routes/fee.routes');
const paymentRoutes      = require('./routes/payment.routes');
const libraryRoutes      = require('./routes/library.routes');
const transportRoutes    = require('./routes/transport.routes');
const hostelRoutes       = require('./routes/hostel.routes');
const payrollRoutes      = require('./routes/payroll.routes');
const homeworkRoutes     = require('./routes/homework.routes');
const notificationRoutes = require('./routes/notification.routes');
const announcementRoutes = require('./routes/announcement.routes');
const reportRoutes       = require('./routes/report.routes');
const dashboardRoutes    = require('./routes/dashboard.routes');
const holidayRoutes      = require('./routes/holiday.routes');
const leaveRoutes        = require('./routes/leave.routes');
const academicYearRoutes = require('./routes/academicYear.routes');
const branchRoutes       = require('./routes/branch.routes');
const departmentRoutes   = require('./routes/department.routes');

const app = express();

// ── Request ID ──────────────────────────────────────────────────
app.use(requestId);

// ── Security & compression ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: config.env === 'production' ? undefined : false,
}));
app.use(compression());

// In production the frontend is served from the same origin, so CORS
// only needs to allow the Railway domain (set via CLIENT_URL).
app.use(
  cors({
    origin: config.env === 'production'
      ? [config.clientUrl]
      : config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// ── Rate limiting ───────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Loggers ─────────────────────────────────────────────────────
app.use(requestLogger);
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: () => config.env === 'test',
  })
);

// ── Static uploads ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── API Docs ────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health check ────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ success: true, message: 'Server is healthy', requestId: req.id, timestamp: new Date().toISOString(), env: config.env })
);

// ── API Routes ──────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/settings`,      settingsRoutes);
app.use(`${API}/users`,         userRoutes);
app.use(`${API}/students`,      studentRoutes);
app.use(`${API}/teachers`,      teacherRoutes);
app.use(`${API}/parents`,       parentRoutes);
app.use(`${API}/classes`,       classRoutes);
app.use(`${API}/sections`,      sectionRoutes);
app.use(`${API}/subjects`,      subjectRoutes);
app.use(`${API}/attendance`,    attendanceRoutes);
app.use(`${API}/timetables`,    timetableRoutes);
app.use(`${API}/exams`,         examRoutes);
app.use(`${API}/marks`,         markRoutes);
app.use(`${API}/fees`,          feeRoutes);
app.use(`${API}/payments`,      paymentRoutes);
app.use(`${API}/library`,       libraryRoutes);
app.use(`${API}/transport`,     transportRoutes);
app.use(`${API}/hostel`,        hostelRoutes);
app.use(`${API}/payroll`,       payrollRoutes);
app.use(`${API}/homework`,      homeworkRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/announcements`, announcementRoutes);
app.use(`${API}/reports`,       reportRoutes);
app.use(`${API}/dashboard`,     dashboardRoutes);
app.use(`${API}/holidays`,      holidayRoutes);
app.use(`${API}/leaves`,        leaveRoutes);
app.use(`${API}/academic-years`,academicYearRoutes);
app.use(`${API}/branches`,      branchRoutes);
app.use(`${API}/departments`,   departmentRoutes);

// ── Serve React frontend in production ──────────────────────────
if (config.env === 'production') {
  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  // SPA fallback — let React Router handle client-side routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── Error handlers (must be LAST) ──────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
  if (config.env !== 'production') {
    logger.info(`API docs: http://localhost:${PORT}/api-docs`);
  }
});

module.exports = app;
