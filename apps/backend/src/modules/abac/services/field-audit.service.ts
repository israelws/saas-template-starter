import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { tap } from 'rxjs/operators';

export interface FieldAccessLog {
  userId: string;
  organizationId: string;
  resourceType: string;
  resourceId?: string;
  action: 'read' | 'write';
  fields: string[];
  deniedFields?: string[];
  sensitiveFieldsAccessed?: string[];
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

// Define sensitive fields per resource type
const SENSITIVE_FIELDS: Record<string, string[]> = {
  Customer: ['ssn', 'dateOfBirth', 'medicalHistory', 'creditScore', 'income', 'bankAccount'],
  User: ['password', 'passwordHash', 'securityQuestions', 'mfaSecret'],
  InsurancePolicy: ['profitMargin', 'internalNotes', 'commissionStructure'],
  Transaction: ['bankDetails', 'routingNumber', 'accountNumber'],
  Employee: ['salary', 'performanceRating', 'disciplinaryRecords'],
};

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
   */
  async logFieldAccess(log: FieldAccessLog): Promise<void> {
    // Identify sensitive fields that were accessed
    const sensitiveFields = this.identifySensitiveFields(
      log.resourceType,
      log.fields
    );

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
    this.logger.log(
      `Field access: ${log.action} on ${log.resourceType} by user ${log.userId}`,
      {
        fields: log.fields.length,
        denied: log.deniedFields?.length || 0,
        sensitive: sensitiveFields.length,
      }
    );
  }

  /**
   * Log when fields are denied access
   */
  async logFieldDenial(
    userId: string,
    organizationId: string,
    resourceType: string,
    deniedFields: string[],
    context?: any
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
   */
  async getFieldAccessStats(
    userId: string,
    organizationId: string,
    dateRange?: { start: Date; end: Date }
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
   */
  private identifySensitiveFields(
    resourceType: string,
    fields: string[]
  ): string[] {
    const sensitiveFieldsForType = SENSITIVE_FIELDS[resourceType] || [];
    const globalSensitiveFields = [
      'password',
      'ssn',
      'creditCard',
      'bankAccount',
      'medicalRecord',
    ];

    const allSensitiveFields = [
      ...sensitiveFieldsForType,
      ...globalSensitiveFields,
    ];

    return fields.filter(field => 
      allSensitiveFields.some(sensitive => 
        field.toLowerCase().includes(sensitive.toLowerCase())
      )
    );
  }

  /**
   * Enhanced field access interceptor with audit logging
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
 */
@Injectable()
export class FieldAccessMonitor {
  private readonly logger = new Logger(FieldAccessMonitor.name);

  constructor(private eventEmitter: EventEmitter2) {
    this.setupEventListeners();
  }

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

// Export a function to get sensitive fields for a resource type
export function getSensitiveFields(resourceType: string): string[] {
  return SENSITIVE_FIELDS[resourceType] || [];
}

// Export configuration for sensitive field detection
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