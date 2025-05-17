import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { User } from '@/backend/types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  /**
   * Валидация пользователя для локальной стратегии
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await this.comparePasswords(password, user.password))) {
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

    return {
      user,
      token: this.generateToken(user),
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

    // Хеширование пароля
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Создание пользователя
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Исключаем пароль из ответа
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = newUser;

    return {
      user,
      token: this.generateToken(user),
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
   * Генерация JWT токена
   */
  private generateToken(user: Partial<User>) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Хеширование пароля
   */
  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3, // 3 итерации
      parallelism: 1, // 1 поток
    });
  }

  /**
   * Сравнение паролей
   */
  private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return argon2.verify(hashedPassword, plainPassword);
  }
}
