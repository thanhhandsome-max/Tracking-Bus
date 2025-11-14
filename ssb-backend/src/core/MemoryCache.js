import LRU from "lru-cache";

/**
 * MemoryCache - LRU cache implementation using lru-cache
 */
export class MemoryCache {
  constructor(maxSize = 500, ttlMs = 3600000) {
    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttlMs,
      updateAgeOnGet: true,
    });
  }

  async get(key) {
    try {
      const value = this.cache.get(key);
      return value || null;
    } catch (error) {
      console.error("MemoryCache get error:", error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = undefined) {
    try {
      const ttl = ttlSeconds ? ttlSeconds * 1000 : undefined;
      this.cache.set(key, value, { ttl });
      return true;
    } catch (error) {
      console.error("MemoryCache set error:", error);
      return false;
    }
  }

  async delete(key) {
    try {
      return this.cache.delete(key);
    } catch (error) {
      console.error("MemoryCache delete error:", error);
      return false;
    }
  }

  async clear() {
    try {
      this.cache.clear();
      return true;
    } catch (error) {
      console.error("MemoryCache clear error:", error);
      return false;
    }
  }
}

