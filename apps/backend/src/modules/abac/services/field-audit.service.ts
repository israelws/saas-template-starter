import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { tap } from 'rxjs/operators';

/**
 * Field access log entry for audit trail
 * @interface FieldAccessLog
 */
export interface FieldAccessLog {
  /** ID of the user accessing fields */
  userId: string;
  /** Organization context for the access */
  organizationId: string;
  /** Type of resource being accessed (e.g., 'Customer', 'Product') */
  resourceType: string;
  /** Optional ID of the specific resource instance */
  resourceId?: string;
  /** Type of access operation */
  action: 'read' | 'write';
  /** List of fields that were accessed */
  fields: string[];
  /** Fields that were denied access */
  deniedFields?: string[];
  /** Sensitive fields that were accessed (subset of fields) */
  sensitiveFieldsAccessed?: string[];
  /** Timestamp of the access */
  timestamp: Date;
  /** Client IP address */
  ipAddress?: string;
  /** Client user agent string */
  userAgent?: string;
  /** Unique request identifier for correlation */
  requestId?: string;
}

/**
 * Mapping of resource types to their sensitive fields
 * Used for automatic detection and enhanced audit logging
 * @constant {Record<string, string[]>}
 */
const SENSITIVE_FIELDS: Record<string, string[]> = {
  Customer: ['ssn', 'dateOfBirth', 'medicalHistory', 'creditScore', 'income', 'bankAccount'],
  User: ['password', 'passwordHash', 'securityQuestions', 'mfaSecret'],
  InsurancePolicy: ['profitMargin', 'internalNotes', 'commissionStructure'],
  Transaction: ['bankDetails', 'routingNumber', 'accountNumber'],
  Employee: ['salary', 'performanceRating', 'disciplinaryRecords'],
};

/**
 * Service for auditing field-level access and security monitoring
 * Tracks access to sensitive fields and unauthorized access attempts
 *
 * @class FieldAuditService
 * @injectable
 */
@Injectable()
export class FieldAuditService {
  private readonly logger = new Logger(FieldAuditService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    // In production, you'd inject a repository for audit logs
    // @InjectRepository(FieldAuditLog)
    // private auditLogRepository: Repository<FieldAuditLog>,
  ) {}

  /**
   * Log field access for audit purposes
   * Automatically detects and flags sensitive field access
   *
   * @async
   * @param {FieldAccessLog} log - The field access log entry
   * @returns {Promise<void>}
   *
   * @emits field.access - When any field is accessed
   * @emits field.access.sensitive - When sensitive fields are accessed
   */
  async logFieldAccess(log: FieldAccessLog): Promise<void> {
    // Identify sensitive fields that were accessed
    const sensitiveFields = this.identifySensitiveFields(log.resourceType, log.fields);

    if (sensitiveFields.length > 0) {
      log.sensitiveFieldsAccessed = sensitiveFields;
      this.logger.warn(
        `Sensitive field access: User ${log.userId} accessed ${sensitiveFields.join(', ')} on ${log.resourceType}`,
      );
    }

    // Emit event for real-time monitoring
    this.eventEmitter.emit('field.access', log);

    // In production, save to database
    // await this.auditLogRepository.save(log);

    // For now, just log
    this.logger.log(`Field access: ${log.action} on ${log.resourceType} by user ${log.userId}`, {
      fields: log.fields.length,
      denied: log.deniedFields?.length || 0,
      sensitive: sensitiveFields.length,
    });
  }

  /**
   * Log when fields are denied access
   * Used for security monitoring and compliance reporting
   *
   * @async
   * @param {string} userId - ID of the user who was denied access
   * @param {string} organizationId - Organization context
   * @param {string} resourceType - Type of resource
   * @param {string[]} deniedFields - Fields that were denied
   * @param {any} [context] - Additional context information
   * @returns {Promise<void>}
   *
   * @emits field.access.denied - When field access is denied
   */
  async logFieldDenial(
    userId: string,
    organizationId: string,
    resourceType: string,
    deniedFields: string[],
    context?: any,
  ): Promise<void> {
    const log: FieldAccessLog = {
      userId,
      organizationId,
      resourceType,
      action: 'read',
      fields: [],
      deniedFields,
      timestamp: new Date(),
      ...context,
    };

    this.logger.warn(
      `Field access denied: User ${userId} attempted to access ${deniedFields.join(', ')} on ${resourceType}`,
    );

    // Emit event for security monitoring
    this.eventEmitter.emit('field.access.denied', log);

    // In production, save to database
    // await this.auditLogRepository.save(log);
  }

