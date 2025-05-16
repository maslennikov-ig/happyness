#!/bin/bash

# Скрипт для создания резервной копии базы данных PostgreSQL

# Переменные
DB_NAME="happyness"
DB_USER="postgres"
BACKUP_DIR="/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# Создание директории для бэкапов, если она не существует
mkdir -p $BACKUP_DIR

# Создание резервной копии
echo "Создание резервной копии базы данных $DB_NAME..."
pg_dump -U $DB_USER -d $DB_NAME -F c -b -v -f $BACKUP_FILE

# Проверка успешности выполнения
if [ $? -eq 0 ]; then
  echo "Резервное копирование успешно завершено: $BACKUP_FILE"
  # Удаление старых бэкапов (оставляем последние 7)
  find $BACKUP_DIR -name "${DB_NAME}_*.sql" -type f -mtime +7 -delete
  echo "Старые резервные копии (старше 7 дней) удалены"
else
  echo "Ошибка при создании резервной копии"
  exit 1
fi 