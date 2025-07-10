import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  private logger = new LoggerService('CacheService');

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug({ message: 'Cache hit', key });
      } else {
        this.logger.debug({ message: 'Cache miss', key });
      }
      return value;
    } catch (error) {
      this.logger.error({ message: 'Cache get error', error: error.message, key });
      return undefined;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug({ message: 'Cache set', key, ttl });
    } catch (error) {
      this.logger.error({ message: 'Cache set error', error: error.message, key, ttl });
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug({ message: 'Cache delete', key });
    } catch (error) {
      this.logger.error({ message: 'Cache delete error', error: error.message, key });
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Note: This requires a Redis store that supports key scanning
      const store = (this.cacheManager as any).store || (this.cacheManager as any).stores?.[0];
      if (store.client && store.client.keys) {
        const keys = await store.client.keys(pattern);
        if (keys.length > 0) {
          await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
          this.logger.debug({ message: 'Cache pattern delete', pattern, deletedKeys: keys.length });
        }
      }
    } catch (error) {
      this.logger.error({ message: 'Cache pattern delete error', error: error.message, pattern });
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.debug('Cache reset');
    } catch (error) {
      this.logger.error({ message: 'Cache reset error', error: error.message });
    }
  }

  /**
   * Get or set a value in cache with a function to compute the value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      let value = await this.get<T>(key);
      
      if (value === undefined) {
        value = await factory();
        await this.set(key, value, ttl);
        this.logger.debug({ message: 'Cache factory execution', key });
      }
      
      return value;
    } catch (error) {
      this.logger.error({ message: 'Cache getOrSet error', error: error.message, key });
      // Fallback to factory function if cache fails
      return factory();
    }
  }

  /**
   * Wrap a function with caching
   */
  wrap<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    return this.getOrSet(key, factory, ttl);
  }

  /**
   * Generate cache key for policy evaluation
   */
  generatePolicyKey(
    userId: string,
    resource: string,
    action: string,
    organizationId: string,
  ): string {
    return `policy:${organizationId}:${userId}:${resource}:${action}`;
  }

  /**
   * Generate cache key for user attributes
   */
  generateUserAttributesKey(userId: string, organizationId: string): string {
    return `user_attrs:${organizationId}:${userId}`;
  }

  /**
   * Generate cache key for organization hierarchy
   */
  generateOrgHierarchyKey(organizationId: string): string {
    return `org_hierarchy:${organizationId}`;
  }

  /**
   * Generate cache key for policies
   */
  generatePoliciesKey(organizationId: string): string {
    return `policies:${organizationId}`;
  }

  /**
   * Generate cache key for attribute definitions
   */
  generateAttributeDefinitionsKey(organizationId: string): string {
    return `attr_defs:${organizationId}`;
  }

  /**
   * Invalidate all cache keys related to an organization
   */
  async invalidateOrganization(organizationId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`policy:${organizationId}:*`),
      this.delPattern(`user_attrs:${organizationId}:*`),
      this.del(this.generateOrgHierarchyKey(organizationId)),
      this.del(this.generatePoliciesKey(organizationId)),
      this.del(this.generateAttributeDefinitionsKey(organizationId)),
    ]);
    
    this.logger.log({ message: 'Organization cache invalidated', organizationId });
  }

  /**
   * Invalidate all cache keys related to a user
   */
  async invalidateUser(userId: string, organizationId?: string): Promise<void> {
    if (organizationId) {
      await Promise.all([
        this.delPattern(`policy:${organizationId}:${userId}:*`),
        this.del(this.generateUserAttributesKey(userId, organizationId)),
      ]);
    } else {
      // Invalidate across all organizations
      await this.delPattern(`policy:*:${userId}:*`);
      await this.delPattern(`user_attrs:*:${userId}`);
    }
    
    this.logger.log({ message: 'User cache invalidated', userId, organizationId });
  }

  /**
   * Invalidate policy-related cache
   */
  async invalidatePolicies(organizationId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`policy:${organizationId}:*`),
      this.del(this.generatePoliciesKey(organizationId)),
    ]);
    
    this.logger.log({ message: 'Policy cache invalidated', organizationId });
  }

  /**
   * Get cache statistics (if supported by the store)
   */
  async getStats(): Promise<any> {
    try {
      const store = (this.cacheManager as any).store || (this.cacheManager as any).stores?.[0];
      if (store.client && store.client.info) {
        const info = await store.client.info('memory');
        return {
          type: 'redis',
          memory: this.parseRedisInfo(info),
        };
      }
      return { type: 'unknown' };
    } catch (error) {
      this.logger.error({ message: 'Cache stats error', error: error.message });
      return { type: 'error', error: error.message };
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const stats: Record<string, any> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return stats;
  }
}