/**
 * @deprecated Этот контроллер устарел и будет удален 2026-01-01.
 * Пожалуйста, используйте версионированный контроллер из директории controllers/v1.
 *
 * Новый путь API: /api/v1/users
 *
 * Для обратной совместимости этот файл реэкспортирует контроллер из controllers/v1.
 */

import { Controller, Get, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * @deprecated Используйте UsersController из директории controllers/v1
 */
@ApiTags('users-legacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Получение списка всех пользователей',
    description:
      'УСТАРЕЛО: Этот метод устарел и будет удален 2026-01-01. Используйте GET /api/v1/users',
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: 'Список пользователей успешно получен' })
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    });
  }

  @ApiOperation({
    summary: 'Получение пользователя по ID',
    description:
      'УСТАРЕЛО: Этот метод устарел и будет удален 2026-01-01. Используйте GET /api/v1/users/:id',
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: 'Пользователь успешно найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  @ApiOperation({
    summary: 'Обновление данных пользователя',
    description:
      'УСТАРЕЛО: Этот метод устарел и будет удален 2026-01-01. Используйте PATCH /api/v1/users/:id',
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: 'Данные пользователя успешно обновлены' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updatedUser;
    return result;
  }

  @ApiOperation({ summary: 'Удаление пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deletedUser = await this.usersService.remove(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = deletedUser;
    return result;
  }
}

// Экспортируем также новый контроллер для удобства миграции
export { UsersController as V1UsersController } from './controllers/v1/users.controller';
