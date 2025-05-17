import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@/backend/types';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
    required: false,
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'password123',
    minLength: 6,
    required: false,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    required: false,
  })
  @IsEnum(UserRole, { message: 'Недопустимая роль пользователя' })
  @IsOptional()
  role?: UserRole;
}
