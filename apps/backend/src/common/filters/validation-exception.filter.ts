import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '../logger/logger.service';

interface ValidationError {
  field: string;
  constraints: string[];
  value?: any;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ValidationFilter');
  }

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Check if this is a validation error from class-validator
    const isValidationError = 
      typeof exceptionResponse === 'object' &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0 &&
      typeof exceptionResponse.message[0] === 'object';

    let errorResponse;

    if (isValidationError) {
      // Format validation errors for better readability
      const validationErrors: ValidationError[] = exceptionResponse.message.map((error: any) => ({
        field: error.property,
        constraints: Object.values(error.constraints || {}),
        value: error.value,
      }));

      errorResponse = {
        statusCode: status,
        error: 'Validation Failed',
        message: 'Request validation failed',
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        validationErrors,
        details: {
          totalErrors: validationErrors.length,
          failedFields: validationErrors.map(e => e.field),
        },
      };

      this.logger.warn({ message: "Validation Error", url: request.url,
        method: request.method,
        userId: (request as any).user?.id,
        organizationId: (request as any).user?.organizationId,
        validationErrors,
        requestBody: this.sanitizeRequestBody(request.body),});
    } else {
      // Handle other BadRequestExceptions
      errorResponse = {
        statusCode: status,
        error: 'Bad Request',
        message: exceptionResponse.message || 'Bad request',
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      };

      this.logger.warn({ message: "Bad Request", url: request.url,
        method: request.method,
        userId: (request as any).user?.id,
        organizationId: (request as any).user?.organizationId,
        exceptionMessage: exceptionResponse.message,});
    }

    response.status(status).json(errorResponse);
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}