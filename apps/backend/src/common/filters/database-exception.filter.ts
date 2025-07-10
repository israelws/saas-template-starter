import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';
import { LoggerService } from '../logger/logger.service';

@Catch(QueryFailedError, EntityNotFoundError, TypeORMError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('DatabaseFilter');
  }

  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: HttpStatus;
    let message: string;
    let errorCode: string;
    let details: any = {};

    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
      errorCode = 'ENTITY_NOT_FOUND';
    } else if (exception instanceof QueryFailedError) {
      const error = exception as any;
      
      // Handle specific PostgreSQL error codes
      switch (error.code) {
        case '23505': // Unique violation
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          errorCode = 'DUPLICATE_ENTRY';
          details = {
            constraint: error.constraint,
            duplicateKey: this.extractDuplicateKey(error.detail),
          };
          break;
        
        case '23503': // Foreign key violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference to related resource';
          errorCode = 'FOREIGN_KEY_VIOLATION';
          details = {
            constraint: error.constraint,
          };
          break;
        
        case '23502': // Not null violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Required field is missing';
          errorCode = 'NOT_NULL_VIOLATION';
          details = {
            column: error.column,
          };
          break;
        
        case '23514': // Check constraint violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Data validation failed';
          errorCode = 'CHECK_VIOLATION';
          details = {
            constraint: error.constraint,
          };
          break;
        
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database operation failed';
          errorCode = 'DATABASE_ERROR';
          
          if (process.env.NODE_ENV !== 'production') {
            details = {
              code: error.code,
              severity: error.severity,
              sqlState: error.sqlState,
            };
          }
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database error occurred';
      errorCode = 'DATABASE_ERROR';
    }

    const errorResponse = {
      statusCode: status,
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(Object.keys(details).length > 0 && { details }),
      ...(process.env.NODE_ENV !== 'production' && {
        originalError: exception.message,
      }),
    };

    // Log the database error
    this.logger.error({
      message: 'Database Exception',
      exception: {
        name: exception.name,
        message: exception.message,
        code: (exception as any).code,
        constraint: (exception as any).constraint,
        detail: (exception as any).detail,
      },
      request: {
        method: request.method,
        url: request.url,
        userId: (request as any).user?.id,
        organizationId: (request as any).user?.organizationId,
      },
      response: errorResponse,
    });

    response.status(status).json(errorResponse);
  }

  private extractDuplicateKey(detail: string): string | null {
    if (!detail) return null;
    
    // Extract the duplicate key from PostgreSQL error detail
    // Format: Key (column)=(value) already exists.
    const match = detail.match(/Key \((.+?)\)=\((.+?)\)/);
    return match ? `${match[1]}=${match[2]}` : null;
  }
}