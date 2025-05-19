# Скрипт для удобной работы с базой данных PostgreSQL в Windows
# Предоставляет функции для бэкапа, восстановления и сброса данных

# Константы
$DB_CONTAINER = "happyness-postgres"
$DB_USER = "postgres"
$DB_NAME = "happyness"
$BACKUP_DIR = "./docker/postgres/backups"

# Создание директории для бэкапов, если она не существует
if (-not (Test-Path -Path $BACKUP_DIR)) {
    New-Item -Path $BACKUP_DIR -ItemType Directory -Force | Out-Null
}

# Функция для вывода помощи
function Show-Help {
    Write-Host "Использование: .\db-utils.ps1 [КОМАНДА]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Команды:" -ForegroundColor Yellow
    Write-Host "  backup        Создать резервную копию базы данных"
    Write-Host "  restore FILE  Восстановить базу данных из бэкапа"
    Write-Host "  reset         Сбросить базу данных и применить миграции"
    Write-Host "  migrations    Создать и применить новую миграцию"
    Write-Host "  seed          Заполнить базу тестовыми данными"
    Write-Host "  help          Показать эту справку"
    Write-Host ""
}

# Функция для создания бэкапа
function Backup-Database {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = Join-Path $BACKUP_DIR "happyness_$Timestamp.sql"
    
    Write-Host "📦 Создание резервной копии базы данных..." -ForegroundColor Cyan
    
    try {
        docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME | Out-File -FilePath $BackupFile -Encoding utf8
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Бэкап успешно создан: $BackupFile" -ForegroundColor Green
        } else {
            Write-Host "❌ Ошибка при создании бэкапа" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Ошибка при создании бэкапа: $_" -ForegroundColor Red
        exit 1
    }
}

# Функция для восстановления из бэкапа
function Restore-Database {
    param (
        [string]$BackupFile
    )
    
    if ([string]::IsNullOrEmpty($BackupFile)) {
        Write-Host "❌ Не указан файл бэкапа" -ForegroundColor Red
        Write-Host "Использование: .\db-utils.ps1 restore FILE" -ForegroundColor Yellow
        exit 1
    }
    
    if (-not (Test-Path -Path $BackupFile)) {
        Write-Host "❌ Файл бэкапа не найден: $BackupFile" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "⚠️ Внимание! Это действие перезапишет все данные в базе $DB_NAME" -ForegroundColor Yellow
    $confirmation = Read-Host "Вы уверены, что хотите продолжить? [y/N]"
    
    if ($confirmation -notmatch "^[yY]$") {
        Write-Host "🛑 Операция отменена" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "🔄 Восстановление базы данных из бэкапа..." -ForegroundColor Cyan
    
    try {
        # Сбрасываем соединения и пересоздаем базу
        docker exec $DB_CONTAINER psql -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
        docker exec $DB_CONTAINER psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
        docker exec $DB_CONTAINER psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
        
        # Восстанавливаем из бэкапа
        Get-Content $BackupFile | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ База данных успешно восстановлена из бэкапа" -ForegroundColor Green
        } else {
            Write-Host "❌ Ошибка при восстановлении базы данных" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Ошибка при восстановлении базы данных: $_" -ForegroundColor Red
        exit 1
    }
}

# Функция для сброса базы и применения миграций
function Reset-Database {
    Write-Host "⚠️ Внимание! Это действие удалит все данные в базе $DB_NAME и применит миграции заново" -ForegroundColor Yellow
    $confirmation = Read-Host "Вы уверены, что хотите продолжить? [y/N]"
    
    if ($confirmation -notmatch "^[yY]$") {
        Write-Host "🛑 Операция отменена" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "🔄 Сброс базы данных и применение миграций..." -ForegroundColor Cyan
    
    try {
        npm run docker:db:reset
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ База данных успешно сброшена и миграции применены" -ForegroundColor Green
        } else {
            Write-Host "❌ Ошибка при сбросе базы данных" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Ошибка при сбросе базы данных: $_" -ForegroundColor Red
        exit 1
    }
}

# Функция для создания и применения новой миграции
function Create-Migration {
    Write-Host "📝 Введите название новой миграции (например, add_user_roles):" -ForegroundColor Cyan
    $MigrationName = Read-Host
    
    if ([string]::IsNullOrEmpty($MigrationName)) {
        Write-Host "❌ Название миграции не может быть пустым" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "🔄 Создание и применение миграции '$MigrationName'..." -ForegroundColor Cyan
    
    try {
        docker-compose exec backend npx prisma migrate dev --name $MigrationName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Миграция успешно создана и применена" -ForegroundColor Green
        } else {
            Write-Host "❌ Ошибка при создании миграции" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Ошибка при создании миграции: $_" -ForegroundColor Red
        exit 1
    }
}

# Функция для заполнения базы тестовыми данными
function Seed-Database {
    Write-Host "🌱 Заполнение базы тестовыми данными..." -ForegroundColor Cyan
    
    try {
        npm run docker:db:seed
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Тестовые данные успешно добавлены" -ForegroundColor Green
        } else {
            Write-Host "❌ Ошибка при заполнении базы данными" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Ошибка при заполнении базы данными: $_" -ForegroundColor Red
        exit 1
    }
}

# Обработка команд
if ($args.Count -eq 0) {
    Show-Help
    exit 0
}

switch ($args[0]) {
    "backup" {
        Backup-Database
    }
    "restore" {
        if ($args.Count -lt 2) {
            Write-Host "❌ Не указан файл бэкапа" -ForegroundColor Red
            Write-Host "Использование: .\db-utils.ps1 restore FILE" -ForegroundColor Yellow
            exit 1
        }
        Restore-Database -BackupFile $args[1]
    }
    "reset" {
        Reset-Database
    }
    "migrations" {
        Create-Migration
    }
    "seed" {
        Seed-Database
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ Неизвестная команда: $($args[0])" -ForegroundColor Red
        Show-Help
        exit 1
    }
} 