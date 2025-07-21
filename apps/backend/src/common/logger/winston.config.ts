import * as winston from 'winston';
const DailyRotateFile = require('winston-daily-rotate-file');
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

const { combine, timestamp, errors, json, prettyPrint } = winston.format;

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.ms(),
  nestWinstonModuleUtilities.format.nestLike('SaasTemplate', {
    prettyPrint: true,
    colors: true,
  }),
);

// Custom format for file output
const fileFormat = combine(
  timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  errors({ stack: true }),
  json(),
);

// Transport for error logs
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: fileFormat,
});

// Transport for combined logs
const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
});

// Transport for console output
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// Create Winston logger configuration
export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
};

// Create logger instance
export const logger = winston.createLogger(winstonConfig);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ message: "Unhandled Rejection at:", promise, reason});
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Log levels reference
export const LogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

// Environment-specific configuration
if (process.env.NODE_ENV === 'production') {
  // In production, log only warn and above to console
  consoleTransport.level = 'warn';
} else {
  // In development, log everything to console
  consoleTransport.level = 'debug';
}

// Helper function to create child logger with metadata
export const createLogger = (context: string, metadata?: Record<string, any>) => {
  return logger.child({ context, ...metadata });
};