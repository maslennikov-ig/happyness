import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@/backend/types';

export class RegisterDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  password: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
    required: false,
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    default: UserRole.ENTREPRENEUR,
  })
  @IsEnum(UserRole, { message: 'Недопустимая роль пользователя' })
  @IsOptional()
  role?: UserRole = UserRole.ENTREPRENEUR;
}
