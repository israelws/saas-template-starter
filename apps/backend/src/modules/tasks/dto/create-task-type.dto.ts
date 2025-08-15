import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { TaskTypeScope } from '../entities/task-type.entity';

export class CreateTaskTypeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskTypeScope)
  @IsOptional()
  scope?: TaskTypeScope;

  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}