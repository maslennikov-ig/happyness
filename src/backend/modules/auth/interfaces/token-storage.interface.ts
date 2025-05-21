/**
 * Интерфейс для хранилища токенов
 *
 * Определяет общий API для различных реализаций хранения токенов:
 * в памяти, в базе данных, в Redis и т.д.
 */
export interface ITokenStorage {
  /**
   * Сохраняет refresh токен в хранилище
   *
   * @param userId ID пользователя
   * @param refreshToken Refresh токен
   * @param expiresAt Дата истечения токена
   */
  saveRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<void>;

  /**
   * Находит и проверяет refresh токен
   *
   * @param refreshToken Refresh токен для проверки
   * @returns Информация о токене и пользователе или null
   */
  findRefreshToken(refreshToken: string): Promise<any>;

  /**
   * Проверяет, нужно ли ротировать токен на основе количества использований
   *
   * @param usageCount Количество использований токена
   * @returns true, если требуется ротация
   */
  needsRotation(usageCount: number): boolean;

  /**
   * Увеличивает счетчик использований токена
   *
   * @param tokenId ID токена
   * @returns Новое значение счетчика
   */
  incrementUsageCount(tokenId: string): Promise<number>;

  /**
   * Отзывает refresh токен, делая его недействительным
   *
   * @param refreshToken Токен для отзыва
   */
  revokeRefreshToken(refreshToken: string): Promise<void>;

  /**
   * Отзывает все токены пользователя
   *
   * @param userId ID пользователя
   */
  revokeAllUserTokens(userId: string): Promise<void>;

  /**
   * Очищает истекшие токены
   */
  cleanupExpiredTokens(): Promise<void>;
}
