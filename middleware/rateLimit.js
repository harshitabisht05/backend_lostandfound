// Simple in-memory rate limiter for per-user keys. Not durable; for prod use Redis.
const stores = new Map();

// options: windowMs, max (calls allowed per window)
export function rateLimit(keyFn, { windowMs = 60 * 1000, max = 1 } = {}) {
  return (req, res, next) => {
    try {
      const key = keyFn(req);
      if (!key) return res.status(400).json({ ok: false, error: "Rate limiter missing key" });

      const now = Date.now();
      const entry = stores.get(key) || { count: 0, resetAt: now + windowMs };
      if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + windowMs;
      }

      if (entry.count >= max) {
        const wait = Math.ceil((entry.resetAt - now) / 1000);
        return res.status(429).json({ ok: false, error: `Rate limit exceeded. Try again in ${wait}s` });
      }

      entry.count += 1;
      stores.set(key, entry);
      return next();
    } catch (err) {
      return res.status(500).json({ ok: false, error: "Rate limiter error" });
    }
  };
}
