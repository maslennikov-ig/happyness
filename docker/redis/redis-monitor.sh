#!/bin/bash

# Скрипт для мониторинга Redis

# Переменные
REDIS_HOST=${REDIS_HOST:-"localhost"}
REDIS_PORT=${REDIS_PORT:-"6379"}
REDIS_PASSWORD=${REDIS_PASSWORD:-""}
INTERVAL=${INTERVAL:-5}

# Функция для выполнения команды Redis
execute_redis_command() {
    if [ -z "$REDIS_PASSWORD" ]; then
        redis-cli -h $REDIS_HOST -p $REDIS_PORT $@
    else
        redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD $@
    fi
}

# Функция для получения информации о памяти
get_memory_info() {
    local info=$(execute_redis_command INFO memory)
    local used_memory=$(echo "$info" | grep "used_memory_human:" | cut -d ":" -f2 | tr -d "\r")
    local used_memory_peak=$(echo "$info" | grep "used_memory_peak_human:" | cut -d ":" -f2 | tr -d "\r")
    local used_memory_rss=$(echo "$info" | grep "used_memory_rss_human:" | cut -d ":" -f2 | tr -d "\r")
    
    echo "Использование памяти:"
    echo "  Используется: $used_memory"
    echo "  Пиковое использование: $used_memory_peak"
    echo "  RSS: $used_memory_rss"
}

# Функция для получения статистики клиентов
get_client_info() {
    local info=$(execute_redis_command INFO clients)
    local connected_clients=$(echo "$info" | grep "connected_clients:" | cut -d ":" -f2 | tr -d "\r")
    local blocked_clients=$(echo "$info" | grep "blocked_clients:" | cut -d ":" -f2 | tr -d "\r")
    
    echo "Клиенты:"
    echo "  Подключено: $connected_clients"
    echo "  Заблокировано: $blocked_clients"
}

# Функция для получения статистики операций
get_stats_info() {
    local info=$(execute_redis_command INFO stats)
    local total_commands_processed=$(echo "$info" | grep "total_commands_processed:" | cut -d ":" -f2 | tr -d "\r")
    local instantaneous_ops_per_sec=$(echo "$info" | grep "instantaneous_ops_per_sec:" | cut -d ":" -f2 | tr -d "\r")
    local keyspace_hits=$(echo "$info" | grep "keyspace_hits:" | cut -d ":" -f2 | tr -d "\r")
    local keyspace_misses=$(echo "$info" | grep "keyspace_misses:" | cut -d ":" -f2 | tr -d "\r")
    
    # Расчет соотношения попаданий в кеш
    if [ "$keyspace_hits" -eq 0 ] && [ "$keyspace_misses" -eq 0 ]; then
        hit_rate="N/A"
    else
        hit_rate=$(echo "scale=2; $keyspace_hits * 100 / ($keyspace_hits + $keyspace_misses)" | bc)
        hit_rate="${hit_rate}%"
    fi
    
    echo "Статистика операций:"
    echo "  Всего команд обработано: $total_commands_processed"
    echo "  Операций в секунду: $instantaneous_ops_per_sec"
    echo "  Попаданий в кеш: $keyspace_hits"
    echo "  Промахов кеша: $keyspace_misses"
    echo "  Эффективность кеша: $hit_rate"
}

# Функция для получения информации о базах данных
get_keyspace_info() {
    local info=$(execute_redis_command INFO keyspace)
    
    echo "Информация о базах данных:"
    echo "$info" | grep "db" | while read -r line; do
        if [ ! -z "$line" ]; then
            echo "  $line" | tr -d "\r"
        fi
    done
}

# Функция для отображения всей информации
show_info() {
    clear
    echo "=== Мониторинг Redis ($REDIS_HOST:$REDIS_PORT) ==="
    echo "Время: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    
    # Проверка соединения
    if ! execute_redis_command PING > /dev/null; then
        echo "ОШИБКА: Не удалось подключиться к Redis-серверу!"
        return 1
    fi
    
    get_memory_info
    echo
    get_client_info
    echo
    get_stats_info
    echo
    get_keyspace_info
    
    echo
    echo "Нажмите Ctrl+C для выхода"
}

# Основной цикл
echo "Запуск мониторинга Redis ($REDIS_HOST:$REDIS_PORT) с интервалом $INTERVAL секунд"
echo "Нажмите Ctrl+C для выхода"

while true; do
    show_info
    sleep $INTERVAL
done 