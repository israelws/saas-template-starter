import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@saas-template/shared';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Email address to send invitation to',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Role for the invited user',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Optional custom message for the invitation',
    required: false,
    example: 'Welcome to our organization!',
  })
  @IsOptional()
  @IsString()
  message?: string;
}