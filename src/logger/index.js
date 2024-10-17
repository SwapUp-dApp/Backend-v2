// logger.js
import winston from 'winston';
import 'winston-daily-rotate-file';
import Environment from '../config';

// Define log file rotation
const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/swapup-logs-%DATE%.log', // Log files will rotate daily
  datePattern: 'YYYY-MM-DD',
  maxSize: '30m', // Max size per file before rotation
  maxFiles: '14d', // Keep logs for the last 14 days
});

// Set up the logger
const logger = winston.createLogger({
  // level: Environment.ENVIRONMENT_KEY === 'production' ? 'error' : 'info', // If we want to show only error logs in production
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    transport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;
