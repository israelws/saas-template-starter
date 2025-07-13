import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const region = configService.get('AWS_REGION');
    const userPoolId = configService.get('COGNITO_USER_POOL_ID');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: configService.get('COGNITO_CLIENT_ID'),
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: any) {
    const cognitoId = payload.sub;
    
    if (!cognitoId) {
      throw new UnauthorizedException('Invalid token');
    }

    // Validate user exists and is active
    const user = await this.authService.validateUser(cognitoId);
    
    // Get user with their organization memberships
    const userWithMemberships = await this.authService.getProfile(user.id);
    
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