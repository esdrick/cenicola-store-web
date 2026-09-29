// Lightweight in-memory sliding window Rate Limiter for Next.js API Routes

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxWindowMs = 15 * 60 * 1000;
    rateLimitMap.forEach((record, key) => {
      const validTimestamps = record.timestamps.filter((ts) => now - ts < maxWindowMs);
      if (validTimestamps.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, { timestamps: validTimestamps });
      }
    });
  }, 10 * 60 * 1000);
}

/**
 * Checks if an IP or key address has exceeded the maximum allowed requests in a window.
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

/**
 * Checks cooldown and rate limits for PIN / Auth verification requests WITHOUT committing a new attempt.
 * - Minimum cooldown between consecutive requests: cooldownMs (default 60 seconds)
 * - Maximum requests in a broader window: maxRequests in windowMs (default 5 requests in 15 minutes)
 */
export function checkPinRateLimit(
  key: string,
  options?: {
    cooldownMs?: number;
    maxRequests?: number;
    windowMs?: number;
  }
): {
  allowed: boolean;
  secondsRemaining?: number;
  error?: string;
} {
  const now = Date.now();
  const cleanKey = `pin:${key || "anonymous"}`;
  const cooldownMs = options?.cooldownMs ?? 60 * 1000;
  const maxRequests = options?.maxRequests ?? 5;
  const windowMs = options?.windowMs ?? 15 * 60 * 1000;

  const record = rateLimitMap.get(cleanKey) || { timestamps: [] };
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  // 1. Check cooldown from the last request timestamp
  if (validTimestamps.length > 0) {
    const lastTimestamp = validTimestamps[validTimestamps.length - 1];
    const elapsedSinceLast = now - lastTimestamp;
    if (elapsedSinceLast < cooldownMs) {
      const secondsRemaining = Math.ceil((cooldownMs - elapsedSinceLast) / 1000);
      return {
        allowed: false,
        secondsRemaining,
        error: `Debes esperar ${secondsRemaining} segundo${secondsRemaining === 1 ? "" : "s"} antes de solicitar otro código.`,
      };
    }
  }

  // 2. Check maximum requests in window
  if (validTimestamps.length >= maxRequests) {
    const oldestTimestamp = validTimestamps[0];
    const resetTimeRemaining = Math.ceil((windowMs - (now - oldestTimestamp)) / 1000 / 60);
    return {
      allowed: false,
      secondsRemaining: Math.ceil((windowMs - (now - oldestTimestamp)) / 1000),
      error: `Has superado el límite de intentos permitidos (${maxRequests}). Por favor intenta de nuevo en ${resetTimeRemaining} minuto${resetTimeRemaining === 1 ? "" : "s"}.`,
    };
  }

  return { allowed: true };
}

/**
 * Records an actual sent PIN attempt after validations succeed and email is about to be sent.
 */
export function recordPinAttempt(key: string, windowMs: number = 15 * 60 * 1000): void {
  const now = Date.now();
  const cleanKey = `pin:${key || "anonymous"}`;
  const record = rateLimitMap.get(cleanKey) || { timestamps: [] };
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
  validTimestamps.push(now);
  rateLimitMap.set(cleanKey, { timestamps: validTimestamps });
}
