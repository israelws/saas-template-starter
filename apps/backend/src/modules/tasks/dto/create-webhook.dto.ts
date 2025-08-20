import { IsString, IsUrl, IsEnum, IsBoolean, IsOptional, IsObject, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookAuthType, WebhookMethod } from '../entities/lifecycle-webhook.entity';

class RetryConfigDto {
  @ApiProperty({ example: 3 })
  @IsOptional()
  maxRetries?: number;

  @ApiProperty({ example: 1000 })
  @IsOptional()
  retryDelay?: number;

  @ApiProperty({ example: 2 })
  @IsOptional()
  backoffMultiplier?: number;
}

class AuthConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKeyHeader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>;
}

export class CreateWebhookDto {
  @ApiProperty({ example: 'Slack Notification' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://hooks.slack.com/services/xxx' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ enum: WebhookMethod, default: WebhookMethod.POST })
  @IsOptional()
  @IsEnum(WebhookMethod)
  method?: WebhookMethod;

  @ApiPropertyOptional({ example: { 'Content-Type': 'application/json' } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ enum: WebhookAuthType })
  @IsOptional()
  @IsEnum(WebhookAuthType)
  authType?: WebhookAuthType;

  @ApiPropertyOptional({ type: AuthConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthConfigDto)
  authConfig?: AuthConfigDto;

  @ApiPropertyOptional({ type: RetryConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  retryConfig?: RetryConfigDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeContext?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeAuth?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customPayload?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}