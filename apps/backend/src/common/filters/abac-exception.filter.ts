import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '../logger/logger.service';

// Custom ABAC Exception classes
export class PolicyEvaluationException extends Error {
  constructor(
    message: string,
    public readonly policyId?: string,
    public readonly context?: any,
  ) {
    super(message);
    this.name = 'PolicyEvaluationException';
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(
    message: string,
    public readonly requiredPermission?: string,
    public readonly userPermissions?: string[],
    public readonly resource?: string,
  ) {
    super(message);
    this.name = 'InsufficientPermissionsException';
  }
}

export class OrganizationAccessDeniedException extends ForbiddenException {
  constructor(
    message: string,
    public readonly organizationId?: string,
    public readonly userId?: string,
  ) {
    super(message);
    this.name = 'OrganizationAccessDeniedException';
  }
}

@Catch(
  PolicyEvaluationException,
  InsufficientPermissionsException,
  OrganizationAccessDeniedException,
  ForbiddenException,
  UnauthorizedException,
)
export class AbacExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ABACFilter');
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: HttpStatus;
    let errorCode: string;
    let message: string;
    let details: any = {};

    if (exception instanceof UnauthorizedException) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = 'UNAUTHORIZED';
      message = 'Authentication required';
      
      this.logger.warn({ message: "Authentication Required", url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],});
    } else if (exception instanceof PolicyEvaluationException) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'POLICY_EVALUATION_FAILED';
      message = 'Policy evaluation failed';
      details = {
        policyId: exception.policyId,
        context: process.env.NODE_ENV !== 'production' ? exception.context : undefined,
      };

      this.logger.error({
        message: 'Policy Evaluation Failed',
        exception: {
          message: exception.message,
          policyId: exception.policyId,
          context: exception.context,
        },
        request: {
          method: request.method,
          url: request.url,
          userId: (request as any).user?.id,
          organizationId: (request as any).user?.organizationId,
        },
      });
    } else if (exception instanceof InsufficientPermissionsException) {
      status = HttpStatus.FORBIDDEN;
      errorCode = 'INSUFFICIENT_PERMISSIONS';
      message = 'Insufficient permissions to perform this action';
      details = {
        requiredPermission: exception.requiredPermission,
        resource: exception.resource,
        ...(process.env.NODE_ENV !== 'production' && {
          userPermissions: exception.userPermissions,
        }),
      };

      this.logger.warn({
        message: 'Insufficient Permissions',
        userId: (request as any).user?.id,
        organizationId: (request as any).user?.organizationId,
        requiredPermission: exception.requiredPermission,
        userPermissions: exception.userPermissions,
        resource: exception.resource,
        request: {
          method: request.method,
          url: request.url,
        },
      });
    } else if (exception instanceof OrganizationAccessDeniedException) {
      status = HttpStatus.FORBIDDEN;
      errorCode = 'ORGANIZATION_ACCESS_DENIED';
      message = 'Access denied to organization resource';
      details = {
        organizationId: exception.organizationId,
        userId: exception.userId,
      };

      this.logger.warn({
        message: 'Organization Access Denied',
        userId: exception.userId || (request as any).user?.id,
        organizationId: exception.organizationId,
        request: {
          method: request.method,
          url: request.url,
        },
      });
    } else {
      // Generic ForbiddenException
      status = HttpStatus.FORBIDDEN;
      errorCode = 'FORBIDDEN';
      message = exception.message || 'Access denied';

      this.logger.warn({
        message: 'Access Denied',
        exceptionMessage: exception.message,
        userId: (request as any).user?.id,
        organizationId: (request as any).user?.organizationId,
        request: {
          method: request.method,
          url: request.url,
        },
      });
    }

    const errorResponse = {
      statusCode: status,
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(Object.keys(details).length > 0 && { details }),
    };

    response.status(status).json(errorResponse);
  }
}