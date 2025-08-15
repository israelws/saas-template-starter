import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger } from './winston.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logger: any;

  constructor(context?: string) {
    this.context = context || 'Application';
    this.logger = createLogger(this.context);
  }

  setContext(context: string) {
    this.context = context;
    this.logger = createLogger(context);
  }

  log(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      this.logger.info({ ...message, context: ctx });
    } else {
      this.logger.info(message, { context: ctx });
    }
  }

  error(message: any, trace?: string, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      this.logger.error({ ...message, trace, context: ctx });
    } else {
      this.logger.error({ message: message, trace, context: ctx });
    }
  }

  warn(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      this.logger.warn({ ...message, context: ctx });
    } else {
      this.logger.warn({ message: message, context: ctx });
    }
  }

  debug(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      this.logger.debug({ ...message, context: ctx });
    } else {
      this.logger.debug({ message: message, context: ctx });
    }
  }

  verbose(message: any, context?: string) {
    const ctx = context || this.context;
    if (typeof message === 'object') {
      this.logger.verbose({ ...message, context: ctx });
    } else {
      this.logger.verbose({ message: message, context: ctx });
    }
  }

  // Additional utility methods

  /**
   * Log HTTP request details
   */
  logHttpRequest(request: {
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
    userId?: string;
    duration?: number;
    statusCode?: number;
  }) {
    this.logger.http('HTTP Request', {
      ...request,
      context: 'HTTP',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log database query
   */
  logQuery(query: { sql: string; parameters?: any[]; duration?: number; error?: any }) {
    const level = query.error ? 'error' : 'debug';
    this.logger[level]('Database Query', {
      ...query,
      context: 'Database',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log authentication event
   */
  logAuth(event: {
    type: 'login' | 'logout' | 'register' | 'token_refresh' | 'failed_login';
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    reason?: string;
  }) {
    const level = event.type === 'failed_login' ? 'warn' : 'info';
    this.logger[level]('Authentication Event', {
      ...event,
      context: 'Auth',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log policy evaluation
   */
  logPolicyEvaluation(evaluation: {
    policyId?: string;
    policyName?: string;
    userId: string;
    resource: string;
    action: string;
    result: 'allow' | 'deny';
    duration?: number;
    conditions?: any;
  }) {
    this.logger.debug({
      message: 'Policy Evaluation',
      ...evaluation,
      context: 'ABAC',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(event: {
    type: string;
    entityType: string;
    entityId: string;
    userId?: string;
    organizationId?: string;
    metadata?: any;
  }) {
    this.logger.info('Business Event', {
      ...event,
      context: 'Business',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create a child logger with additional metadata
   */
  child(metadata: Record<string, any>) {
    const childLogger = new LoggerService(this.context);
    childLogger.logger = this.logger.child(metadata);
    return childLogger;
  }
}
