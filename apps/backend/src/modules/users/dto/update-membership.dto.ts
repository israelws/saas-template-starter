import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@saas-template/shared';

export class UpdateMembershipDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Updated permissions array',
    required: false,
    example: ['read', 'write', 'delete'],
  })
  @IsOptional()
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({
    description: 'Whether the membership is active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}