# 🚗 Car Calculator Monorepo

Сучасний веб-додаток для розрахунку середньої ціни вживаних автомобілів. Проєкт побудований на архітектурі **Monorepo (Turborepo)** та використовує найсучасніші інструменти для бекенду і фронтенду.

## 🏗 Архітектура Проєкту

Цей репозиторій є монорепозиторієм (Monorepo), що складається з кількох взаємопов'язаних робочих просторів (workspaces):

- **`apps/backend`**: REST API сервер на базі **NestJS 11**, PostgreSQL та **Prisma ORM**.
- **`apps/frontend`**: Клієнтський додаток на базі **React 19**, **Vite** та **Redux Toolkit (RTK Query)**.
- **`packages/types`**: Спільний пакет із типами та Zod-схемами, який використовується і на бекенді, і на фронтенді (Єдине джерело правди).
- **`packages/eslint-config`** & **`packages/typescript-config`**: Спільні конфігурації лінтера та TypeScript для підтримання єдиного стилю коду.

## 🚀 Основний Функціонал (Що вже зроблено)

### Бекенд (100% готовність MVP)
- ✅ **Безпека:** JWT-авторизація (access/refresh токени в HTTP-Only куках), хешування паролів (`bcrypt`).
- ✅ **Бізнес-логіка:** Математичний алгоритм розрахунку (Interquartile Range - IQR) для відкидання аномальних (фейкових) цін на авто.
- ✅ **Профіль користувача:** Отримання, оновлення, видалення профілю та зміна пароля.
- ✅ **Інфраструктура:** Глобальна валідація даних (`zod` + `nestjs-zod`), Swagger-документація, захист від брутфорсу (`throttler`), Pino-логування.

### Фронтенд (В процесі розробки)
- ⏳ Світлий, "повітряний" преміум дизайн (Vanilla CSS + CSS змінні).
- ⏳ Валідація форм через `react-hook-form` + `zod`.
- ⏳ Redux Toolkit та інтеграція з API через RTK Query.

## 🛠 Технологічний Стек

- **Мова:** TypeScript
- **Пакетний менеджер:** npm (Workspaces)
- **Білдер:** Turborepo

**Бекенд:**
- NestJS (v11)
- Prisma ORM + PostgreSQL
- Passport.js (JWT)
- Zod (Валідація)
- Swagger (OpenAPI docs)

**Фронтенд:**
- React (v19) + Vite
- Redux Toolkit (RTK Query)
- React Router (v7)
- React Hook Form + Zod

## ⚙️ Запуск Проєкту

### Попередні вимоги
- Node.js (v20+)
- PostgreSQL (локально або через Docker)

### 1. Встановлення залежностей
```bash
npm install
```

### 2. Налаштування бази даних
Створіть файл `.env` у папці `apps/backend/` (на основі `.env.example`) та вкажіть ваш `DATABASE_URL`. Потім застосуйте міграції:
```bash
npm run --workspace=apps/backend db:push
```
*(або перейдіть у `apps/backend` і виконайте `npx prisma migrate dev`)*

### 3. Запуск розробки (Dev Mode)
Щоб запустити одночасно і бекенд, і фронтенд за допомогою Turborepo:
```bash
npm run dev
```

- **Фронтенд:** [http://localhost:5173](http://localhost:5173)
- **Бекенд API:** [http://localhost:3000](http://localhost:3000)
- **Swagger Документація:** [http://localhost:3000/api](http://localhost:3000/api)

## 👤 Автори
Розроблено з любов'ю ❤️
