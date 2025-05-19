@echo off
REM Скрипт для запуска тестов аутентификации на Windows

REM Останавливаем контейнер с тестовой базой данных, если он уже запущен
docker-compose stop postgres-test

REM Запускаем контейнер с тестовой базой данных
echo Запуск тестовой базы данных...
docker-compose up -d postgres-test

REM Ждем, пока база данных запустится
echo Ожидание запуска базы данных...
timeout /t 5 /nobreak

REM Установка переменной окружения для тестовой базы данных
set DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5434/happyness_test

REM Применение миграций к тестовой БД
echo Применение миграций к тестовой базе данных...
npx prisma migrate deploy

REM Запуск модульных тестов
echo Запуск модульных тестов аутентификации...
npm run test:auth

REM Запуск интеграционных тестов
echo Запуск интеграционных тестов аутентификации...
npm run test:auth:integration

REM Останавливаем контейнер с тестовой базой данных
echo Остановка тестовой базы данных...
docker-compose stop postgres-test

echo Тесты аутентификации завершены! 