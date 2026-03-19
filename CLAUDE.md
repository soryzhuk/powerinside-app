думай на русском
читай редми и поддерживай его актуальность
делай комит и пуш в гит

# PostgreSQL 17
- Порт: 5434
- Пароль: 1111
- Пользователь: postgres
- База данных: powerinside

# Стек
- Next.js 16 (App Router) + Prisma 7 + tRPC + Claude AI + Stripe + Telegram Mini App
- Авторизация: NextAuth v5 (beta) с Credentials provider
- UI: Tailwind CSS 4 + Lucide React

# Prisma
- Схема: `prisma/schema.prisma`
- Сгенерированный клиент: `app/generated/prisma`
- Конфигурация: `prisma.config.ts`
- Seed: `npx tsx prisma/seed.ts`
- Миграции: `npx prisma migrate dev`

# Пользователи (seed)
- Owner: owner@powerinside.app / admin123 (роль OWNER)
- Admin: admin@powerinside.app / admin123 (роль ADMIN)
- Coach: coach@test.com / coach123 (роль COACH, CoachProfile ACTIVE, whitelisted)
- Athlete: athlete@test.com / athlete123 (роль ATHLETE, 50 бесплатных сообщений)

# Структура проекта
- `src/app/` — страницы и API-роуты (App Router)
- `src/lib/` — утилиты (auth, prisma, stripe, telegram, trpc)
- `src/server/` — tRPC роутеры и контекст
- `src/components/` — React-компоненты (UI, layout, telegram)
- `prisma/` — схема и миграции

# Alias
- `@/*` → корень проекта (tsconfig paths)
