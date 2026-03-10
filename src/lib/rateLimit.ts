type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function getEnvInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const ipTimestamps = new Map<string, number[]>();

export function checkRateLimit(ip: string): RateLimitResult {
  const max      = getEnvInt('RATE_LIMIT_MAX', 5);
  const windowS  = getEnvInt('RATE_LIMIT_WINDOW_S', 3600);

  const nowS = Math.floor(Date.now() / 1000);
  const windowStart = nowS - windowS;

  const existing = ipTimestamps.get(ip) ?? [];
  const inWindow = existing.filter(ts => ts > windowStart);

  if (inWindow.length >= max) {
    const oldest = Math.min(...inWindow);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(oldest + windowS - nowS, 1),
    };
  }

  inWindow.push(nowS);
  ipTimestamps.set(ip, inWindow);

  // Cleanup IPs with no timestamps in the current window
  for (const [storedIp, timestamps] of ipTimestamps) {
    if (timestamps.every(ts => ts <= windowStart)) ipTimestamps.delete(storedIp);
  }

  return { allowed: true };
}

export function extractIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
