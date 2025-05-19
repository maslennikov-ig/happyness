# Скрипт для генерации самоподписанных SSL сертификатов для локальной разработки (Windows)
# Используйте настоящие SSL сертификаты для продакшена!

Write-Host "🔐 Генерация самоподписанных SSL сертификатов для локальной разработки" -ForegroundColor Cyan

# Проверка наличия OpenSSL
try {
    openssl version | Out-Null
}
catch {
    Write-Host "❌ Ошибка: OpenSSL не установлен или не доступен в PATH." -ForegroundColor Red
    Write-Host "Установите OpenSSL для Windows: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    exit 1
}

# Директория для хранения сертификатов
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KeyFile = Join-Path $ScriptDir "server.key"
$CsrFile = Join-Path $ScriptDir "server.csr"
$CrtFile = Join-Path $ScriptDir "server.crt"

# Настройки для сертификата
$Country = "RU"
$State = "State"
$Locality = "City"
$Organization = "Happyness"
$OrganizationalUnit = "Development"
$CommonName = "localhost"
$Email = "admin@example.com"
$Days = 3650 # 10 лет

# Генерация приватного ключа
Write-Host "📝 Генерация приватного ключа..." -ForegroundColor Cyan
openssl genrsa -out $KeyFile 2048

# Генерация CSR (Certificate Signing Request)
Write-Host "📝 Генерация запроса на подпись сертификата (CSR)..." -ForegroundColor Cyan
openssl req -new -key $KeyFile -out $CsrFile -subj "/C=$Country/ST=$State/L=$Locality/O=$Organization/OU=$OrganizationalUnit/CN=$CommonName/emailAddress=$Email"

# Генерация самоподписанного сертификата
Write-Host "📝 Генерация самоподписанного сертификата..." -ForegroundColor Cyan
openssl x509 -req -days $Days -in $CsrFile -signkey $KeyFile -out $CrtFile

# Удаление временных файлов
Write-Host "🧹 Удаление временных файлов..." -ForegroundColor Cyan
if (Test-Path $CsrFile) {
    Remove-Item -Path $CsrFile -Force
}

Write-Host "✅ SSL сертификаты успешно сгенерированы!" -ForegroundColor Green
Write-Host "   - Приватный ключ: $KeyFile"
Write-Host "   - Сертификат: $CrtFile"
Write-Host ""
Write-Host "⚠️ Важно: Это самоподписанные сертификаты для разработки." -ForegroundColor Yellow
Write-Host "   Используйте настоящие SSL сертификаты для продакшена!" -ForegroundColor Yellow

# Добавление сертификата в хранилище Windows (требует прав администратора)
Write-Host ""
$installCert = Read-Host "Добавить сертификат в хранилище Windows? (требуются права администратора) [y/N]"

if ($installCert -match "^[yY]$") {
    Write-Host "🔄 Добавление сертификата в хранилище доверенных корневых центров сертификации..." -ForegroundColor Cyan
    
    try {
        Import-Certificate -FilePath $CrtFile -CertStoreLocation Cert:\LocalMachine\Root -Verbose
        Write-Host "✅ Сертификат успешно добавлен в хранилище Windows!" -ForegroundColor Green
    } 
    catch {
        Write-Host "❌ Ошибка при добавлении сертификата: $_" -ForegroundColor Red
        Write-Host "Попробуйте запустить скрипт с правами администратора или добавьте сертификат вручную." -ForegroundColor Yellow
    }
} 