export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelay = options.baseDelayMs ?? 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const expBackoff = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, expBackoff + jitter));
    }
  }

  throw new Error("withRetry: unreachable");
}
