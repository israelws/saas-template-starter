import { Injectable } from '@nestjs/common';
import { PolicyEvaluatorService } from './policy-evaluator.service';
import { CacheService } from '../../../common/cache/cache.service';
import { LoggerService } from '../../../common/logger/logger.service';

interface AuthorizationRequest {
  userId: string;
  resource: string;
  action: string;
  organizationId: string;
  resourceId?: string;
  context?: Record<string, any>;
}

interface AuthorizationResult {
  decision: 'permit' | 'deny';
  reason: string;
  appliedPolicies: Array<{
    id: string;
    name: string;
    effect: 'permit' | 'deny';
    priority: number;
  }>;
  evaluationTime: number;
  fromCache: boolean;
}

interface CachedEvaluationResult {
  decision: 'permit' | 'deny';
  reason: string;
  appliedPolicies: Array<{
    id: string;
    name: string;
    effect: 'permit' | 'deny';
    priority: number;
  }>;
  evaluationTime: number;
  cachedAt: number;
  expiresAt: number;
}

@Injectable()
export class CachedPolicyEvaluatorService {
  private logger = new LoggerService('CachedPolicyEvaluator');

  // Cache TTL in seconds
  private readonly CACHE_TTL = {
    POLICY_RESULT: 300, // 5 minutes for policy evaluation results
    USER_ATTRIBUTES: 600, // 10 minutes for user attributes
    POLICIES: 1800, // 30 minutes for policies list
    ATTRIBUTE_DEFINITIONS: 3600, // 1 hour for attribute definitions
  };

