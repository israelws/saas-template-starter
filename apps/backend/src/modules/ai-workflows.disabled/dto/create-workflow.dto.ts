import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowTriggerType } from '../entities/workflow.entity';

class FlowNodeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsObject()
  position: { x: number; y: number };

  @ApiProperty()
  @IsObject()
  data: any;
}

class FlowEdgeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsString()
  target: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: any;
}

class FlowDefinitionDto {
  @ApiProperty({ type: [FlowNodeDto] })
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  nodes: FlowNodeDto[];

  @ApiProperty({ type: [FlowEdgeDto] })
  @ValidateNested({ each: true })
  @Type(() => FlowEdgeDto)
  edges: FlowEdgeDto[];
}

export class CreateWorkflowDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: WorkflowTriggerType })
  @IsEnum(WorkflowTriggerType)
  triggerType: WorkflowTriggerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ type: FlowDefinitionDto })
  @ValidateNested()
  @Type(() => FlowDefinitionDto)
  flowDefinition: FlowDefinitionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputSchema?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outputSchema?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}