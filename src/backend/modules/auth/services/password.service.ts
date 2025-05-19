import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as zxcvbn from 'zxcvbn';

@Injectable()
export class PasswordService {
  private memoryCost: number;
  private timeCost: number;
  private parallelism: number;
  private minPasswordStrength: number;

  constructor(private configService: ConfigService) {
    // Настройки аргон2 - значения по умолчанию, можно переопределить через .env
    this.memoryCost = configService.get<number>('ARGON2_MEMORY_COST') || 65536; // 64 MB
    this.timeCost = configService.get<number>('ARGON2_TIME_COST') || 3;
    this.parallelism = configService.get<number>('ARGON2_PARALLELISM') || 1;

    // Минимальная оценка сложности пароля (от 0 до 4)
    this.minPasswordStrength = configService.get<number>('MIN_PASSWORD_STRENGTH') || 2;
  }

  /**
   * Хеширование пароля с использованием argon2id
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id, // наиболее безопасный вариант
      memoryCost: this.memoryCost,
      timeCost: this.timeCost,
      parallelism: this.parallelism,
    });
  }

  /**
   * Проверка пароля
   */
  async verify(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hashedPassword, plainPassword);
  }

  /**
   * Проверка надёжности пароля с использованием библиотеки zxcvbn
   * Возвращает объект с оценкой (0-4) и сообщением с рекомендациями
   */
  checkPasswordStrength(
    password: string,
    userInputs: string[] = []
  ): { score: number; feedback: string } {
    const result = zxcvbn(password, userInputs);

    // Формируем обратную связь для пользователя
    let feedback = '';

    if (result.feedback.warning) {
      feedback += result.feedback.warning + '. ';
    }

    if (result.feedback.suggestions && result.feedback.suggestions.length > 0) {
      feedback += result.feedback.suggestions.join('. ');
    }

    return {
      score: result.score,
      feedback: feedback || 'Пароль соответствует требованиям безопасности',
    };
  }

  /**
   * Проверяет, удовлетворяет ли пароль минимальным требованиям
   */
  isPasswordStrong(password: string, userInputs: string[] = []): boolean {
    const { score } = this.checkPasswordStrength(password, userInputs);
    return score >= this.minPasswordStrength;
  }
}
