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
      maskedData = maskedData.replace(pattern, '[REDACTED]');
    });
    return maskedData;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => maskSensitiveData(item));
    }

    const maskedData: any = {};
    for (const [key, value] of Object.entries(data)) {
      maskedData[key] = maskSensitiveData(value);
    }
    return maskedData;
  }

  return data;
};

// Original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
};

const logger = {
  logInfo: (message: string, meta: any = {}) => {
    if (shouldLog('info')) {
      originalConsole.log(`[INFO] ${message}`, maskSensitiveData(meta));
    }
  },
  
  logError: (message: any, ...args: any[]) => {
    if (shouldLog('error')) {
      originalConsole.error(`[ERROR] ${message}`, ...args.map(arg => maskSensitiveData(arg)));
    }
  },
  
  logWarning: (message: string, meta: any = {}) => {
    if (shouldLog('warn')) {
      originalConsole.warn(`[WARNING] ${message}`, maskSensitiveData(meta));
    }
  },
  
  logDebug: (message: string, meta: any = {}) => {
    if (shouldLog('debug')) {
      originalConsole.debug(`[DEBUG] ${message}`, maskSensitiveData(meta));
    }
  },
};

export default logger;
