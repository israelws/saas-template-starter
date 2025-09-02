import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteWorkflowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputData?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triggerEntityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  triggerEntityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triggerEvent?: string;
}