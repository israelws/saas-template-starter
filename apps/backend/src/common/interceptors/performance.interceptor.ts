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
export class PerformanceInterceptor implements NestInterceptor {
  private readonly slowRequestThreshold = 1000; // 1 second

  constructor(private logger: LoggerService) {
    this.logger.setContext('Performance');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        
        if (duration > this.slowRequestThreshold) {
          this.logger.warn({ message: "Slow Request Detected", method,
            url,
            duration,
            threshold: this.slowRequestThreshold,
            userId: request.user?.id,});
        }
      }),
    );
  }
}