  /**
   * Get field access statistics for a user
   * Provides aggregated metrics for security monitoring and compliance
   *
   * @async
   * @param {string} userId - User ID to get statistics for
   * @param {string} organizationId - Organization context
   * @param {Object} [dateRange] - Optional date range filter
   * @param {Date} dateRange.start - Start date
   * @param {Date} dateRange.end - End date
   * @returns {Promise<Object>} Access statistics
   * @returns {number} returns.totalAccess - Total field accesses
   * @returns {number} returns.sensitiveAccess - Sensitive field accesses
   * @returns {number} returns.deniedAttempts - Denied access attempts
   * @returns {Record<string, number>} returns.byResourceType - Access count by resource type
   */
  async getFieldAccessStats(
    userId: string,
    organizationId: string,
    dateRange?: { start: Date; end: Date },
  ): Promise<{
    totalAccess: number;
    sensitiveAccess: number;
    deniedAttempts: number;
    byResourceType: Record<string, number>;
  }> {
    // In production, query from database
    // const stats = await this.auditLogRepository
    //   .createQueryBuilder('log')
    //   .where('log.userId = :userId', { userId })
    //   .andWhere('log.organizationId = :organizationId', { organizationId })
    //   .andWhere('log.timestamp BETWEEN :start AND :end', dateRange)
    //   .select([
    //     'COUNT(*) as totalAccess',
    //     'COUNT(CASE WHEN sensitiveFieldsAccessed IS NOT NULL THEN 1 END) as sensitiveAccess',
    //     'COUNT(CASE WHEN deniedFields IS NOT NULL THEN 1 END) as deniedAttempts',
    //   ])
    //   .getRawOne();

    // Mock implementation
    return {
      totalAccess: 0,
      sensitiveAccess: 0,
      deniedAttempts: 0,
      byResourceType: {},
    };
  }

  /**
   * Identify sensitive fields in the accessed field list
   * Checks both resource-specific and global sensitive field patterns
   *
   * @private
   * @param {string} resourceType - Type of resource
   * @param {string[]} fields - Fields to check
   * @returns {string[]} Array of sensitive fields found
   */
  private identifySensitiveFields(resourceType: string, fields: string[]): string[] {
    const sensitiveFieldsForType = SENSITIVE_FIELDS[resourceType] || [];
    const globalSensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount', 'medicalRecord'];

    const allSensitiveFields = [...sensitiveFieldsForType, ...globalSensitiveFields];

    return fields.filter((field) =>
      allSensitiveFields.some((sensitive) => field.toLowerCase().includes(sensitive.toLowerCase())),
    );
  }

  /**
   * Enhanced field access interceptor with audit logging
   * Creates an interceptor that logs all field access operations
   *
   * @returns {Object} NestJS interceptor object
   *
   * @example
   * ```typescript
   * providers: [
   *   {
   *     provide: APP_INTERCEPTOR,
   *     useFactory: (auditService: FieldAuditService) =>
   *       auditService.createAuditingInterceptor(),
   *     inject: [FieldAuditService],
   *   },
   * ]
   * ```
   */
  createAuditingInterceptor() {
    return {
      intercept: (context: any, next: any) => {
        const request = context.switchToHttp().getRequest();
        const startTime = Date.now();

        return next.handle().pipe(
          tap({
            next: (data: any) => {
              const duration = Date.now() - startTime;

              // Log successful field access
              if (request.fieldAccessLog) {
                this.logFieldAccess({
                  ...request.fieldAccessLog,
                  duration,
                  success: true,
                });
              }
            },
            error: (error: any) => {
              // Log failed field access attempts
              if (request.fieldAccessLog) {
                this.logFieldAccess({
                  ...request.fieldAccessLog,
                  success: false,
                  error: error.message,
                });
              }
            },
          }),
        );
      },
    };
  }
}

/**
 * Decorator to mark fields as sensitive for audit logging
 * Applied to entity properties to trigger enhanced audit logging
 *
 * @decorator
 * @param {string} [fieldName] - Optional custom field name (defaults to property name)
 * @returns {PropertyDecorator}
 *
 * @example
 * ```typescript
 * class Customer {
 *   @SensitiveField()
 *   ssn: string;
 *
 *   @SensitiveField('credit_score')
 *   creditScore: number;
 * }
 * ```
 */
