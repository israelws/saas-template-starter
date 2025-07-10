import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SubjectDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  groups: string[];

  @ApiProperty({ type: Object })
  @IsObject()
  attributes: Record<string, any>;
}

class ResourceDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ type: Object })
  @IsObject()
  attributes: Record<string, any>;
}

class EnvironmentDto {
  @ApiProperty()
  timestamp: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ type: Object })
  @IsObject()
  attributes: Record<string, any>;
}

export class PolicyEvaluationContextDto {
  @ApiProperty({ type: SubjectDto })
  @ValidateNested()
  @Type(() => SubjectDto)
  subject: SubjectDto;

  @ApiProperty({ type: ResourceDto })
  @ValidateNested()
  @Type(() => ResourceDto)
  resource: ResourceDto;

  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty({ type: EnvironmentDto })
  @ValidateNested()
  @Type(() => EnvironmentDto)
  environment: EnvironmentDto;

  @ApiProperty()
  @IsString()
  organizationId: string;
}