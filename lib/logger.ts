import winston, { format } from 'winston';
import { maskSensitiveData } from './utils';

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

// Log levels in order of severity
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

// Get current log level from environment variable
const getCurrentLogLevel = (): LogLevel => {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : 'info';
};

const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = LOG_LEVELS[getCurrentLogLevel()];
  const targetLevel = LOG_LEVELS[level];
  return targetLevel <= currentLevel;
};

const logger = {
  logInfo: (message: string, meta: any = {}) => {
    if (shouldLog('info')) {
      console.log(`[INFO] ${message}`, maskSensitiveData(meta));
    }
  },
  
  logError: (message: any, ...args: any[]) => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  logWarning: (message: string, meta: any = {}) => {
    if (shouldLog('warn')) {
      console.warn(`[WARNING] ${message}`, maskSensitiveData(meta));
    }
  },
  
  logDebug: (message: string, meta: any = {}) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, maskSensitiveData(meta));
    }
  },
};

export default logger;
