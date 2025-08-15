import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const region = configService.get('AWS_REGION');
    const userPoolId = configService.get('COGNITO_USER_POOL_ID');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // audience: configService.get('COGNITO_CLIENT_ID'), // Removed - Cognito access tokens don't have 'aud' claim
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
      }),
    });

    console.log('JWT Strategy initialized with config:', {
      region,
      userPoolId,
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy validate called with payload:', {
      sub: payload.sub,
      exp: payload.exp,
      iat: payload.iat,
    });
    const cognitoId = payload.sub;

    if (!cognitoId) {
      console.error('JWT validation failed: Missing cognitoId');
      throw new UnauthorizedException('Invalid token');
    }

    // Validate user exists and is active
    const user = await this.authService.validateUser(cognitoId);
    console.log('User validated successfully:', { id: user.id, email: user.email });

    // Get user with their organization memberships
    const userWithMemberships = await this.authService.getProfile(user.id);
    console.log('User profile loaded with memberships:', {
      membershipCount: userWithMemberships.memberships?.length,
    });

    return {
      id: user.id,
      cognitoId: user.cognitoId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      metadata: user.metadata,
      isSuperAdmin: user.metadata?.isSuperAdmin === true,
      memberships: userWithMemberships.memberships,
      // This will be attached to request.user
    };
  }
}
