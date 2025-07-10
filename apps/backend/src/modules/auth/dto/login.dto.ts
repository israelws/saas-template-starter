import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address',
    required: true 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'StrongPassword123!',
    description: 'User password',
    required: true,
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}