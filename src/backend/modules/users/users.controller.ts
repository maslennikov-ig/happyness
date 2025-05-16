import { Controller, Get, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Получение списка всех пользователей' })
  @ApiResponse({ status: 200, description: 'Список пользователей успешно получен' })
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(user => {
      const { password, ...result } = user;
      return result;
    });
  }

  @ApiOperation({ summary: 'Получение пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  @ApiOperation({ summary: 'Обновление данных пользователя' })
  @ApiResponse({ status: 200, description: 'Данные пользователя успешно обновлены' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    const { password, ...result } = updatedUser;
    return result;
  }

  @ApiOperation({ summary: 'Удаление пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deletedUser = await this.usersService.remove(id);
    const { password, ...result } = deletedUser;
    return result;
  }
} 