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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectStatus } from '@/backend/types';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Создание нового проекта' })
  @ApiResponse({ status: 201, description: 'Проект успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @ApiOperation({ summary: 'Получение всех проектов' })
  @ApiResponse({ status: 200, description: 'Список проектов' })
  @Get()
  async findAll(@Query('status') status?: ProjectStatus) {
    return this.projectsService.findAll(status);
  }

  @ApiOperation({ summary: 'Получение проекта по ID' })
  @ApiResponse({ status: 200, description: 'Проект успешно найден' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновление проекта' })
  @ApiResponse({ status: 200, description: 'Проект успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @ApiOperation({ summary: 'Удаление проекта' })
  @ApiResponse({ status: 200, description: 'Проект успешно удален' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
