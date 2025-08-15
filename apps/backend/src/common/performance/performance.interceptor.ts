import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const method = request.method;
    const route = this.extractRoute(request);
    const organizationId = this.extractOrganizationId(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.metricsService.recordHttpRequest(
            method,
            route,
            statusCode,
            duration,
            organizationId,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.metricsService.recordHttpRequest(
            method,
            route,
            statusCode,
            duration,
            organizationId,
          );

          // Record error metrics
          this.metricsService.recordError(
            error.constructor.name,
            this.extractModule(route),
            this.getErrorSeverity(statusCode),
          );
        },
      }),
    );
  }

  private extractRoute(request: Request): string {
    // Get the route pattern instead of the actual path with parameters
    const route = request.route?.path || request.url;
    return route.replace(/\/:[^\/]+/g, '/:id'); // Replace :param with :id for consistency
  }

  private extractOrganizationId(request: Request): string | undefined {
    // Try to extract organization ID from various sources
    const organizationId =
      (request.headers['x-organization-id'] as string) ||
      request.body?.organizationId ||
      (request.query?.organizationId as string) ||
      request.params?.organizationId;

    return organizationId;
  }

  private extractModule(route: string): string {
    const parts = route.split('/').filter((part) => part.length > 0);
    return parts.length > 1 ? parts[1] : 'unknown';
  }

  private getErrorSeverity(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'high';
    if (statusCode >= 300) return 'medium';
    return 'low';
  }
}
