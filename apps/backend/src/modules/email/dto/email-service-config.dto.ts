import { IsEnum, IsBoolean, IsObject, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailServiceProvider } from '../entities/email-service-config.entity';

export class CreateEmailServiceConfigDto {
  @ApiProperty({
    enum: EmailServiceProvider,
    description: 'Email service provider type',
  })
  @IsEnum(EmailServiceProvider)
  @IsNotEmpty()
  provider: EmailServiceProvider;

  @ApiPropertyOptional({
    description: 'Organization ID for organization-specific configuration',
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    description: 'Configuration object for the email service',
    example: {
      apiKey: 'your-api-key',
      fromEmail: 'noreply@example.com',
      fromName: 'Your Company',
    },
  })
  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;

  @ApiProperty({
    description: 'Whether this email service is enabled',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Whether this is the default email service for the organization or system',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Whether this is the global default email service (system-wide)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isGlobalDefault?: boolean;
}

export class UpdateEmailServiceConfigDto {
  @ApiProperty({
    description: 'Configuration object for the email service',
    required: false,
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({
    description: 'Whether this email service is enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Whether this is the default email service for the organization or system',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Whether this is the global default email service (system-wide)',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isGlobalDefault?: boolean;
}

export class TestEmailServiceDto {
  @ApiProperty({
    description: 'Test email recipient',
    example: 'test@example.com',
  })
  @IsNotEmpty()
  to: string;
}
