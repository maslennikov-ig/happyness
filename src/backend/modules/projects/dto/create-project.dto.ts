import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Название проекта',
    example: 'Разработка мобильного приложения',
  })
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название не может быть пустым' })
  title: string;

  @ApiProperty({
    description: 'Описание проекта',
    example: 'Создание мобильного приложения для iOS и Android',
    required: false,
  })
  @IsString({ message: 'Описание должно быть строкой' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Бюджет проекта',
    example: 10000,
    required: false,
  })
  @IsNumber({}, { message: 'Бюджет должен быть числом' })
  @Min(0, { message: 'Бюджет не может быть отрицательным' })
  @IsOptional()
  budget?: number;

  @ApiProperty({
    description: 'Дата начала проекта',
    example: '2023-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Некорректный формат даты начала' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Дата окончания проекта',
    example: '2023-12-31T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Некорректный формат даты окончания' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'ID владельца проекта',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID владельца должен быть в формате UUID' })
  @IsNotEmpty({ message: 'ID владельца не может быть пустым' })
  ownerId: string;
}
