import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CognitoService } from './cognito.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DevJwtStrategy } from './strategies/dev-jwt.strategy';
import { UsersModule } from '../users/users.module';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { DevJwtAuthGuard } from './guards/dev-jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, CognitoService, JwtStrategy, DevJwtStrategy, OptionalJwtAuthGuard, DevJwtAuthGuard],
  exports: [AuthService, CognitoService, OptionalJwtAuthGuard, DevJwtAuthGuard],
})
export class AuthModule {}
