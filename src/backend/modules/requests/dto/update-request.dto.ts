import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { RequestStatus } from '@/backend/types';

export class UpdateRequestDto {
  @ApiProperty({
    description: 'Название запроса',
    example: 'Разработка лендинга',
    required: false,
  })
  @IsString({ message: 'Название должно быть строкой' })
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Описание запроса',
    example: 'Необходимо разработать лендинг для продукта',
    required: false,
  })
  @IsString({ message: 'Описание должно быть строкой' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Статус запроса',
    enum: RequestStatus,
    required: false,
  })
  @IsEnum(RequestStatus, { message: 'Недопустимый статус запроса' })
  @IsOptional()
  status?: RequestStatus;

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
