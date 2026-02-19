// bertui/src/utils/cache.js - ULTRA FAST CACHING (Microsecond precision)
import { createHash } from 'crypto';
import logger from '../logger/logger.js';

export class BertuiCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 5000;
    this.ttl = options.ttl || 30000; // 30 seconds default
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
    
    // Main cache store
    this.store = new Map();
    
    // File content cache with timestamps
    this.fileCache = new Map();
    this.fileTimestamps = new Map();
    
    // Compiled code cache (keyed by content hash)
    this.codeCache = new Map();
    
    // CSS processing cache
    this.cssCache = new Map();
    
    // Image optimization cache
    this.imageCache = new Map();
    
    // Weak reference cache for DOM objects (if in browser)
    if (typeof WeakRef !== 'undefined') {
      this.weakCache = new Map();
    }
    
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  // ULTRA FAST GET with microsecond timing
  get(key, options = {}) {
    const start = process.hrtime.bigint();
    
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL
    const ttl = options.ttl || item.ttl || this.ttl;
    if (Date.now() - item.timestamp > ttl) {
      this.store.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }
    
    this.stats.hits++;
    
    // Update access time for LRU
    item.lastAccessed = Date.now();
    
    if (options.logSpeed) {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000; // Microseconds
      logger.debug(`⚡ Cache hit: ${duration.toFixed(3)}µs for ${key.substring(0, 30)}...`);
    }
    
    return item.value;
  }

  set(key, value, options = {}) {
    // Generate hash for large values to save memory
    const valueHash = typeof value === 'string' && value.length > 10000
      ? createHash('md5').update(value).digest('hex')
      : null;
    
    this.store.set(key, {
      value: valueHash ? { __hash: valueHash, __original: null } : value,
      valueHash,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      ttl: options.ttl || this.ttl,
      size: this.getSize(value)
    });
    
    this.stats.sets++;
    
    // Store original separately if hashed
    if (valueHash) {
      this.codeCache.set(valueHash, value);
    }
    
    // LRU cleanup if needed
    if (this.store.size > this.maxSize) {
      this.evictLRU();
    }
  }

  // FILE CACHE: Zero-copy file reading with mtime validation
  async getFile(filePath, options = {}) {
    const cacheKey = `file:${filePath}`;
    
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      if (!exists) return null;
      
      const stats = await file.stat();
      const mtimeMs = stats.mtimeMs;
      
      // Check cache
      const cached = this.fileCache.get(cacheKey);
      const cachedTime = this.fileTimestamps.get(cacheKey);
      
      if (cached && cachedTime === mtimeMs) {
        if (options.logSpeed) {
          logger.debug(`📄 File cache hit: ${filePath.split('/').pop()}`);
        }
        return cached;
      }
      
      // Read file (single operation)
      const start = process.hrtime.bigint();
      const content = await file.arrayBuffer();
      const buffer = Buffer.from(content);
      const end = process.hrtime.bigint();
      
      // Store in cache
      this.fileCache.set(cacheKey, buffer);
      this.fileTimestamps.set(cacheKey, mtimeMs);
      
      if (options.logSpeed) {
        const duration = Number(end - start) / 1000;
        logger.debug(`📄 File read: ${duration.toFixed(3)}µs - ${filePath.split('/').pop()}`);
      }
      
      return buffer;
      
    } catch (error) {
      logger.error(`File cache error: ${filePath} - ${error.message}`);
      return null;
    }
  }

  // CODE TRANSFORMATION CACHE
  getTransformed(sourceCode, options = {}) {
    const hash = createHash('md5')
      .update(sourceCode)
      .update(JSON.stringify(options))
      .digest('hex');
    
    const cacheKey = `transform:${hash}`;
    return this.get(cacheKey, options);
  }

  setTransformed(sourceCode, result, options = {}) {
    const hash = createHash('md5')
      .update(sourceCode)
      .update(JSON.stringify(options))
      .digest('hex');
    
    const cacheKey = `transform:${hash}`;
    this.set(cacheKey, result, options);
  }

  // CSS PROCESSING CACHE
  getCSS(css, options = {}) {
    const hash = createHash('md5')
      .update(css)
      .update(JSON.stringify(options))
      .digest('hex');
    
    return this.cssCache.get(hash);
  }

  setCSS(css, result, options = {}) {
    const hash = createHash('md5')
      .update(css)
      .update(JSON.stringify(options))
      .digest('hex');
    
    this.cssCache.set(hash, result);
  }

  // BATCH OPERATIONS
  mget(keys) {
    const results = [];
    for (const key of keys) {
      results.push(this.get(key));
    }
    return results;
  }

  mset(entries) {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  // STATS with microsecond precision
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    // Memory usage
    const memUsage = process.memoryUsage();
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      evictions: this.stats.evictions,
      hitRate: `${hitRate}%`,
      size: this.store.size,
      fileCacheSize: this.fileCache.size,
      codeCacheSize: this.codeCache.size,
      cssCacheSize: this.cssCache.size,
      imageCacheSize: this.imageCache.size,
      memory: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      }
    };
  }

  // PRIVATE METHODS
  getSize(value) {
    if (typeof value === 'string') return value.length;
    if (Buffer.isBuffer(value)) return value.length;
    if (typeof value === 'object') return JSON.stringify(value).length;
    return 0;
  }

  evictLRU() {
    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const removeCount = Math.floor(this.maxSize * 0.2); // Remove 20%
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  cleanup() {
    const now = Date.now();
    let evicted = 0;
    
    for (const [key, item] of this.store.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.store.delete(key);
        evicted++;
      }
    }
    
    if (evicted > 0) {
      logger.debug(`🧹 Cache cleanup: removed ${evicted} expired items`);
      this.stats.evictions += evicted;
    }
  }

  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
    this.fileCache.clear();
    this.fileTimestamps.clear();
    this.codeCache.clear();
    this.cssCache.clear();
    this.imageCache.clear();
  }
}

// Singleton instance
export const globalCache = new BertuiCache();

// Decorator for automatic caching of async functions
export function cached(options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      const cached = globalCache.get(cacheKey, options);
      
      if (cached !== null) {
        return cached;
      }
      
      const result = await originalMethod.apply(this, args);
      globalCache.set(cacheKey, result, options);
      return result;
    };
    
    return descriptor;
  };
}