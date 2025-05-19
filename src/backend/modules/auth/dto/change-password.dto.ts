import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль пользователя',
    example: 'currentPassword123',
  })
  @IsString({ message: 'Текущий пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Текущий пароль обязателен' })
  currentPassword: string;

  @ApiProperty({
    description: 'Новый пароль пользователя',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString({ message: 'Новый пароль должен быть строкой' })
  @MinLength(6, { message: 'Новый пароль должен содержать минимум 6 символов' })
  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  newPassword: string;
}
