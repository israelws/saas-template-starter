import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAttributeDto } from './create-attribute.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAttributeDto extends PartialType(
  OmitType(CreateAttributeDto, ['key', 'category', 'type'] as const),
) {
  @ApiProperty({
    description: 'Whether the attribute is a system attribute',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}