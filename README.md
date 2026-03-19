# PowerInside

AI-платформа для персоналізованого коучингу спортсменів. Тренери проходять AI-інтерв'ю для побудови бази знань, а спортсмени отримують персоналізовані відповіді на базі методології свого тренера.

## Технологічний стек

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** tRPC, NextAuth v5 (Credentials)
- **AI:** Claude (Anthropic SDK) — інтерв'ю тренерів, чат зі спортсменами
- **База даних:** PostgreSQL 17, Prisma 7 (ORM)
- **Платежі:** Stripe (підписки, пакети повідомлень)
- **Месенджер:** Telegram Mini App (WebApp SDK)
- **Мова:** TypeScript

## Початок роботи

### 1. Клонування та встановлення

```bash
git clone <repo-url>
cd powerinside
pnpm install
```

### 2. Налаштування змінних оточення

```bash
cp .env.example .env
```

Заповніть `.env` реальними значеннями:

| Змінна | Опис |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | URL додатку (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Секрет для JWT-токенів |
| `ANTHROPIC_API_KEY` | API-ключ Anthropic (Claude) |
| `STRIPE_SECRET_KEY` | Секретний ключ Stripe |
| `STRIPE_WEBHOOK_SECRET` | Секрет для Stripe webhook |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота |
| `TELEGRAM_WEBHOOK_SECRET` | Секрет для Telegram webhook |

### 3. База даних

```bash
# Застосувати міграції
npx prisma migrate dev

# Згенерувати Prisma Client
npx prisma generate

# Заповнити тестовими даними
npx tsx prisma/seed.ts
```

### 4. Запуск

```bash
pnpm dev
```

Додаток доступний за адресою [http://localhost:3000](http://localhost:3000).

## Структура проекту

```
powerinside/
├── prisma/
│   ├── schema.prisma          # Схема бази даних
│   ├── migrations/            # Міграції Prisma
│   └── seed.ts                # Seed-скрипт
├── src/
│   ├── app/
│   │   ├── (auth)/            # Сторінки авторизації (login, register)
│   │   ├── (dashboard)/       # Захищені сторінки (dashboard, chat, profile...)
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth API route
│   │   │   ├── telegram/      # Telegram auth + webhook
│   │   │   └── trpc/          # tRPC API handler
│   │   └── tg/                # Telegram Mini App UI
│   ├── components/
│   │   ├── layout/            # AppShell, Header, Sidebar
│   │   ├── telegram/          # TG-компоненти (BackButton, MainButton, Provider)
│   │   └── ui/                # UI-примітиви (Button, Card, Input)
│   ├── lib/
│   │   ├── auth.ts            # NextAuth конфігурація
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── stripe.ts          # Stripe клієнт
│   │   ├── telegram.ts        # Telegram утиліти
│   │   ├── trpc.ts            # tRPC клієнт
│   │   └── ai/
│   │       ├── claude.ts      # Claude AI інтеграція
│   │       └── prompts.ts     # Системні промпти
│   └── server/
│       ├── trpc.ts            # tRPC ініціалізація
│       ├── context.ts         # tRPC контекст
│       └── routers/           # tRPC роутери (auth, coach, athlete, admin)
├── app/generated/prisma/      # Згенерований Prisma Client
├── prisma.config.ts           # Prisma 7 конфігурація
├── .env.example               # Приклад змінних оточення
└── package.json
```

## Функціональність (MVP)

### Ролі користувачів
- **Owner / Admin** — управління платформою, модерація тренерів
- **Coach** — проходження AI-інтерв'ю, побудова бази знань, отримання виплат
- **Athlete** — чат з AI на базі методології тренера, підписки, пакети повідомлень

### AI-інтерв'ю тренера
7 раундів структурованого інтерв'ю з Claude AI для побудови методологічної бази:
1. Target Athlete (цільовий спортсмен)
2. Load Management (управління навантаженням)
3. Autoregulation (авторегуляція)
4. Progression & Deload (прогресія та розвантаження)
5. Exercise Selection (вибір вправ)
6. Technique Standards (стандарти техніки)
7. Lifestyle & Recovery (спосіб життя та відновлення)

### Чат зі спортсменом
- AI-відповіді на базі knowledge base тренера
- Система балансу повідомлень (безкоштовні + платні)
- Multi-expert режим (декілька тренерів відповідають)

### Монетизація
- Підписки: Basic, Individual, Personal (Stripe)
- Пакети додаткових повідомлень
- Реферальна програма
- Виплати тренерам

## Telegram Mini App

Бот працює як Telegram Mini App для спортсменів:

1. Створіть бота через [@BotFather](https://t.me/BotFather)
2. Налаштуйте Web App URL на адресу вашого додатку (`/tg`)
3. Додайте `TELEGRAM_BOT_TOKEN` та `TELEGRAM_WEBHOOK_SECRET` у `.env`
4. Налаштуйте webhook: `POST /api/telegram/webhook`

## Тестові користувачі

| Email | Пароль | Роль |
|---|---|---|
| owner@powerinside.app | admin123 | OWNER |
| admin@powerinside.app | admin123 | ADMIN |
| coach@test.com | coach123 | COACH |
| athlete@test.com | athlete123 | ATHLETE |

## Деплой

- Збірка: `pnpm build`
- Запуск: `pnpm start`
- Переконайтесь, що `DATABASE_URL`, `NEXTAUTH_SECRET` та інші змінні встановлені у production-оточенні
