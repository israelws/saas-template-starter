import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'organization_id'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in milliseconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 5, 15, 50, 100, 500, 1000, 2000, 5000],
  });

  private readonly policyEvaluationDuration = new Histogram({
    name: 'policy_evaluation_duration_ms',
    help: 'Duration of policy evaluation in milliseconds',
    labelNames: ['organization_id', 'decision'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500],
  });

  private readonly policyEvaluationsTotal = new Counter({
    name: 'policy_evaluations_total',
    help: 'Total number of policy evaluations',
    labelNames: ['organization_id', 'decision', 'resource_type'],
  });

  private readonly databaseConnectionsActive = new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
  });

  private readonly redisConnectionsActive = new Gauge({
    name: 'redis_connections_active',
    help: 'Number of active Redis connections',
  });

  private readonly websocketConnectionsActive = new Gauge({
    name: 'websocket_connections_active',
    help: 'Number of active WebSocket connections',
    labelNames: ['organization_id'],
  });

  private readonly cacheHitRate = new Counter({
    name: 'cache_operations_total',
    help: 'Total cache operations',
    labelNames: ['operation', 'result'], // operation: get/set, result: hit/miss
  });

  private readonly organizationOperations = new Counter({
    name: 'organization_operations_total',
    help: 'Total organization operations',
    labelNames: ['operation', 'organization_type'],
  });

  private readonly userOperations = new Counter({
    name: 'user_operations_total',
    help: 'Total user operations',
    labelNames: ['operation', 'organization_id'],
  });

  private readonly errorRate = new Counter({
    name: 'application_errors_total',
    help: 'Total application errors',
    labelNames: ['error_type', 'module', 'severity'],
  });

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    organizationId?: string,
  ) {
    const labels = { method, route, status_code: statusCode.toString() };
    const labelsWithOrg = { ...labels, organization_id: organizationId || 'unknown' };

    this.httpRequestsTotal.inc(labelsWithOrg);
    this.httpRequestDuration.observe(labels, duration);
  }

  /**
   * Record policy evaluation metrics
   */
  recordPolicyEvaluation(
    organizationId: string,
    decision: 'allow' | 'deny',
    resourceType: string,
    duration: number,
  ) {
    this.policyEvaluationDuration.observe({ organization_id: organizationId, decision }, duration);

    this.policyEvaluationsTotal.inc({
      organization_id: organizationId,
      decision,
      resource_type: resourceType,
    });
  }

  /**
   * Record database connection metrics
   */
  setDatabaseConnections(count: number) {
    this.databaseConnectionsActive.set(count);
  }

  /**
   * Record Redis connection metrics
   */
  setRedisConnections(count: number) {
    this.redisConnectionsActive.set(count);
  }

  /**
   * Record WebSocket connection metrics
   */
  incrementWebSocketConnections(organizationId: string) {
    this.websocketConnectionsActive.inc({ organization_id: organizationId });
  }

  decrementWebSocketConnections(organizationId: string) {
    this.websocketConnectionsActive.dec({ organization_id: organizationId });
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation: 'get' | 'set', result: 'hit' | 'miss') {
    this.cacheHitRate.inc({ operation, result });
  }

  /**
   * Record organization operation metrics
   */
  recordOrganizationOperation(operation: string, organizationType: string) {
    this.organizationOperations.inc({ operation, organization_type: organizationType });
  }

  /**
   * Record user operation metrics
   */
  recordUserOperation(operation: string, organizationId: string) {
    this.userOperations.inc({ operation, organization_id: organizationId });
  }

  /**
   * Record application error metrics
   */
  recordError(errorType: string, module: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.errorRate.inc({ error_type: errorType, module, severity });
  }

  /**
   * Get all metrics for Prometheus scraping
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics() {
    register.clear();
  }

  /**
   * Get registry for custom metrics
   */
  getRegistry() {
    return register;
  }
}
