const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}
