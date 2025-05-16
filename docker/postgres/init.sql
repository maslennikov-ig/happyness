-- Создание базы данных (если не существует)
CREATE DATABASE happyness;

-- Подключение к созданной базе данных
\c happyness;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Создание схемы
CREATE SCHEMA IF NOT EXISTS public;

-- Установка прав доступа
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public; 