export function SensitiveField(fieldName?: string) {
  return (target: any, propertyKey: string) => {
    const fields = Reflect.getMetadata('sensitive_fields', target) || [];
    fields.push(fieldName || propertyKey);
    Reflect.defineMetadata('sensitive_fields', fields, target);
  };
}

/**
 * Event listeners for field access monitoring
 * Handles real-time monitoring and alerting for field access events
 *
 * @class FieldAccessMonitor
 * @injectable
 */
@Injectable()
export class FieldAccessMonitor {
  private readonly logger = new Logger(FieldAccessMonitor.name);

  constructor(private eventEmitter: EventEmitter2) {
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for field access monitoring
   * @private
   */
  private setupEventListeners() {
    // Listen for field access events
    this.eventEmitter.on('field.access', (log: FieldAccessLog) => {
      if (log.sensitiveFieldsAccessed && log.sensitiveFieldsAccessed.length > 0) {
        this.handleSensitiveFieldAccess(log);
      }
    });

    // Listen for denied access attempts
    this.eventEmitter.on('field.access.denied', (log: FieldAccessLog) => {
      this.handleDeniedAccess(log);
    });
  }

  /**
   * Handles sensitive field access events
   * Triggers security alerts and monitoring workflows
   *
   * @private
   * @async
   * @param {FieldAccessLog} log - The field access log entry
   * @returns {Promise<void>}
   */
  private async handleSensitiveFieldAccess(log: FieldAccessLog) {
    // Alert security team for sensitive field access
    this.logger.warn('SECURITY ALERT: Sensitive field access detected', {
      userId: log.userId,
      fields: log.sensitiveFieldsAccessed,
      resourceType: log.resourceType,
      timestamp: log.timestamp,
    });

    // In production, could send alerts, trigger workflows, etc.
    // await this.alertService.sendSecurityAlert({
    //   type: 'SENSITIVE_FIELD_ACCESS',
    //   severity: 'HIGH',
    //   details: log,
    // });
  }

  /**
   * Handles denied field access events
   * Tracks unauthorized access attempts for security monitoring
   *
   * @private
   * @async
   * @param {FieldAccessLog} log - The field access log entry
   * @returns {Promise<void>}
   */
  private async handleDeniedAccess(log: FieldAccessLog) {
    // Track denied access attempts for security monitoring
    this.logger.warn('ACCESS DENIED: Unauthorized field access attempt', {
      userId: log.userId,
      deniedFields: log.deniedFields,
      resourceType: log.resourceType,
    });

    // Could implement rate limiting, account lockout, etc.
  }
}

/**
 * Get the list of sensitive fields for a specific resource type
 *
 * @function getSensitiveFields
 * @param {string} resourceType - The resource type to get sensitive fields for
 * @returns {string[]} Array of sensitive field names
 *
 * @example
 * ```typescript
 * const sensitiveFields = getSensitiveFields('Customer');
 * // Returns: ['ssn', 'dateOfBirth', 'medicalHistory', ...]
 * ```
 */
export function getSensitiveFields(resourceType: string): string[] {
  return SENSITIVE_FIELDS[resourceType] || [];
}

/**
 * Configuration for field audit and monitoring system
 * @constant {Object} FIELD_AUDIT_CONFIG
 * @property {string[]} enabledForResources - Resource types with audit enabled
 * @property {boolean} logSensitiveAccess - Whether to log sensitive field access
 * @property {boolean} logDeniedAccess - Whether to log denied access attempts
 * @property {number} retentionDays - How long to retain audit logs
 * @property {Object} alertThresholds - Thresholds for security alerts
 * @property {number} alertThresholds.sensitiveAccessPerHour - Max sensitive accesses before alert
 * @property {number} alertThresholds.deniedAccessPerHour - Max denied accesses before alert
 */
export const FIELD_AUDIT_CONFIG = {
  enabledForResources: ['Customer', 'User', 'InsurancePolicy', 'Transaction'],
  logSensitiveAccess: true,
  logDeniedAccess: true,
  retentionDays: 90,
  alertThresholds: {
    sensitiveAccessPerHour: 100,
    deniedAccessPerHour: 50,
  },
};
