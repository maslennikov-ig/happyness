FROM node:22-alpine AS base

# Установка зависимостей
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Сборка приложения
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерация Prisma клиента
RUN npx prisma generate

# Сборка приложения
RUN npm run build

# Продакшн образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Копирование необходимых файлов
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Экспозиция портов
EXPOSE 3100
EXPOSE 4000

# Запуск приложения
CMD ["npm", "start"]