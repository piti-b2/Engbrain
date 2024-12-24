import { NextApiResponse } from 'next';

// Error types
const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
} as const;

type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

// Error response structure
interface ErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: any;
  };
}

// Production error messages (safe to show to users)
const ERROR_MESSAGES: Record<ErrorType, string> = {
  VALIDATION_ERROR: 'The provided data is invalid.',
  AUTHENTICATION_ERROR: 'Authentication failed.',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred.',
  RATE_LIMIT_ERROR: 'Too many requests. Please try again later.',
  PAYMENT_ERROR: 'Payment processing failed.'
};

// Error logging function
export const logError = (error: any, context?: any) => {
  // In development, log full error
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      error,
      stack: error.stack,
      context
    });
    return;
  }

  // In production, log structured error without sensitive details
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: error.type || 'UNKNOWN_ERROR',
    message: error.message,
    code: error.code,
    context: context ? JSON.stringify(context) : undefined,
    // Add only safe parts of the stack trace
    stackTrace: process.env.NODE_ENV === 'production' 
      ? undefined 
      : error.stack
  };

  // TODO: Add your production logging service here
  // Example: winston, papertrail, etc.
  console.error('Production error:', errorLog);
};

// API error handler
export const handleApiError = (
  error: any,
  res: NextApiResponse,
  context?: any
): void => {
  logError(error, context);

  let errorType: ErrorType = ERROR_TYPES.SERVER_ERROR;

  if (error.type) {
    errorType = error.type;
  }

  const statusCodes = {
    VALIDATION_ERROR: 400,
    AUTHENTICATION_ERROR: 401,
    AUTHORIZATION_ERROR: 403,
    NOT_FOUND: 404,
    RATE_LIMIT_ERROR: 429,
    PAYMENT_ERROR: 402,
    SERVER_ERROR: 500
  };

  const response: ErrorResponse = {
    error: {
      type: errorType,
      message: process.env.NODE_ENV === 'production'
        ? ERROR_MESSAGES[errorType]
        : error.message || ERROR_MESSAGES[errorType],
      code: error.code,
      // Only include safe details in production
      details: process.env.NODE_ENV === 'production'
        ? undefined
        : error.details
    }
  };

  res.status(statusCodes[errorType] || 500).json(response);
};

// Custom error class
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Validation error helper
export const createValidationError = (message: string, details?: any) => {
  return new AppError(ERROR_TYPES.VALIDATION_ERROR, message, 'VALIDATION_FAILED', details);
};

// Not found error helper
export const createNotFoundError = (resource: string) => {
  return new AppError(
    ERROR_TYPES.NOT_FOUND,
    `${resource} not found`,
    'RESOURCE_NOT_FOUND'
  );
};
