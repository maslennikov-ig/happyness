import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './guards/roles.guard';
import { UserRole } from '../../types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован' })
  @ApiResponse({ status: 400, description: 'Пользователь с таким email уже существует' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Вход пользователя' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Получение данных текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Данные пользователя' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.sub);
  }

  @ApiOperation({ summary: 'Выход из системы' })
  @ApiResponse({ status: 200, description: 'Успешный выход из системы' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  @ApiOperation({ summary: 'Обновление токена доступа' })
  @ApiResponse({ status: 200, description: 'Токен успешно обновлен' })
  @ApiResponse({ status: 401, description: 'Недействительный refresh токен' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @ApiOperation({ summary: 'Изменение пароля пользователя' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован или неверный текущий пароль',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }

  @ApiOperation({ summary: 'Проверка токена доступа' })
  @ApiResponse({ status: 200, description: 'Токен действителен' })
  @ApiResponse({ status: 401, description: 'Токен недействителен или истек' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Request() req) {
    return { valid: true, user: req.user };
  }

  @ApiOperation({ summary: 'Тестовый эндпоинт для проверки ролей (только для администраторов)' })
  @ApiResponse({ status: 200, description: 'Доступ разрешен' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  async adminRoute() {
    return { message: 'Это защищенный маршрут для администраторов' };
  }
}
