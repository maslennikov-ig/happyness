import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private tokenService: TokenService
  ) {}

  /**
   * Валидация пользователя для локальной стратегии
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await this.passwordService.verify(user.password, password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  /**
   * Вход пользователя
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Обновляем дату последнего входа
    await this.usersService.update(user.id, { lastLoginAt: new Date() });

    // Генерируем токены доступа и обновления
    const tokens = this.tokenService.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Регистрация нового пользователя
   */
  async register(registerDto: RegisterDto) {
    // Проверка, существует ли пользователь с таким email
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new UnauthorizedException('Пользователь с таким email уже существует');
    }

    // Проверка надежности пароля
    const userInputs = [registerDto.email, registerDto.name].filter(Boolean);
    if (!this.passwordService.isPasswordStrong(registerDto.password, userInputs)) {
      const { feedback } = this.passwordService.checkPasswordStrength(
        registerDto.password,
        userInputs
      );
      throw new BadRequestException(`Пароль недостаточно надежный. ${feedback}`);
    }

    // Хеширование пароля
    const hashedPassword = await this.passwordService.hash(registerDto.password);

    // Создание пользователя
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Исключаем пароль из ответа
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = newUser;

    // Генерируем токены доступа и обновления
    const tokens = this.tokenService.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Получение текущего пользователя по токену
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  /**
   * Выход из системы
   * В будущем здесь можно добавить инвалидацию токенов через blacklist
   */
  async logout(userId: string) {
    // В будущем здесь будет логика для инвалидации токенов пользователя
    console.warn(`Выход пользователя с ID: ${userId}`);
    return { success: true };
  }

  /**
   * Обновление токена доступа
   */
  async refreshToken(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Недействительный refresh токен');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь не существует или деактивирован');
    }

    // Генерируем новую пару токенов
    const tokens = this.tokenService.generateTokens(user);

    return tokens;
  }

  /**
   * Изменение пароля пользователя
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isPasswordValid = await this.passwordService.verify(user.password, currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    // Проверка надежности нового пароля
    const userInputs = [user.email, user.name].filter(Boolean);
    if (!this.passwordService.isPasswordStrong(newPassword, userInputs)) {
      const { feedback } = this.passwordService.checkPasswordStrength(newPassword, userInputs);
      throw new BadRequestException(`Пароль недостаточно надежный. ${feedback}`);
    }

    // Хеширование нового пароля
    const hashedPassword = await this.passwordService.hash(newPassword);

    // Обновляем пароль пользователя
    await this.usersService.update(userId, { password: hashedPassword });

    return { success: true };
  }
}
