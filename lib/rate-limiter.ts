// Lightweight in-memory sliding window Rate Limiter for Next.js API Routes

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const windowMs = 60 * 1000;
    rateLimitMap.forEach((record, ip) => {
      const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (validTimestamps.length === 0) {
        rateLimitMap.delete(ip);
      } else {
        rateLimitMap.set(ip, { timestamps: validTimestamps });
      }
    });
  }, 10 * 60 * 1000);
}

/**
 * Checks if an IP address has exceeded the maximum allowed requests in a window.
 * Default: Max 5 checkout requests per IP per 60 seconds.
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const cleanIp = ip || "127.0.0.1";

  const record = rateLimitMap.get(cleanIp) || { timestamps: [] };
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  validTimestamps.push(now);
  rateLimitMap.set(cleanIp, { timestamps: validTimestamps });

  return { allowed: true, remaining: maxRequests - validTimestamps.length };
}
