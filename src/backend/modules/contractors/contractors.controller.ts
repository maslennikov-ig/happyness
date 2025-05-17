import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contractors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @ApiOperation({ summary: 'Создание нового профиля подрядчика' })
  @ApiResponse({ status: 201, description: 'Профиль подрядчика успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @Post()
  async create(@Body() createContractorDto: CreateContractorDto) {
    return this.contractorsService.create(createContractorDto);
  }

  @ApiOperation({ summary: 'Получение всех подрядчиков' })
  @ApiResponse({ status: 200, description: 'Список подрядчиков' })
  @Get()
  async findAll(@Query('verified') verified?: boolean) {
    return this.contractorsService.findAll(verified);
  }

  @ApiOperation({ summary: 'Получение подрядчика по ID' })
  @ApiResponse({ status: 200, description: 'Подрядчик успешно найден' })
  @ApiResponse({ status: 404, description: 'Подрядчик не найден' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновление подрядчика' })
  @ApiResponse({ status: 200, description: 'Подрядчик успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Подрядчик не найден' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateContractorDto: UpdateContractorDto) {
    return this.contractorsService.update(id, updateContractorDto);
  }

  @ApiOperation({ summary: 'Удаление подрядчика' })
  @ApiResponse({ status: 200, description: 'Подрядчик успешно удален' })
  @ApiResponse({ status: 404, description: 'Подрядчик не найден' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.contractorsService.remove(id);
  }
}
