import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateInvitationDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Invitation token from the email link',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
