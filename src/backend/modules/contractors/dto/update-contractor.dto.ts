import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateContractorDto {
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
    required: false,
  })
  @IsArray({ message: 'Услуги должны быть массивом' })
  @IsString({ each: true, message: 'Каждая услуга должна быть строкой' })
  @IsOptional()
  services?: string[];

  @ApiProperty({
    description: 'Верифицирован ли подрядчик',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'Статус верификации должен быть булевым значением' })
  @IsOptional()
  verified?: boolean;
}
