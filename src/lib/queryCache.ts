import { createHash } from 'crypto';
import type { UserAnswers, AnalysisResult } from '@/lib/types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix ms
}

class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlMs: number, maxSize: number) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

function getEnvInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const analysisCache = new TtlCache<AnalysisResult>(
  getEnvInt('CACHE_TTL_HOURS', 24) * 60 * 60 * 1000,
  getEnvInt('CACHE_MAX_ENTRIES', 500)
);

export function buildCacheKey(answers: UserAnswers): string {
  const normalized = [answers.role, answers.want, answers.fear]
    .map(s => s.trim().toLowerCase())
    .join('|');
  return createHash('sha256').update(normalized).digest('hex');
}
