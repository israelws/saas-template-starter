import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, IsUrl, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleWorkspaceConfigDto {
  @ApiProperty({ description: 'Google OAuth2 Client ID' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Google OAuth2 Client Secret' })
  @IsString()
  clientSecret: string;

  @ApiProperty({ description: 'Google OAuth2 Refresh Token' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ description: 'Email address to send from' })
  @IsEmail()
  fromEmail: string;

  @ApiPropertyOptional({ description: 'Display name for sender' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'Google Workspace domain' })
  @IsOptional()
  @IsString()
  domain?: string;
}

export class Office365ConfigDto {
  @ApiProperty({ description: 'Azure AD Tenant ID' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'Azure AD Application Client ID' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Azure AD Application Client Secret' })
  @IsString()
  clientSecret: string;

  @ApiProperty({ description: 'Email address to send from' })
  @IsEmail()
  fromEmail: string;

  @ApiPropertyOptional({ description: 'Display name for sender' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'Microsoft 365 domain' })
  @IsOptional()
  @IsString()
  domain?: string;
}

export class SendGridConfigDto {
  @ApiProperty({ description: 'SendGrid API Key' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'Email address to send from' })
  @IsEmail()
  fromEmail: string;

  @ApiPropertyOptional({ description: 'Display name for sender' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'SendGrid template ID for invitations' })
  @IsOptional()
  @IsString()
  invitationTemplateId?: string;

  @ApiPropertyOptional({ description: 'SendGrid template ID for password reset' })
  @IsOptional()
  @IsString()
  passwordResetTemplateId?: string;

  @ApiPropertyOptional({ description: 'SendGrid template ID for welcome emails' })
  @IsOptional()
  @IsString()
  welcomeTemplateId?: string;
}

export class TwilioConfigDto {
  @ApiProperty({ description: 'Twilio Account SID' })
  @IsString()
  accountSid: string;

  @ApiProperty({ description: 'Twilio Auth Token' })
  @IsString()
  authToken: string;

  @ApiProperty({ description: 'Twilio SendGrid API Key (if using SendGrid)' })
  @IsOptional()
  @IsString()
  sendGridApiKey?: string;

  @ApiProperty({ description: 'Email address to send from' })
  @IsEmail()
  fromEmail: string;

  @ApiPropertyOptional({ description: 'Display name for sender' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'Twilio Messaging Service SID (for SMS)' })
  @IsOptional()
  @IsString()
  messagingServiceSid?: string;
}

export class SmtpConfigDto {
  @ApiProperty({ description: 'SMTP server hostname' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'SMTP server port', minimum: 1, maximum: 65535 })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ description: 'Use secure connection (TLS/SSL)' })
  @IsBoolean()
  secure: boolean;

  @ApiPropertyOptional({ description: 'SMTP authentication username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'SMTP authentication password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Email address to send from' })
  @IsEmail()
  fromEmail: string;

  @ApiPropertyOptional({ description: 'Display name for sender' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'Require TLS (STARTTLS)' })
  @IsOptional()
  @IsBoolean()
  requireTls?: boolean;

  @ApiPropertyOptional({ description: 'Ignore TLS certificate errors' })
  @IsOptional()
  @IsBoolean()
  ignoreTls?: boolean;

  @ApiPropertyOptional({ description: 'Connection timeout in milliseconds' })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(60000)
  connectionTimeout?: number;

  @ApiPropertyOptional({ description: 'Greeting timeout in milliseconds' })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(60000)
  greetingTimeout?: number;

  @ApiPropertyOptional({ description: 'Socket timeout in milliseconds' })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(300000)
  socketTimeout?: number;
}

export class AwsSesConfigDto {
  @ApiProperty({ description: 'AWS Region' })
  @IsString()
  region: string;

  @ApiPropertyOptional({ description: 'AWS Access Key ID' })
  @IsOptional()
  @IsString()
  accessKeyId?: string;

  @ApiPropertyOptional({ description: 'AWS Secret Access Key' })
  @IsOptional()
  @IsString()
  secretAccessKey?: string;

  @ApiProperty({ description: 'Email address to send from' })
  @IsEmail()
  fromEmail: string;

  @ApiPropertyOptional({ description: 'Display name for sender' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ description: 'Configuration set name for tracking' })
  @IsOptional()
  @IsString()
  configurationSet?: string;
}