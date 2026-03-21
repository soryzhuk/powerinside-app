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
- Миграции локально: `npx prisma migrate dev`
- Миграции на Railway: только ручные (`npx prisma migrate deploy` через CLI с DATABASE_URL от Railway)
- Build script: `prisma generate && next build` (generate обязателен перед next build)

# Railway
- Проект: powerinside.app (ID: e0632587-b8bf-48bf-9670-46aada008ce6)
- Сервис приложения: powerinside-app (ID: ac61ddaa-4fcf-4302-abea-14df6afdb965)
- Сервис БД: Postgres (ID: b3a09167-ddd9-489c-a611-366570b925bb)
- Internal DB URL: postgresql://postgres:powerinside2026@postgres.railway.internal:5432/powerinside
- Среда: production (ID: 82eb5e54-1755-4d2e-b872-85d8f17c732b)
- Токен API: в `.claude/settings.local.json` (не коммитить!)

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
