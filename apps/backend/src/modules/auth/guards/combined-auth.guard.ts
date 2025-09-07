import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CombinedAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    // Log authentication attempts for debugging
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      console.log('Authentication failed:', {
        error: err?.message || 'No error message',
        info: info?.message || 'No info',
        authHeader: request.headers.authorization ? 'Present' : 'Missing',
      });
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}