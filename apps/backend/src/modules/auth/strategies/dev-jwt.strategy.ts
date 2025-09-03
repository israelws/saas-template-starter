import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Development-only JWT strategy that accepts any token in development mode
 * This allows easy testing without requiring AWS Cognito authentication
 */
@Injectable()
export class DevJwtStrategy extends PassportStrategy(Strategy, 'dev-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: 'dev-secret-key', // Any secret will work in dev
    });
  }

  async validate(payload: any) {
    // In development mode, return a mock user
    const isDevelopment = 
      process.env.NODE_ENV === 'development' || 
      process.env.NODE_ENV === 'dev' ||
      !process.env.NODE_ENV;

    if (isDevelopment) {
      // Return a mock user for development
      return {
        id: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
        cognitoId: 'dev-cognito-id',
        email: 'dev@example.com',
        firstName: 'Dev',
        lastName: 'User',
        status: 'active',
        sub: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
        metadata: {
          isSuperAdmin: true,
        },
        isSuperAdmin: true,
        memberships: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            organizationId: '4c072108-f9d0-4ed8-8cfd-1a65630b0b44', // TechCorp Global
            userId: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
            role: 'admin',
            isDefault: true,
          },
        ],
      };
    }

    // In production, this strategy should not be used
    throw new Error('Development JWT strategy should not be used in production');
  }
}