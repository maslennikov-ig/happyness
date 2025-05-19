# Скрипт для начальной настройки окружения разработки для Windows
# Выполняет все необходимые шаги для подготовки проекта к разработке

Write-Host "🚀 Настройка окружения разработки для проекта Happyness" -ForegroundColor Cyan

# Проверка наличия .env файла
if (-not (Test-Path -Path ".env")) {
    Write-Host "📝 Создание .env файла из шаблона .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
} else {
    Write-Host "✅ Файл .env уже существует" -ForegroundColor Green
}

# Установка зависимостей
Write-Host "📦 Установка npm зависимостей" -ForegroundColor Cyan
npm ci

# Генерация Prisma клиента
Write-Host "🔄 Генерация Prisma клиента" -ForegroundColor Cyan
npm run prisma:generate

# Запуск сервисов в Docker
Write-Host "🐳 Запуск сервисов в Docker" -ForegroundColor Cyan
npm run docker:dev:build

# Проверка доступности PostgreSQL
Write-Host "⏳ Ожидание запуска PostgreSQL..." -ForegroundColor Yellow
$attempt = 0
$maxAttempts = 30
$success = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "Попытка $attempt из $maxAttempts..." -ForegroundColor Gray
    
    try {
        # Выполняем команду для проверки доступности PostgreSQL
        $result = docker-compose exec -T postgres pg_isready -U postgres
        
        # Проверяем статус команды
        if ($LASTEXITCODE -eq 0) {
            # Используем $result для вывода информации о состоянии сервера
            Write-Host "PostgreSQL доступен: $result" -ForegroundColor Green
            $success = $true
            break
        } else {
            # Сервер еще не готов, выводим информацию от pg_isready
            Write-Host "PostgreSQL не готов: $result (код: $LASTEXITCODE)" -ForegroundColor Yellow
        }
    } catch {
        # Ошибка при выполнении команды
        Write-Host "Ошибка при проверке PostgreSQL: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

if (-not $success) {
    Write-Host "❌ PostgreSQL не запустился. Проверьте логи: npm run docker:logs:postgres" -ForegroundColor Red
    exit 1
}

# Применение миграций
Write-Host "🔄 Применение миграций к базе данных" -ForegroundColor Cyan
npm run docker:db:migrate

Write-Host ""
Write-Host "✅ Настройка окружения разработки завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Вы можете открыть:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Backend API: http://localhost:4000/api" -ForegroundColor Gray  
Write-Host "   - API Docs: http://localhost:4000/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Полезные команды:" -ForegroundColor Cyan
Write-Host "   - Запуск инструментов: npm run docker:tools" -ForegroundColor Gray
Write-Host "   - Просмотр логов: npm run docker:logs" -ForegroundColor Gray
Write-Host "   - Остановка: npm run docker:dev:down" -ForegroundColor Gray 