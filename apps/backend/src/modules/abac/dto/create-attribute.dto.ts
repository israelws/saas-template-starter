import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttributeCategory, AttributeType } from '@saas-template/shared';

export class CreateAttributeDto {
  @ApiProperty({
    description: 'Unique key for the attribute',
    example: 'subject.department',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Display name for the attribute',
    example: 'User Department',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the attribute',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category of the attribute',
    enum: AttributeCategory,
  })
  @IsEnum(AttributeCategory)
  category: AttributeCategory;

  @ApiProperty({
    description: 'Data type of the attribute',
    enum: AttributeType,
  })
  @IsEnum(AttributeType)
  type: AttributeType;

  @ApiProperty({
    description: 'Data type (alias for type)',
    enum: AttributeType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AttributeType)
  dataType?: AttributeType;

  @ApiProperty({
    description: 'Whether the attribute is required',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({
    description: 'Default value for the attribute',
    required: false,
  })
  @IsOptional()
  defaultValue?: any;

  @ApiProperty({
    description: 'Allowed values for the attribute',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedValues?: string[];

  @ApiProperty({
    description: 'Organization ID (for organization-specific attributes)',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}