import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContractorDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID пользователя должен быть в формате UUID' })
  @IsNotEmpty({ message: 'ID пользователя не может быть пустым' })
  userId: string;

  @ApiProperty({
    description: 'Название компании',
    example: 'ООО "Разработчик"',
    required: false,
  })
  @IsString({ message: 'Название компании должно быть строкой' })
  @IsOptional()
  companyName?: string;

  @ApiProperty({
    description: 'Описание подрядчика',
    example: 'Разработка мобильных приложений и веб-сайтов',
    required: false,
  })
  @IsString({ message: 'Описание должно быть строкой' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Список предоставляемых услуг',
    example: ['Разработка мобильных приложений', 'Web-разработка'],
    type: [String],
  })
  @IsArray({ message: 'Услуги должны быть массивом' })
  @IsString({ each: true, message: 'Каждая услуга должна быть строкой' })
  @IsNotEmpty({ message: 'Список услуг не может быть пустым' })
  services: string[];

  @ApiProperty({
    description: 'Верифицирован ли подрядчик',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean({ message: 'Статус верификации должен быть булевым значением' })
  @IsOptional()
  verified?: boolean = false;
}
