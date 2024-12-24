import winston, { format } from 'winston';

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

const logger = {
  logInfo: (message: string, meta: any = {}) => {
    console.log(`[INFO] ${message}`, maskSensitiveData(meta));
  },
  
  logError: (message: any, ...args: any[]) => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  logWarning: (message: string, meta: any = {}) => {
    console.warn(`[WARN] ${message}`, maskSensitiveData(meta));
  },
  
  logDebug: (message: string, meta: any = {}) => {
    console.debug(`[DEBUG] ${message}`, maskSensitiveData(meta));
  }
};

export default logger;
