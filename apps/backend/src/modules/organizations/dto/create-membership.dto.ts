import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@saas-template/shared';

export class CreateMembershipDto {
  @ApiProperty({
    description: 'User ID to add as member',
    example: 'user-123',
  })
  @IsString()
  userId: string;

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
}
