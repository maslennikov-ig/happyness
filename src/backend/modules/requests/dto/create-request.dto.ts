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

export class CreateRequestDto {
  @ApiProperty({
    description: 'Название запроса',
    example: 'Разработка лендинга',
  })
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название не может быть пустым' })
  title: string;

  @ApiProperty({
    description: 'Описание запроса',
    example: 'Необходимо разработать лендинг для продукта',
  })
  @IsString({ message: 'Описание должно быть строкой' })
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  description: string;

  @ApiProperty({
    description: 'Бюджет запроса',
    example: 10000,
    required: false,
  })
  @IsNumber({}, { message: 'Бюджет должен быть числом' })
  @Min(0, { message: 'Бюджет не может быть отрицательным' })
  @IsOptional()
  budget?: number;

  @ApiProperty({
    description: 'Срок выполнения запроса',
    example: '2023-12-31T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Некорректный формат срока выполнения' })
  @IsOptional()
  deadline?: string;

  @ApiProperty({
    description: 'ID владельца запроса',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID владельца должен быть в формате UUID' })
  @IsNotEmpty({ message: 'ID владельца не может быть пустым' })
  ownerId: string;

  @ApiProperty({
    description: 'ID проекта, к которому относится запрос',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4', { message: 'ID проекта должен быть в формате UUID' })
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    description: 'ID подрядчика',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4', { message: 'ID подрядчика должен быть в формате UUID' })
  @IsOptional()
  contractorId?: string;
}
