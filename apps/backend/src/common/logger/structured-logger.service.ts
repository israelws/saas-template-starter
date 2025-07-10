import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  module?: string;
  action?: string;
  resource?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
          });
        })
      ),
      defaultMeta: {
        service: 'saas-template-backend',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      },
      transports: this.createTransports()
    });
  }

  private createTransports() {
    const transportList = [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      }),
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }),
      new transports.File({
        filename: 'logs/combined.log',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10
      })
    ];

    // Add Elasticsearch transport for production
    if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
      transportList.push(
        new (ElasticsearchTransport as any)({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL,
            auth: {
              username: process.env.ELASTICSEARCH_USERNAME,
              password: process.env.ELASTICSEARCH_PASSWORD
            }
          },
          index: 'saas-template-logs',
          indexTemplate: {
            name: 'saas-template-logs-template',
            pattern: 'saas-template-logs-*',
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1
            },
            mappings: {
              properties: {
                timestamp: { type: 'date' },
                level: { type: 'keyword' },
                message: { type: 'text' },
                service: { type: 'keyword' },
                environment: { type: 'keyword' },
                version: { type: 'keyword' },
                requestId: { type: 'keyword' },
                userId: { type: 'keyword' },
                organizationId: { type: 'keyword' },
                module: { type: 'keyword' },
                action: { type: 'keyword' },
                resource: { type: 'keyword' },
                duration: { type: 'long' },
                error: {
                  type: 'object',
                  properties: {
                    name: { type: 'keyword' },
                    message: { type: 'text' },
                    stack: { type: 'text' }
                  }
                }
              }
            }
          }
        })
      );
    }

    return transportList;
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.logger.error(message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
  }

  /**
   * Log authentication events
   */
  logAuth(action: string, userId: string, success: boolean, context?: Partial<LogContext>) {
    this.log(`Authentication ${action}`, {
      ...context,
      module: 'auth',
      action,
      userId,
      metadata: { success }
    });
  }

  /**
   * Log ABAC policy evaluation
   */
  logPolicyEvaluation(
    decision: 'allow' | 'deny',
    userId: string,
    organizationId: string,
    resource: string,
    action: string,
    duration: number,
    context?: Partial<LogContext>
  ) {
    this.log(`Policy evaluation: ${decision}`, {
      ...context,
      module: 'abac',
      action: 'evaluate',
      userId,
      organizationId,
      resource,
      duration,
      metadata: { decision, policyAction: action }
    });
  }

  /**
   * Log organization operations
   */
  logOrganizationOperation(
    action: string,
    organizationId: string,
    userId: string,
    context?: Partial<LogContext>
  ) {
    this.log(`Organization ${action}`, {
      ...context,
      module: 'organizations',
      action,
      organizationId,
      userId
    });
  }

  /**
   * Log user operations
   */
  logUserOperation(
    action: string,
    targetUserId: string,
    operatorUserId: string,
    organizationId: string,
    context?: Partial<LogContext>
  ) {
    this.log(`User ${action}`, {
      ...context,
      module: 'users',
      action,
      userId: operatorUserId,
      organizationId,
      metadata: { targetUserId }
    });
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context?: Partial<LogContext>
  ) {
    this.log(`Database ${operation} on ${table}`, {
      ...context,
      module: 'database',
      action: operation,
      resource: table,
      duration,
      metadata: { success }
    });
  }

  /**
   * Log cache operations
   */
  logCacheOperation(
    operation: 'get' | 'set' | 'delete',
    key: string,
    hit: boolean,
    duration: number,
    context?: Partial<LogContext>
  ) {
    this.debug(`Cache ${operation} for key ${key}`, {
      ...context,
      module: 'cache',
      action: operation,
      resource: key,
      duration,
      metadata: { hit }
    });
  }

  /**
   * Log WebSocket events
   */
  logWebSocketEvent(
    event: string,
    userId: string,
    organizationId: string,
    context?: Partial<LogContext>
  ) {
    this.log(`WebSocket ${event}`, {
      ...context,
      module: 'websocket',
      action: event,
      userId,
      organizationId
    });
  }

  /**
   * Log performance issues
   */
  logPerformanceIssue(
    operation: string,
    duration: number,
    threshold: number,
    context?: Partial<LogContext>
  ) {
    this.warn(`Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
      ...context,
      module: 'performance',
      action: operation,
      duration,
      metadata: { threshold, exceeded: duration > threshold }
    });
  }

  /**
   * Log business events
   */
  logBusinessEvent(
    event: string,
    organizationId: string,
    userId: string,
    metadata: Record<string, any>,
    context?: Partial<LogContext>
  ) {
    this.log(`Business event: ${event}`, {
      ...context,
      module: 'business',
      action: event,
      organizationId,
      userId,
      metadata
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId?: string,
    organizationId?: string,
    context?: Partial<LogContext>
  ) {
    const message = `Security event: ${event}`;
    const logContext = {
      ...context,
      module: 'security',
      action: event,
      userId,
      organizationId,
      metadata: { severity }
    };
    
    if (severity === 'critical' || severity === 'high') {
      this.error(message, undefined, logContext);
    } else if (severity === 'medium') {
      this.warn(message, logContext);
    } else {
      this.log(message, logContext);
    }
  }
}