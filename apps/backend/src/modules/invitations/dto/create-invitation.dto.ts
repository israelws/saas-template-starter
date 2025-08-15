import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the person to invite',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the invitee',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the invitee',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization ID to invite the user to (optional for system-level invitations)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    example: 'member',
    description: 'Role ID to assign to the invited user',
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    example: { department: 'Engineering', team: 'Backend' },
    description: 'Additional metadata for the invitation',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
