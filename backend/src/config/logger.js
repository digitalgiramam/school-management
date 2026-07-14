const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Vercel's filesystem is read-only — skip file transports in serverless
const isServerless = !!process.env.VERCEL;

const loggerTransports = [
  new transports.Console({
    format: combine(colorize(), logFormat),
    silent: process.env.NODE_ENV === 'test',
  }),
];

const exceptionHandlers = [new transports.Console()];
const rejectionHandlers = [new transports.Console()];

if (!isServerless) {
  const DailyRotateFile = require('winston-daily-rotate-file');

  loggerTransports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  exceptionHandlers.push(
    new transports.File({ filename: path.join('logs', 'exceptions.log') })
  );
  rejectionHandlers.push(
    new transports.File({ filename: path.join('logs', 'rejections.log') })
  );
}

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // In serverless, never call process.exit() — let the platform handle it
  exitOnError: !isServerless,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: loggerTransports,
  exceptionHandlers,
  rejectionHandlers,
});

module.exports = logger;
