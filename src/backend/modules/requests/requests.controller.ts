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
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequestStatus } from '@/backend/types';

@ApiTags('requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiOperation({ summary: 'Создание нового запроса' })
  @ApiResponse({ status: 201, description: 'Запрос успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @Post()
  async create(@Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(createRequestDto);
  }

  @ApiOperation({ summary: 'Получение всех запросов' })
  @ApiResponse({ status: 200, description: 'Список запросов' })
  @Get()
  async findAll(@Query('status') status?: RequestStatus) {
    return this.requestsService.findAll(status);
  }

  @ApiOperation({ summary: 'Получение запроса по ID' })
  @ApiResponse({ status: 200, description: 'Запрос успешно найден' })
  @ApiResponse({ status: 404, description: 'Запрос не найден' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновление запроса' })
  @ApiResponse({ status: 200, description: 'Запрос успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Запрос не найден' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
    return this.requestsService.update(id, updateRequestDto);
  }

  @ApiOperation({ summary: 'Удаление запроса' })
  @ApiResponse({ status: 200, description: 'Запрос успешно удален' })
  @ApiResponse({ status: 404, description: 'Запрос не найден' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.requestsService.remove(id);
  }
}
