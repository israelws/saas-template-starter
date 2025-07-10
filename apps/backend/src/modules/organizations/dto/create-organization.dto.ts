import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrganizationType, OrganizationSettings } from '@saas-template/shared';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corporation',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Organization type',
    enum: OrganizationType,
    example: OrganizationType.COMPANY,
  })
  @IsEnum(OrganizationType)
  type: OrganizationType;

  @ApiProperty({
    description: 'Organization description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Organization code',
    required: false,
    example: 'ACME001',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Parent organization ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    description: 'Organization settings',
    required: false,
    type: Object,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  settings?: OrganizationSettings;

  @ApiProperty({
    description: 'Whether the organization is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
    type: Object,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}