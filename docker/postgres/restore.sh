#!/bin/bash

# Скрипт для восстановления базы данных PostgreSQL из резервной копии

# Проверка наличия аргумента с путем к файлу бэкапа
if [ "$#" -ne 1 ]; then
    echo "Использование: $0 <путь_к_файлу_бэкапа>"
    echo "Пример: $0 /backups/happyness_2023-01-01_12-00-00.sql"
    exit 1
fi

# Переменные
BACKUP_FILE=$1
DB_NAME="happyness"
DB_USER="postgres"

# Проверка существования файла бэкапа
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Ошибка: Файл бэкапа не найден: $BACKUP_FILE"
    exit 1
fi

# Подтверждение восстановления
echo "ВНИМАНИЕ: Восстановление удалит все текущие данные в базе $DB_NAME!"
read -p "Вы уверены, что хотите продолжить? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Восстановление отменено."
    exit 1
fi

# Восстановление базы данных
echo "Восстановление базы данных $DB_NAME из файла $BACKUP_FILE..."

# Пересоздание базы данных
psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# Восстановление из бэкапа
pg_restore -U $DB_USER -d $DB_NAME -v $BACKUP_FILE

# Проверка успешности выполнения
if [ $? -eq 0 ]; then
    echo "Восстановление базы данных успешно завершено!"
else
    echo "Ошибка при восстановлении базы данных"
    exit 1
fi 