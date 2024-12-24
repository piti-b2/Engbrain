import logger from './logger';

// Save original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Override console methods in production
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => {
    logger.logInfo(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  };

  console.info = (...args) => {
    logger.logInfo(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  };

  console.warn = (...args) => {
    logger.logWarning(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  };

  console.error = (...args) => {
    logger.logError(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  };

  console.debug = (...args) => {
    logger.logDebug(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  };
}

// Export original console for cases where we need it
export const originalConsoleLog = originalConsole;
