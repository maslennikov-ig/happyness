#!/bin/bash

# Скрипт для очистки кеша Redis

# Проверка наличия аргумента с паттерном ключей
if [ "$#" -eq 0 ]; then
    echo "Использование: $0 [паттерн_ключей | --all]"
    echo "Примеры:"
    echo "  $0 \"user:*\"      # Очистить все ключи, начинающиеся с 'user:'"
    echo "  $0 \"session:*\"   # Очистить все ключи, начинающиеся с 'session:'"
    echo "  $0 --all          # Очистить весь кеш"
    exit 1
fi

# Переменные
REDIS_HOST=${REDIS_HOST:-"localhost"}
REDIS_PORT=${REDIS_PORT:-"6379"}
REDIS_PASSWORD=${REDIS_PASSWORD:-""}

# Функция для выполнения команды Redis
execute_redis_command() {
    if [ -z "$REDIS_PASSWORD" ]; then
        redis-cli -h $REDIS_HOST -p $REDIS_PORT $@
    else
        redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD $@
    fi
}

# Очистка кеша
if [ "$1" == "--all" ]; then
    echo "Очистка всего кеша Redis..."
    execute_redis_command FLUSHALL
    
    # Проверка успешности выполнения
    if [ $? -eq 0 ]; then
        echo "Кеш Redis успешно очищен!"
    else
        echo "Ошибка при очистке кеша Redis"
        exit 1
    fi
else
    PATTERN=$1
    echo "Поиск ключей по паттерну: $PATTERN"
    
    # Получение списка ключей
    KEYS=$(execute_redis_command --raw KEYS "$PATTERN")
    
    # Проверка наличия ключей
    if [ -z "$KEYS" ]; then
        echo "Ключи по паттерну '$PATTERN' не найдены"
        exit 0
    fi
    
    # Подсчет количества ключей
    KEY_COUNT=$(echo "$KEYS" | wc -l)
    echo "Найдено ключей: $KEY_COUNT"
    
    # Подтверждение удаления
    read -p "Вы уверены, что хотите удалить эти ключи? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Операция отменена."
        exit 1
    fi
    
    # Удаление ключей
    echo "Удаление ключей..."
    echo "$KEYS" | while read -r key; do
        if [ ! -z "$key" ]; then
            execute_redis_command DEL "$key"
            echo "Удален ключ: $key"
        fi
    done
    
    echo "Операция завершена. Удалено ключей: $KEY_COUNT"
fi 