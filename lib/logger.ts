import winston, { format, transports } from 'winston';
import path from 'path';

// Sensitive data patterns to mask
const SENSITIVE_PATTERNS = [
  /password[:=]\s*[^\s,;]+/gi,
  /bearer\s+[^\s,;]+/gi,
  /authorization[:=]\s*[^\s,;]+/gi,
  /key[:=]\s*[^\s,;]+/gi,
  /secret[:=]\s*[^\s,;]+/gi,
  /token[:=]\s*[^\s,;]+/gi,
  /email[:=]\s*[^\s,;]+/gi,
  /phone[:=]\s*[^\s,;]+/gi,
];

// Mask sensitive data
const maskSensitiveData = (data: any): any => {
  if (typeof data === 'string') {
    let maskedData = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      maskedData = maskedData.replace(pattern, match => {
        const [key, ...value] = match.split(/[:=]\s*/);
        return `${key}=[MASKED]`;
      });
    });
    return maskedData;
  }

  if (data && typeof data === 'object') {
    const masked = { ...data };
    for (const key in masked) {
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('auth')
      ) {
        masked[key] = '[MASKED]';
      } else {
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }

  return data;
};

// Custom format for development
const devFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  const maskedMeta = maskSensitiveData(meta);
  return `${timestamp} ${level}: ${message} ${Object.keys(maskedMeta).length ? JSON.stringify(maskedMeta, null, 2) : ''}`;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
import { mkdirSync } from 'fs';
mkdirSync(logsDir, { recursive: true });

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      devFormat
    )
  }));
}

// Utility functions
export const logInfo = (message: string, meta: any = {}) => {
  logger.info(message, maskSensitiveData(meta));
};

export const logError = (message: string, error: any = {}) => {
  logger.error(message, maskSensitiveData(error));
};

export const logWarning = (message: string, meta: any = {}) => {
  logger.warn(message, maskSensitiveData(meta));
};

export const logDebug = (message: string, meta: any = {}) => {
  logger.debug(message, maskSensitiveData(meta));
};

export default logger;
