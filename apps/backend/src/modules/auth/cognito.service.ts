import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  GetUserCommand,
  AdminGetUserCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';
import { RegisterDto } from './dto';

@Injectable()
export class CognitoService {
  private cognitoClient: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;
  private userPoolId: string;

  constructor(private configService: ConfigService) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.clientId = this.configService.get('COGNITO_CLIENT_ID');
    this.clientSecret = this.configService.get('COGNITO_CLIENT_SECRET', '');
    this.userPoolId = this.configService.get('COGNITO_USER_POOL_ID');
  }

  private generateSecretHash(username: string): string {
    if (!this.clientSecret) {
      return '';
    }
    
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  async authenticateUser(email: string, password: string) {
    try {
      const params = {
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      };

      if (this.clientSecret) {
        params.AuthParameters['SECRET_HASH'] = this.generateSecretHash(email);
      }

      const command = new InitiateAuthCommand(params);
      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        console.error('No AuthenticationResult in response:', response);
        if (response.ChallengeName) {
          console.error('Challenge required:', response.ChallengeName);
          console.error('Challenge parameters:', response.ChallengeParameters);
          throw new BadRequestException(`Authentication challenge required: ${response.ChallengeName}`);
        }
        throw new BadRequestException('Authentication failed - no result returned');
      }

      const cognitoId = response.AuthenticationResult.AccessToken
        ? this.extractCognitoIdFromToken(response.AuthenticationResult.AccessToken)
        : '';

      return {
        cognitoId,
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      console.error('Cognito authentication error:', error);
      console.error('Error name:', error.name);
      console.error('Error code:', error.$metadata?.httpStatusCode);
      console.error('AWS error code:', error.Code || error.$metadata?.cfId);
      console.error('AWS error type:', error.__type);
      
      // Check if it's an AWS SDK error
      if (error.$metadata) {
        console.error('AWS SDK Error metadata:', error.$metadata);
      }
      
      // Log the original error message from AWS
      if (error.message && !error.message.includes('Authentication failed')) {
        console.error('Original AWS error message:', error.message);
      }
      
      // Check for specific Cognito errors
      if (error.name === 'UserNotConfirmedException') {
        throw new BadRequestException('Please verify your email before signing in');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new BadRequestException('Invalid email or password');
      }
      
      throw new BadRequestException(`Authentication failed: ${error.message}`);
    }
  }

  async registerUser(registerDto: RegisterDto) {
    try {
      const params = {
        ClientId: this.clientId,
        Username: registerDto.email,
        Password: registerDto.password,
        UserAttributes: [
          { Name: 'email', Value: registerDto.email },
          { Name: 'given_name', Value: registerDto.firstName },
          { Name: 'family_name', Value: registerDto.lastName },
        ],
      };

      if (this.clientSecret) {
        params['SecretHash'] = this.generateSecretHash(registerDto.email);
      }

      const command = new SignUpCommand(params);
      const response = await this.cognitoClient.send(command);

      return {
        cognitoId: response.UserSub,
        confirmed: response.UserConfirmed,
      };
    } catch (error) {
      console.error('Cognito registration error:', error);
      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('User already exists');
      }
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }

  async confirmSignUp(email: string, code: string) {
    try {
      const params = {
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
      };

      if (this.clientSecret) {
        params['SecretHash'] = this.generateSecretHash(email);
      }

      const command = new ConfirmSignUpCommand(params);
      await this.cognitoClient.send(command);

      return { confirmed: true };
    } catch (error) {
      throw new BadRequestException('Invalid confirmation code');
    }
  }

  async resendConfirmationCode(email: string) {
    try {
      const params = {
        ClientId: this.clientId,
        Username: email,
      };

      if (this.clientSecret) {
        params['SecretHash'] = this.generateSecretHash(email);
      }

      const command = new ResendConfirmationCodeCommand(params);
      await this.cognitoClient.send(command);

      return { codeSent: true };
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      throw new BadRequestException(`Failed to resend confirmation code: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const params = {
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      };

      const command = new InitiateAuthCommand(params);
      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new BadRequestException('Token refresh failed');
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      };
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    try {
      const params = {
        ClientId: this.clientId,
        Username: email,
      };

      if (this.clientSecret) {
        params['SecretHash'] = this.generateSecretHash(email);
      }

      const command = new ForgotPasswordCommand(params);
      await this.cognitoClient.send(command);

      return { codeSent: true };
    } catch (error) {
      // Don't reveal if user exists
      return { codeSent: true };
    }
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    try {
      const params = {
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      };

      if (this.clientSecret) {
        params['SecretHash'] = this.generateSecretHash(email);
      }

      const command = new ConfirmForgotPasswordCommand(params);
      await this.cognitoClient.send(command);

      return { passwordReset: true };
    } catch (error) {
      throw new BadRequestException('Password reset failed');
    }
  }

  async changePassword(email: string, oldPassword: string, newPassword: string) {
    try {
      // First authenticate to get access token
      const auth = await this.authenticateUser(email, oldPassword);

      const params = {
        AccessToken: auth.accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      };

      const command = new ChangePasswordCommand(params);
      await this.cognitoClient.send(command);

      return { passwordChanged: true };
    } catch (error) {
      throw new BadRequestException('Password change failed');
    }
  }

  async getUserByEmail(email: string) {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: email,
      };

      const command = new AdminGetUserCommand(params);
      const response = await this.cognitoClient.send(command);

      const attributes = response.UserAttributes || [];
      const getAttributeValue = (name: string) => {
        const attr = attributes.find(a => a.Name === name);
        return attr?.Value;
      };

      return {
        cognitoId: response.Username,
        email: getAttributeValue('email'),
        firstName: getAttributeValue('given_name'),
        lastName: getAttributeValue('family_name'),
        emailVerified: getAttributeValue('email_verified') === 'true',
      };
    } catch (error) {
      throw new BadRequestException('User not found');
    }
  }

  private extractCognitoIdFromToken(accessToken: string): string {
    try {
      // Decode JWT token to get sub (cognitoId)
      const tokenParts = accessToken.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      return payload.sub;
    } catch (error) {
      return '';
    }
  }
}