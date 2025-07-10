import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Log request details (excluding sensitive data)
    const sanitizedBody = this.sanitizeBody(body);
    
    this.logger.debug({ message: "Incoming Request", method,
      url,
      body: sanitizedBody,
      ip,
      userAgent,});

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          this.logger.logHttpRequest({
            method,
            url,
            ip,
            userAgent,
            userId: request.user?.id,
            duration,
            statusCode,
          });

          // Log response data in debug mode
          if (process.env.LOG_LEVEL === 'debug') {
            this.logger.debug({ message: "Response Data", method,
              url,
              statusCode,
              duration,
              data: this.sanitizeBody(data),});
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          this.logger.error({
            message: 'Request Failed',
            method,
            url,
            ip,
            userAgent,
            userId: request.user?.id,
            duration,
            statusCode,
            error: {
              message: error.message,
              stack: error.stack,
            },
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = [
      'password',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
    ];

    const sanitized = { ...body };
    
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}