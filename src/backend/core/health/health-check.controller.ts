import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { SystemHealthResult } from './health-check.interface';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Контроллер для API мониторинга здоровья системы
 */
@ApiTags('Мониторинг')
@Controller('health')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  /**
   * Получение статуса здоровья системы
   * @returns Результат проверки здоровья системы
   */
  @Get()
  @ApiOperation({ summary: 'Получение статуса здоровья системы' })
  @ApiResponse({
    status: 200,
    description: 'Статус здоровья системы успешно получен',
  })
  async getHealth(): Promise<SystemHealthResult> {
    return this.healthCheckService.checkHealth();
  }

  /**
   * Получение детального статуса здоровья системы (требует аутентификации)
   * @returns Результат проверки здоровья системы с детальной информацией
   */
  @Get('detailed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получение детального статуса здоровья системы (требует аутентификации)',
  })
  @ApiResponse({
    status: 200,
    description: 'Детальный статус здоровья системы успешно получен',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getDetailedHealth(): Promise<SystemHealthResult> {
    return this.healthCheckService.checkHealth();
  }
}
