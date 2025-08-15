import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CognitoService } from './cognito.service';
import { UsersService } from '../users/users.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';
import { CreateUserDto, UserRole } from '@saas-template/shared';
import { LoggerService } from '../../common/logger/logger.service';
import { Log, LogPerformance } from '../../common/decorators/log.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly cognitoService: CognitoService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  @LogPerformance(500) // Log if takes more than 500ms
  async login(loginDto: LoginDto) {
    try {
      this.logger.log({ message: 'Login attempt', email: loginDto.email });

      // Authenticate with Cognito
      const cognitoAuth = await this.cognitoService.authenticateUser(
        loginDto.email,
        loginDto.password,
      );

      // Get or create user in our database
      let user = await this.usersService.findByCognitoId(cognitoAuth.cognitoId);

      if (!user) {
        // User exists in Cognito but not in our DB, create them
        this.logger.warn({
          message: 'User exists in Cognito but not in database',
          email: loginDto.email,
          cognitoId: cognitoAuth.cognitoId,
        });

        const cognitoUser = await this.cognitoService.getUserByEmail(loginDto.email);
        user = await this.usersService.create({
          cognitoId: cognitoAuth.cognitoId,
          email: loginDto.email,
          firstName: cognitoUser.firstName || '',
          lastName: cognitoUser.lastName || '',
        });

        this.logger.log({
          message: 'Created user from Cognito',
          userId: user.id,
          email: user.email,
        });
      }

      const accessToken = cognitoAuth.accessToken;
      const refreshToken = cognitoAuth.refreshToken;
      const expiresIn = cognitoAuth.expiresIn;

      // Update last login
      await this.usersService.updateLastLogin(user.id);

      // Get user with memberships
      const userWithMemberships = await this.usersService.findOneWithMemberships(user.id);

      // Log successful login
      this.logger.logAuth({
        type: 'login',
        userId: user.id,
        email: user.email,
      });

      return {
        user: userWithMemberships,
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      this.logger.logAuth({
        type: 'failed_login',
        email: loginDto.email,
        reason: error.message,
      });

      // Pass through specific error messages from Cognito
      if (
        error.message &&
        (error.message.includes('verify your email') ||
          error.message.includes('Invalid email or password'))
      ) {
        throw new UnauthorizedException(error.message);
      }

      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      this.logger.log({ message: 'Registration attempt', email: registerDto.email });

      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      this.logger.log({
        message: 'Existing user check',
        email: registerDto.email,
        found: !!existingUser,
      });

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      // Register with Cognito
      const cognitoUser = await this.cognitoService.registerUser(registerDto);
      const cognitoId = cognitoUser.cognitoId;

      // Create user in our database
      const createUserDto: CreateUserDto = {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.USER, // Default role
        organizationId: registerDto.organizationId,
      };

      const user = await this.usersService.create({
        ...createUserDto,
        cognitoId,
      });

      return {
        user,
        message: 'User registered successfully. Please check your email for verification.',
      };
    } catch (error) {
      this.logger.error({
        message: 'Registration error',
        email: registerDto.email,
        error: error.message,
        stack: error.stack,
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const tokens = await this.cognitoService.refreshToken(refreshTokenDto.refreshToken);

      return {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      await this.cognitoService.forgotPassword(forgotPasswordDto.email);

      return {
        message: 'Password reset code sent to your email',
      };
    } catch (error) {
      // Don't reveal if email exists or not
      return {
        message: 'If the email exists, a password reset code has been sent',
      };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      await this.cognitoService.confirmForgotPassword(
        resetPasswordDto.email,
        resetPasswordDto.code,
        resetPasswordDto.newPassword,
      );

      return {
        message: 'Password reset successfully',
      };
    } catch (error) {
      throw new BadRequestException('Invalid code or password reset failed');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.cognitoService.changePassword(
        user.email,
        changePasswordDto.oldPassword,
        changePasswordDto.newPassword,
      );

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      throw new BadRequestException('Password change failed');
    }
  }

  async logout(userId: string) {
    // In a real application, you might want to:
    // 1. Invalidate the refresh token in Cognito
    // 2. Add the token to a blacklist
    // 3. Clear any server-side sessions

    return {
      message: 'Logged out successfully',
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOneWithMemberships(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async validateUser(cognitoId: string) {
    const user = await this.usersService.findByCognitoId(cognitoId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async resendConfirmationEmail(email: string) {
    try {
      this.logger.log({ message: 'Resending confirmation email', email });

      await this.cognitoService.resendConfirmationCode(email);

      return {
        message: 'Confirmation email sent successfully',
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to resend confirmation email',
        email,
        error: error.message,
      });
      throw new BadRequestException('Failed to resend confirmation email');
    }
  }

  async verifyEmail(email: string, code: string) {
    try {
      this.logger.log({ message: 'Verifying email', email });

      await this.cognitoService.confirmSignUp(email, code);

      // Update user's email verification status in our database
      const user = await this.usersService.findByEmail(email);
      if (user) {
        await this.usersService.updateEmailVerified(user.id, true);

        this.logger.log({
          message: 'Email verified',
          userId: user.id,
          email: user.email,
        });
      }

      return {
        message: 'Email verified successfully',
      };
    } catch (error) {
      this.logger.error({ message: 'Email verification failed', email, error: error.message });
      throw new BadRequestException('Invalid or expired verification code');
    }
  }
}
