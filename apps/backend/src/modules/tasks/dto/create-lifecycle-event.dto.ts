import { IsString, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';

export class CreateLifecycleEventDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isFinal?: boolean;

  @IsBoolean()
  @IsOptional()
  isInitial?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedTransitions?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}