  constructor(
    private readonly policyEvaluator: PolicyEvaluatorService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Evaluate authorization with caching
   */
  async evaluate(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const startTime = Date.now();

    // Generate cache key based on stable request parameters
    const cacheKey = this.generateCacheKey(request);

    try {
      // Try to get cached result
      const cachedResult = await this.cacheService.get<CachedEvaluationResult>(cacheKey);

      if (cachedResult && this.isCacheValid(cachedResult)) {
        this.logger.debug({
          message: 'Policy evaluation cache hit',
          userId: request.userId,
          resource: request.resource,
          action: request.action,
          organizationId: request.organizationId,
          cacheKey,
        });

        return {
          ...cachedResult,
          fromCache: true,
          evaluationTime: Date.now() - startTime,
        };
      }

      // Cache miss or invalid - evaluate policies
      this.logger.debug({
        message: 'Policy evaluation cache miss',
        userId: request.userId,
        resource: request.resource,
        action: request.action,
        organizationId: request.organizationId,
        cacheKey,
        hadCached: !!cachedResult,
        wasExpired: cachedResult ? !this.isCacheValid(cachedResult) : false,
      });

      // Convert AuthorizationRequest to PolicyEvaluationContext
      const policyContext = {
        subject: {
          id: request.userId,
          roles: [],
          groups: [],
          attributes: request.context?.user || {},
        },
        resource: {
          type: request.resource,
          id: request.resourceId,
          attributes: request.context?.resource || {},
        },
        action: request.action,
        environment: {
          timestamp: new Date(),
          attributes: request.context?.environment || {},
        },
        organizationId: request.organizationId,
      };

      // Perform actual policy evaluation
      const result = await this.policyEvaluator.evaluate(policyContext);
      const evaluationTime = Date.now() - startTime;

      // Prepare result for caching
      const cacheableResult: CachedEvaluationResult = {
        decision: result.allowed ? 'permit' : 'deny',
        reason: result.reasons.join('; '),
        appliedPolicies: result.matchedPolicies.map((p) => ({
          id: p.id,
          name: p.name,
          effect: p.effect === 'allow' ? 'permit' : 'deny',
          priority: p.priority,
        })),
        evaluationTime,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.CACHE_TTL.POLICY_RESULT * 1000,
      };

      // Cache the result (fire and forget)
      this.cacheService
        .set(cacheKey, cacheableResult, this.CACHE_TTL.POLICY_RESULT)
        .catch((error) => {
          this.logger.warn({
            message: 'Failed to cache policy evaluation result',
            error: error.message,
            cacheKey,
          });
        });

      return {
        ...cacheableResult,
        fromCache: false,
        evaluationTime,
      };
    } catch (error) {
      this.logger.error({
        message: 'Policy evaluation failed',
        error: error,
        ...{
          userId: request.userId,
          resource: request.resource,
          action: request.action,
          organizationId: request.organizationId,
        },
      });

      // Return a safe default
      return {
        decision: 'deny',
        reason: 'Policy evaluation error',
        appliedPolicies: [],
        evaluationTime: Date.now() - startTime,
        fromCache: false,
      };
    }
  }

  /**
   * Batch evaluate multiple authorization requests
   */
  async batchEvaluate(requests: AuthorizationRequest[]): Promise<AuthorizationResult[]> {
    const startTime = Date.now();

    // Generate cache keys for all requests
    const cacheKeys = requests.map((req) => this.generateCacheKey(req));

    // Try to get all cached results
    const cachedResults = await Promise.allSettled(
      cacheKeys.map((key) => this.cacheService.get<CachedEvaluationResult>(key)),
    );

    const results: AuthorizationResult[] = [];
    const uncachedRequests: { index: number; request: AuthorizationRequest }[] = [];

    // Process cached results and identify uncached requests
    for (let i = 0; i < requests.length; i++) {
      const cachedResult = cachedResults[i];

      if (
        cachedResult.status === 'fulfilled' &&
        cachedResult.value &&
        this.isCacheValid(cachedResult.value)
      ) {
        results[i] = {
          ...cachedResult.value,
          fromCache: true,
          evaluationTime: Date.now() - startTime,
        };
      } else {
        uncachedRequests.push({ index: i, request: requests[i] });
      }
    }

    // Evaluate uncached requests
    if (uncachedRequests.length > 0) {
      const evaluationPromises = uncachedRequests.map(async ({ index, request }) => {
        // Convert AuthorizationRequest to PolicyEvaluationContext
        const policyContext = {
          subject: {
            id: request.userId,
            roles: [],
            groups: [],
            attributes: request.context?.user || {},
          },
          resource: {
            type: request.resource,
            id: request.resourceId,
            attributes: request.context?.resource || {},
          },
          action: request.action,
          environment: {
            timestamp: new Date(),
            attributes: request.context?.environment || {},
          },
          organizationId: request.organizationId,
        };

        const result = await this.policyEvaluator.evaluate(policyContext);
        const evaluationTime = Date.now() - startTime;

        const cacheableResult: CachedEvaluationResult = {
          decision: result.allowed ? 'permit' : 'deny',
          reason: result.reasons.join('; '),
          appliedPolicies: result.matchedPolicies.map((p) => ({
            id: p.id,
            name: p.name,
            effect: p.effect === 'allow' ? 'permit' : 'deny',
            priority: p.priority,
          })),
          evaluationTime,
          cachedAt: Date.now(),
          expiresAt: Date.now() + this.CACHE_TTL.POLICY_RESULT * 1000,
        };

        // Cache the result
        const cacheKey = this.generateCacheKey(request);
        this.cacheService
          .set(cacheKey, cacheableResult, this.CACHE_TTL.POLICY_RESULT)
          .catch((error) => {
            this.logger.warn({
              message: 'Failed to cache batch policy evaluation result',
              error: error.message,
              cacheKey,
              index,
            });
          });

        return {
          index,
          result: {
            ...cacheableResult,
            fromCache: false,
            evaluationTime,
          },
        };
      });

      const evaluatedResults = await Promise.allSettled(evaluationPromises);

      // Merge evaluated results back into the results array
      evaluatedResults.forEach((settledResult) => {
        if (settledResult.status === 'fulfilled') {
          const { index, result } = settledResult.value;
          results[index] = result;
        } else {
          // Handle evaluation failure - find the corresponding index
          const failedRequest = uncachedRequests.find(
            (ur) => evaluatedResults.indexOf(settledResult) === uncachedRequests.indexOf(ur),
          );
          if (failedRequest) {
            results[failedRequest.index] = {
              decision: 'deny',
              reason: 'Policy evaluation error',
              appliedPolicies: [],
              evaluationTime: Date.now() - startTime,
              fromCache: false,
            };
          }
        }
      });
    }

    this.logger.debug({
      message: 'Batch policy evaluation completed',
      totalRequests: requests.length,
      cachedResults: results.filter((r) => r.fromCache).length,
      evaluatedResults: results.filter((r) => !r.fromCache).length,
      totalTime: Date.now() - startTime,
    });

    return results;
  }

  /**
   * Invalidate cache for specific user/organization
   */
  async invalidateUserCache(userId: string, organizationId: string): Promise<void> {
    await this.cacheService.invalidateUser(userId, organizationId);
    this.logger.log({ message: 'User policy cache invalidated', userId, organizationId });
  }

  /**
   * Invalidate cache for organization policies
   */
  async invalidateOrganizationCache(organizationId: string): Promise<void> {
    await this.cacheService.invalidatePolicies(organizationId);
    this.logger.log({ message: 'Organization policy cache invalidated', organizationId });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return this.cacheService.getStats();
  }

  /**
   * Warm up cache for a user's common operations
   */
  async warmUpUserCache(
    userId: string,
    organizationId: string,
    commonOperations: Array<{ resource: string; action: string }>,
  ): Promise<void> {
    const warmUpPromises = commonOperations.map((op) =>
      this.evaluate({
        userId,
        organizationId,
        resource: op.resource,
        action: op.action,
      }).catch((error) => {
        this.logger.warn({
          message: 'Cache warmup failed for operation',
          userId,
          organizationId,
          resource: op.resource,
          action: op.action,
          error: error.message,
        });
      }),
    );

    await Promise.allSettled(warmUpPromises);

    this.logger.log({
      message: 'User cache warmed up',
      userId,
      organizationId,
      operations: commonOperations.length,
    });
  }

  private generateCacheKey(request: AuthorizationRequest): string {
    // Create a stable cache key that includes all relevant parameters
    const keyParts = [
      'policy_eval',
      request.organizationId,
      request.userId,
      request.resource,
      request.action,
    ];

    if (request.resourceId) {
      keyParts.push(request.resourceId);
    }

    // Include context in cache key if it affects policy evaluation
    if (request.context && Object.keys(request.context).length > 0) {
      // Sort context keys for stable cache key
      const sortedContext = Object.keys(request.context)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = request.context![key];
            return acc;
          },
          {} as Record<string, any>,
        );

      keyParts.push(JSON.stringify(sortedContext));
    }

    return keyParts.join(':');
  }

  private isCacheValid(cachedResult: CachedEvaluationResult): boolean {
    return Date.now() < cachedResult.expiresAt;
  }
}
