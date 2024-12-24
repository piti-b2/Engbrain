import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiter for API routes
const apiLimiter = new RateLimiterMemory({
  points: 10, // Number of points
  duration: 1, // Per second
  blockDuration: 60, // Block for 1 minute if exceeded
});

// Rate limiter for general requests
const generalLimiter = new RateLimiterMemory({
  points: 60, // Number of points
  duration: 60, // Per minute
  blockDuration: 300, // Block for 5 minutes if exceeded
});

// Rate limiter for authentication attempts
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 60 * 15, // Per 15 minutes
  blockDuration: 60 * 30, // Block for 30 minutes if exceeded
});

export async function rateLimitMiddleware(
  req: NextRequest,
  res: NextResponse,
  type: 'api' | 'general' | 'auth' = 'general'
) {
  const ip = req.ip || '127.0.0.1';
  const limiter = type === 'api' 
    ? apiLimiter 
    : type === 'auth'
    ? authLimiter
    : generalLimiter;

  try {
    await limiter.consume(ip);
    return null; // Continue processing
  } catch (error) {
    // Rate limit exceeded
    const retryAfter = (error as { msBeforeNext?: number }).msBeforeNext
      ? Math.round((error as { msBeforeNext: number }).msBeforeNext / 1000)
      : 60;
    
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: `Please try again after ${retryAfter} seconds`,
      }),
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Helper function for API routes
export async function checkApiLimit(req: NextRequest, res: NextApiResponse) {
  const ip = req.ip || '127.0.0.1';

  try {
    await apiLimiter.consume(ip);
  } catch (error) {
    const retryAfter = (error as { msBeforeNext?: number }).msBeforeNext
      ? Math.round((error as { msBeforeNext: number }).msBeforeNext / 1000)
      : 60;
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Too many requests',
      message: `Please try again after ${retryAfter} seconds`,
    });
    return false;
  }
  return true;
}
