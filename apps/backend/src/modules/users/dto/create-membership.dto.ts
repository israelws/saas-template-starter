import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@saas-template/shared';

export class CreateMembershipDto {
  @ApiProperty({
    description: 'Organization ID to add user to',
    example: 'org-123',
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    description: 'Role for the user in the organization',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Optional permissions array',
    required: false,
    example: ['read', 'write'],
  })
  @IsOptional()
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({
    description: 'Whether the membership is active',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
