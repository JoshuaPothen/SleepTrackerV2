import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for the ingest endpoint.
// Allows max 5 requests per IP per minute.
// Note: resets on cold start — for production use an edge KV store (Vercel KV).
const requestCounts = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;  // per window per IP (30s interval × 10 = 5 min of data)

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/ingest' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const now = Date.now();

    const entry = requestCounts.get(ip);
    if (!entry || now - entry.windowStart > WINDOW_MS) {
      requestCounts.set(ip, { count: 1, windowStart: now });
    } else {
      entry.count++;
      if (entry.count > MAX_REQUESTS) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/ingest'],
};
