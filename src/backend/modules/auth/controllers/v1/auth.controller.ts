import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthService } from '../../auth.service';
import { RegisterDto } from '../../dto/register.dto';
import { RegisterRequestDto } from '../../dto/register-request.dto';
import { RegisterEntrepreneurDto } from '../../dto/register-entrepreneur.dto';
import { RegisterEmployeeDto } from '../../dto/register-employee.dto';
import { LoginDto } from '../../dto/login.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../guards/roles.guard';
import { UserRole, VerificationType } from '@/backend/types';
import { CookieService } from '../../services/cookie.service';
import { FingerprintService } from '../../services/fingerprint.service';
import { InvitationsService } from '../../../users/invitations.service';
import { ProfilesService } from '../../../users/profiles.service';
import { VerificationService } from '../../../users/verification.service';
import { EmailService } from '../../../users/email.service';
import { Public } from '../../decorators/public.decorator';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly fingerprintService: FingerprintService,
    private readonly invitationsService: InvitationsService,
    private readonly profilesService: ProfilesService,
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService
  ) {}

  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован' })
  @ApiResponse({ status: 400, description: 'Пользователь с таким email уже существует' })
  @ApiCookieAuth()
  @Public()
  @Post('register')
  async register(
    @Body() registerRequestDto: RegisterRequestDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ): Promise<any> {
    // Создаем отпечаток клиента на основе запроса
    const fingerprint = this.fingerprintService.generateFingerprintFromRequest(req);

    // Проверяем, если указан код приглашения для сотрудника компании
    if (registerRequestDto.invitationCode) {
      // Проверяем валидность кода приглашения
      const invitation = await this.invitationsService.validateInvitation(
        registerRequestDto.invitationCode
      );

      if (!invitation) {
        throw new BadRequestException('Недействительный код приглашения');
      }

      // Устанавливаем роль из приглашения
      registerRequestDto.role = invitation.role as UserRole;

      // Отмечаем приглашение как использованное
      await this.invitationsService.useInvitation(registerRequestDto.invitationCode);
    }

    // Преобразуем DTO запроса в DTO регистрации
    const registerDto: RegisterDto = {
      email: registerRequestDto.email,
      password: registerRequestDto.password,
      name: registerRequestDto.name,
      role: registerRequestDto.role,
      phone: registerRequestDto.phone,
    };

    // Регистрируем пользователя и получаем токены
    const result = await this.authService.register(registerDto, fingerprint, req);

    // Создаем профиль пользователя в зависимости от роли
    try {
      if (result.user.role === UserRole.ENTREPRENEUR) {
        // Если это предприниматель, создаем профиль предпринимателя
        if (registerRequestDto instanceof RegisterEntrepreneurDto) {
          const { email, password, name, role, phone, ...profileData } = registerRequestDto;
          await this.profilesService.createEntrepreneurProfile(result.user.id, profileData);
        } else {
          // Создаем пустой профиль предпринимателя
          await this.profilesService.createEntrepreneurProfile(result.user.id, {});
        }
      } else if (result.user.role === UserRole.COMPANY_EMPLOYEE) {
        // Если это сотрудник компании, создаем профиль сотрудника
        if (registerRequestDto instanceof RegisterEmployeeDto) {
          const { email, password, name, role, phone, invitationCode, ...profileData } =
            registerRequestDto;
          await this.profilesService.createEmployeeProfile(result.user.id, {
            ...profileData,
            invitationCode: registerRequestDto.invitationCode,
          });
        } else {
          // Создаем профиль сотрудника с кодом приглашения
          await this.profilesService.createEmployeeProfile(result.user.id, {
            invitationCode: registerRequestDto.invitationCode,
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при создании профиля:', error);
      // Продолжаем выполнение, даже если не удалось создать профиль
    }

    // Создаем токен верификации email
    try {
      const verificationToken = await this.verificationService.createVerificationToken(
        result.user.id,
        VerificationType.EMAIL_VERIFICATION,
        24 // Срок действия 24 часа
      );

      // Отправляем письмо для верификации email
      await this.emailService.sendVerificationEmail(
        result.user.email,
        result.user.name || 'пользователь',
        verificationToken.token
      );
    } catch (error) {
      console.error('Ошибка при отправке письма для верификации:', error);
      // Продолжаем выполнение, даже если не удалось отправить письмо
    }

    // Устанавливаем refresh токен в HttpOnly куки
    this.cookieService.setRefreshTokenCookie(res, result.refreshToken, result.refreshExpiresIn);

    // Не возвращаем refresh токен в теле ответа для большей безопасности
    const { refreshToken, ...responseData } = result;

    return responseData;
  }

  @ApiOperation({ summary: 'Регистрация нового предпринимателя' })
  @ApiResponse({ status: 201, description: 'Предприниматель успешно зарегистрирован' })
  @ApiResponse({ status: 400, description: 'Пользователь с таким email уже существует' })
  @ApiCookieAuth()
  @Public()
  @Post('register/entrepreneur')
  async registerEntrepreneur(
    @Body() registerDto: RegisterEntrepreneurDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ): Promise<any> {
    // Устанавливаем роль предпринимателя
    registerDto.role = UserRole.ENTREPRENEUR;

    // Используем общий метод регистрации
    return this.register(registerDto, req, res);
  }

  @ApiOperation({ summary: 'Регистрация нового сотрудника компании' })
  @ApiResponse({ status: 201, description: 'Сотрудник компании успешно зарегистрирован' })
  @ApiResponse({
    status: 400,
    description: 'Пользователь с таким email уже существует или недействительный код приглашения',
  })
  @ApiCookieAuth()
  @Public()
  @Post('register/employee')
  async registerEmployee(
    @Body() registerDto: RegisterEmployeeDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ): Promise<any> {
    // Проверяем валидность кода приглашения
    const invitation = await this.invitationsService.validateInvitation(registerDto.invitationCode);

    if (!invitation) {
      throw new BadRequestException('Недействительный код приглашения');
    }

    // Устанавливаем роль сотрудника компании
    registerDto.role = UserRole.COMPANY_EMPLOYEE;

    // Используем общий метод регистрации
    return this.register(registerDto, req, res);
  }

  @ApiOperation({ summary: 'Вход пользователя' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
  @ApiCookieAuth()
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ): Promise<any> {
    // Получаем отпечаток клиента
    const fingerprint = this.fingerprintService.generateFingerprintFromRequest(req);

    // Аутентифицируем пользователя и получаем токены
    // Используем loginDto вместо req.user, так как req.user не соответствует типу LoginDto
    const result = await this.authService.login(req.user as any, fingerprint, req);

    // Устанавливаем refresh токен в HttpOnly куки
    this.cookieService.setRefreshTokenCookie(res, result.refreshToken, result.refreshExpiresIn);

    // Не возвращаем refresh токен в теле ответа для большей безопасности
    const { refreshToken, ...responseData } = result;

    return responseData;
  }

  @ApiOperation({ summary: 'Выход пользователя' })
  @ApiResponse({ status: 200, description: 'Успешный выход' })
  @ApiCookieAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ): Promise<{ success: boolean }> {
    // Получаем refresh токен из куки
    const refreshToken = req.cookies['refresh_token'];

    if (refreshToken) {
      // Инвалидируем refresh токен
      await this.authService.logout(refreshToken);
    }

    // Удаляем куки с refresh токеном
    this.cookieService.clearRefreshTokenCookie(res);

    return { success: true };
  }

  @ApiOperation({ summary: 'Обновление токенов доступа' })
  @ApiResponse({ status: 200, description: 'Токены успешно обновлены' })
  @ApiResponse({ status: 401, description: 'Недействительный refresh токен' })
  @ApiCookieAuth()
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ): Promise<any> {
    // Получаем refresh токен из куки или из тела запроса
    const refreshToken = req.cookies['refresh_token'] || refreshTokenDto.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh токен не предоставлен');
    }

    // Получаем отпечаток клиента
    const fingerprint = this.fingerprintService.generateFingerprintFromRequest(req);

    // Обновляем токены
    // Используем метод refreshToken вместо refresh, который не существует в AuthService
    const result = await this.authService.refreshToken(refreshToken, fingerprint, req);

    // Устанавливаем новый refresh токен в HttpOnly куки
    this.cookieService.setRefreshTokenCookie(res, result.refreshToken, result.refreshExpiresIn);

    // Не возвращаем refresh токен в теле ответа для большей безопасности
    const { refreshToken: newRefreshToken, ...responseData } = result;

    return responseData;
  }

  @ApiOperation({ summary: 'Получение профиля текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль успешно получен' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: ExpressRequest): Promise<any> {
    // Получаем профиль пользователя через сервис профилей
    // Так как в AuthService нет метода getProfile или findById
    const userId = (req.user as any).id || (req.user as any).sub;
    return this.profilesService.getUserProfile(userId, (req.user as any).role);
  }

  @ApiOperation({ summary: 'Смена пароля пользователя' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({ status: 400, description: 'Неверный текущий пароль' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: ExpressRequest
  ): Promise<{ success: boolean }> {
    await this.authService.changePassword(
      (req.user as any).id || (req.user as any).sub, // Используем приведение типов для доступа к id или sub
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );

    return { success: true };
  }
}
