#!/bin/bash

# Скрипт для удобной работы с базой данных PostgreSQL
# Предоставляет функции для бэкапа, восстановления и сброса данных

set -e

# Константы
DB_CONTAINER="happyness-postgres"
DB_USER="postgres"
DB_NAME="happyness"
BACKUP_DIR="./docker/postgres/backups"

# Создание директории для бэкапов, если она не существует
mkdir -p "$BACKUP_DIR"

# Функция для вывода помощи
show_help() {
  echo "Использование: ./db-utils.sh [КОМАНДА]"
  echo ""
  echo "Команды:"
  echo "  backup        Создать резервную копию базы данных"
  echo "  restore FILE  Восстановить базу данных из бэкапа"
  echo "  reset         Сбросить базу данных и применить миграции"
  echo "  migrations    Создать и применить новую миграцию"
  echo "  seed          Заполнить базу тестовыми данными"
  echo "  help          Показать эту справку"
  echo ""
}

# Функция для создания бэкапа
backup_db() {
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="$BACKUP_DIR/happyness_$TIMESTAMP.sql"
  
  echo "📦 Создание резервной копии базы данных..."
  docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
  
  if [ $? -eq 0 ]; then
    echo "✅ Бэкап успешно создан: $BACKUP_FILE"
  else
    echo "❌ Ошибка при создании бэкапа"
    exit 1
  fi
}

# Функция для восстановления из бэкапа
restore_db() {
  if [ -z "$1" ]; then
    echo "❌ Не указан файл бэкапа"
    echo "Использование: ./db-utils.sh restore FILE"
    exit 1
  fi
  
  BACKUP_FILE="$1"
  
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Файл бэкапа не найден: $BACKUP_FILE"
    exit 1
  fi
  
  echo "⚠️ Внимание! Это действие перезапишет все данные в базе $DB_NAME"
  read -p "Вы уверены, что хотите продолжить? [y/N] " -n 1 -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Операция отменена"
    exit 0
  fi
  
  echo "🔄 Восстановление базы данных из бэкапа..."
  
  # Сбрасываем соединения и пересоздаем базу
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
  
  # Восстанавливаем из бэкапа
  cat "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
  
  if [ $? -eq 0 ]; then
    echo "✅ База данных успешно восстановлена из бэкапа"
  else
    echo "❌ Ошибка при восстановлении базы данных"
    exit 1
  fi
}

# Функция для сброса базы и применения миграций
reset_db() {
  echo "⚠️ Внимание! Это действие удалит все данные в базе $DB_NAME и применит миграции заново"
  read -p "Вы уверены, что хотите продолжить? [y/N] " -n 1 -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Операция отменена"
    exit 0
  fi
  
  echo "🔄 Сброс базы данных и применение миграций..."
  npm run docker:db:reset
  
  if [ $? -eq 0 ]; then
    echo "✅ База данных успешно сброшена и миграции применены"
  else
    echo "❌ Ошибка при сбросе базы данных"
    exit 1
  fi
}

# Функция для создания и применения новой миграции
create_migration() {
  echo "📝 Введите название новой миграции (например, add_user_roles):"
  read -r MIGRATION_NAME
  
  if [ -z "$MIGRATION_NAME" ]; then
    echo "❌ Название миграции не может быть пустым"
    exit 1
  fi
  
  echo "🔄 Создание и применение миграции '$MIGRATION_NAME'..."
  docker-compose exec backend npx prisma migrate dev --name "$MIGRATION_NAME"
  
  if [ $? -eq 0 ]; then
    echo "✅ Миграция успешно создана и применена"
  else
    echo "❌ Ошибка при создании миграции"
    exit 1
  fi
}

# Функция для заполнения базы тестовыми данными
seed_db() {
  echo "🌱 Заполнение базы тестовыми данными..."
  npm run docker:db:seed
  
  if [ $? -eq 0 ]; then
    echo "✅ Тестовые данные успешно добавлены"
  else
    echo "❌ Ошибка при заполнении базы данными"
    exit 1
  fi
}

# Обработка команд
case "$1" in
  backup)
    backup_db
    ;;
  restore)
    restore_db "$2"
    ;;
  reset)
    reset_db
    ;;
  migrations)
    create_migration
    ;;
  seed)
    seed_db
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    show_help
    exit 1
    ;;
esac

exit 0 