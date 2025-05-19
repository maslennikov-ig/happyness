#!/bin/bash

# Скрипт для генерации самоподписанных SSL сертификатов для локальной разработки
# Используйте настоящие SSL сертификаты для продакшена!

set -e

echo "🔐 Генерация самоподписанных SSL сертификатов для локальной разработки"

# Проверка наличия OpenSSL
if ! command -v openssl &> /dev/null; then
    echo "❌ Ошибка: OpenSSL не установлен. Установите его перед запуском скрипта."
    exit 1
fi

# Директория для хранения сертификатов
CERT_DIR="$(dirname "$0")"
KEY_FILE="$CERT_DIR/server.key"
CSR_FILE="$CERT_DIR/server.csr"
CRT_FILE="$CERT_DIR/server.crt"

# Настройки для сертификата
COUNTRY="RU"
STATE="State"
LOCALITY="City"
ORGANIZATION="Happyness"
ORGANIZATIONAL_UNIT="Development"
COMMON_NAME="localhost"
EMAIL="admin@example.com"
DAYS=3650 # 10 лет

# Генерация приватного ключа
echo "📝 Генерация приватного ключа..."
openssl genrsa -out "$KEY_FILE" 2048

# Генерация CSR (Certificate Signing Request)
echo "📝 Генерация запроса на подпись сертификата (CSR)..."
openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$COMMON_NAME/emailAddress=$EMAIL"

# Генерация самоподписанного сертификата
echo "📝 Генерация самоподписанного сертификата..."
openssl x509 -req -days "$DAYS" -in "$CSR_FILE" -signkey "$KEY_FILE" -out "$CRT_FILE"

# Удаление временных файлов
echo "🧹 Удаление временных файлов..."
rm -f "$CSR_FILE"

# Установка правильных прав доступа
echo "🔒 Установка прав доступа..."
chmod 600 "$KEY_FILE"
chmod 644 "$CRT_FILE"

echo "✅ SSL сертификаты успешно сгенерированы!"
echo "   - Приватный ключ: $KEY_FILE"
echo "   - Сертификат: $CRT_FILE"
echo ""
echo "⚠️ Важно: Это самоподписанные сертификаты для разработки."
echo "   Используйте настоящие SSL сертификаты для продакшена!" 