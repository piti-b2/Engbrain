import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logger from '../lib/logger';

// Suppress Next.js default logging
if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DISABLE_LOGS === 'true') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  // Keep console.error for critical errors
}

export function middleware(request: NextRequest) {
  // Log only if needed
  if (process.env.LOG_LEVEL === 'debug') {
    logger.logDebug(`Request: ${request.method} ${request.url}`);
  }

  return NextResponse.next();
}
