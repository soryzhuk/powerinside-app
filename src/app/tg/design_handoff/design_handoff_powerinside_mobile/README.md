# Handoff: PowerInside Mobile (Telegram Mini App)

## Overview
Редизайн Telegram Mini App для PowerInside — AI-платформи персоналізованого коучингу спортсменів. Спортсмен обирає тренера, ставить запитання, отримує відповідь, побудовану на реальній методології цього тренера (7 раундів AI-інтерв'ю + knowledge base). Цей пакет містить 6 екранів: Онбординг, Вибір тренера, Перша розмова (порожній стан), Розмова, Баланс, Профіль.

## About the Design Files
Файли у цій теці — це **дизайн-референси у форматі HTML/React** (прототипи React-компонентів на Babel standalone). Вони показують, як має виглядати інтерфейс, а **не** готовий код для продакшену. Задача розробника — відтворити ці дизайни у чинному коді проекту `powerinside/` (Next.js 16 + React 19 + Tailwind CSS 4), використовуючи вже наявні патерни й бібліотеки (tRPC, lucide-react, компоненти у `src/components/ui/`).

Цільова сторінка для інтеграції: `src/app/tg/page.tsx` (та відповідні роути/під-сторінки, якщо розбиваєте на маршрути).

## Fidelity
**High-fidelity.** Точні hex-кольори, шрифти, розміри та відступи. Відтворювати піксель-у-піксель, адаптуючи під Tailwind-токени та існуючі примітиви.

## Design Tokens

### Colors (warm dark + sand)
| Token | Hex | Роль |
|---|---|---|
| `ink` | `#17140F` | Глобальний фон (warm near-black) |
| `surface` | `#211D17` | Картки, композер, таб-бар |
| `surface-2` | `#2A251D` | Піднятий surface (hero, виділений пакет) |
| `line` | `rgba(237,230,215,0.08)` | Бордери карток |
| `line-soft` | `rgba(237,230,215,0.05)` | Розділювачі рядків |
| `text` | `#EDE6D7` | Основний текст (warm ivory) |
| `text-dim` | `rgba(237,230,215,0.58)` | Вторинний |
| `text-mute` | `rgba(237,230,215,0.36)` | Третинний, метадата |
| `sand` | `#C9A574` | Акцент (приглушений пісочний) |
| `sand-deep` | `#A7855A` | Hover / emphasis акценту |
| `sand-soft` | `rgba(201,165,116,0.14)` | Tint для бейджів |
| `stone` | `#8A7F6E` | Вторинний акцент (ікони, курсив) |
| `sage` | `#7D9575` | Success (статус "активний") |

**Правило:** chroma ≤ 0.08 в OKLCH. Жодних неонів, жодних яскравих градієнтів.

### Typography
- **Display/serif:** `Fraunces` (400/500), letter-spacing `-0.5...-2.5` на великих розмірах. Використовується для заголовків і емоційних акцентів — часто **italic + sand** на другому рядку.
- **Body/UI:** `Inter` (400/500/600).
- **Meta:** `JetBrains Mono` (400/500), uppercase, letter-spacing `1...1.5` — для N°, дат, системних міток.

Шкала:
- Display XL: 86/0.86 Fraunces 400
- Display L: 38/1.0 Fraunces 400 letter-spacing -0.8
- Display M: 30/1.05 Fraunces 400 letter-spacing -0.5
- Display S: 26/1 Fraunces 400 (метрики)
- Title: 15/1.3 Inter 500
- Body: 13.5/1.45-1.5 Inter 400
- Caption: 12/1.5 Inter 400
- Meta: 10-11 Mono 400/500 uppercase

### Spacing & radius
- Rounded cards: `14` / `16` / `20`
- Pills/chips: `999`
- Avatar: кругла, 36/40/48/68 з inner `inset 0 0 0 1px rgba(255,255,255,0.08)` + `0 1px 2px rgba(0,0,0,0.3)`
- Screen padding: `24` (основний), `20` (чат), `28` (герой онбордингу)
- Vertical rhythm: `10` між карток, `22` між секціями

### Shadows
- CTA primary: `0 1px 0 rgba(255,255,255,0.2) inset, 0 10px 30px rgba(201,165,116,0.2)`
- Send button: `0 4px 12px rgba(201,165,116,0.25)`

## Screens / Views

### 01 · Онбординг (`Onboarding`)
- Мета: перше знайомство, пояснення продукту в 3 пунктах, CTA «Почати розмову».
- Layout:
  - Top meta row: `POWERINSIDE · EST 2026` зліва, close-кнопка справа (`28×28`, radius 14, `surface`).
  - Hero card (`height:380`, radius:18, `linear-gradient(180deg,#2A251D,#1B1812)`) з діагональними смугами-плейсхолдером (`repeating-linear-gradient(45deg, rgba(201,165,116,0.06) 0 10px, transparent 10px 20px)`).
    - Верхня мета `N° 001 — METHODOLOGY — ∞`.
    - Велика лідова фраза: `Inside\npower.` — другий рядок italic + sand.
    - Саб-копі під фразою.
  - 3 пункти з нумерацією (`01/02/03` Mono Sand).
  - CTA: `background:#C9A574`, `color:#17140F`, висота 52, radius 14, weight 600.
  - Під CTA: посилання "Увійти" з `border-bottom` stone.
- Мова: українська.

### 02 · Вибір тренера (`CoachesList`)
- Header: мета `БІБЛІОТЕКА ТРЕНЕРІВ` + search/filter pills (36×36, surface, border line).
- Заголовок-серіф: `Обери, з ким\nговорити.` — другий рядок italic stone.
- Фільтри-теги: `Всі` активний (`background:text`, `color:bg`), решта з бордером line.
- Картки тренерів (16px radius, surface, line border):
  - Avatar 48px (ім'я → ініціали, градієнт залежно від `tone`: sand/sage/stone/dark).
  - Ім'я (15/500) + фах (12/textDim) + метрики мономом (`74 правил · 312 записів`).
  - На першій картці бейдж `⸻ РЕКОМЕНДОВАНО` Mono Sand.
  - Стрілка `→` stone.
- Нижній Tab bar: `Розмова / Баланс / Профіль`, активний `sand`.

### 03 · Перша розмова (`EmptyChat`)
- Back + Avatar + Ім'я тренера ("Перша розмова" у дімі).
- Кільце з іконкою чату (72×72, `sand-soft` fill, sand stroke).
- Заголовок-серіф: `Спитай те, що давно\nне наважувався.` (italic stone).
- 4 suggestion-карточки (radius 12, surface): `01`...`04` mono sand + текст + стрілка «open».
- Композер disabled-style: `Напиши або скористайся підказкою…`, send-кнопка surface (не активна).

### 04 · Розмова (`Chat`)
- Header тренера: статус-дот sage `5×5`, підпис `AI-методологія · 74 правила`.
- Day divider: mono uppercase `Сьогодні · 09:14`.
- Повідомлення:
  - **Coach** (default): `surface`, radius `16 16 16 4`, line border.
  - **User**: `sand` background, `#17140F` текст, radius `16 16 4 16`.
  - **Coach quote** (виділене правило з методики): `border-left:2px sand`, Fraunces italic, під цитатою мета-мітка Mono `— З МЕТОДИКИ ТРЕНЕРА · ПРАВИЛО 22`.
- Suggestion chips над композером (Surface + line border, pill 999).
- Composer: input-pill + микрофон-іконка, круглий send (44×44, sand, стрілка #17140F).

### 05 · Баланс (`Balance`)
- Hero counter card (surface-2 → surface gradient, radius 20):
  - Мета `ВСЬОГО / ЗАЛИШОК` згори-справа (mono).
  - Число `147` Fraunces 86/0.9 letter-spacing -2.5.
  - Саб `повідомлень до тренера`.
  - Stacked bar з 3 сегментів (`sage/blue/sand`), під ним легенда.
- Subscription chip: іконка-корона у sand-soft, `Individual · активна`, `Продовжиться 14 травня · $30`.
- Пакети повідомлень: 3 варіанти, середній виділений (`surface-2` + `sand+44` border). Кожен — велике число serif (58px width) + опис + CTA price (sand для "hot", outline для інших).

### 06 · Профіль (`Profile`)
- Avatar 68 + ім'я Fraunces 24 + `@handle · Спортсмен` + бейдж `● З НАМИ 142 ДНІ` sand-on-sand-soft.
- 3-колонкова stats row в одній картці: `312 Запитань / 18 Цього тижня / 7 Стрік, днів` — числа Fraunces 26.
- Settings list (surface, radius 14): Тренери / Підписка / Сповіщення / Мова / Підтримка / **Вийти** (колір `#C99B85` — приглушений warning).
- Футер мономом: `POWERINSIDE · V 0.1 · TELEGRAM MINI APP`.

## Components to implement (shared)
- `<TabBar active>` — bottom nav з трьома SVG-іконками (chat/wallet/user), активна `sand`, неактивні `text-mute`.
- `<Avatar initials size tone>` — градієнт залежно від tone.
- `<IconPill icon>` — 36×36, surface, border line.
- `<Shell>` — absolute inset, `bg:ink`, flex column.
- `<StatusBarPad/>` 54px та `<HomePad/>` 34px — резерв під Telegram WebApp header/footer.

## Interactions & Behavior
- Тап на картку тренера → `Chat` з вибраним `coachId`, haptic `selectionChanged`.
- Send у композері → haptic `impactOccurred('light')`, блокування під час pending.
- Tab bar → haptic `selectionChanged`, зміна `activeTab`.
- Suggestion chip у EmptyChat → підставляє текст у composer.
- Usage bar на балансі — статична візуалізація `free/weekly/purchased/total`.
- Покупка пакета → Stripe checkout (вже інтегрований у `billing` роутері).

## State (існуюче в коді)
- `trpc.coach.listActive` — список тренерів
- `trpc.athlete.getConversation({conversationId})` — історія
- `trpc.athlete.askQuestion` — запит
- `trpc.athlete.getBalance` — баланс (`freeRemaining/weeklyRemaining/purchasedRemaining/total`)
- `trpc.billing.getSubscription` — підписка
- Telegram WebApp: `useTelegram()` — `webApp`, `user`, `token`, `isTelegram`, `isLoading`, `error`

## Assets
Всі візуали — SVG inline або CSS-градієнти-плейсхолдери. Жодних растрових зображень. Для production додати фото тренерів (зараз ініціали), залишивши fallback на Avatar.

## Files у цьому пакеті
- `PowerInside Mobile.html` — кореневий HTML, що завантажує всі JSX
- `app.jsx` — канвас-обгортка і SystemBoard (дизайн-токени)
- `screens.jsx` — ВСІ 6 екранів + shared-компоненти (Shell, TabBar, Avatar, IconPill)
- `ios-frame.jsx` — iPhone-обгортка (starter, не потрібна в production)
- `design-canvas.jsx` — pan/zoom wrapper (starter, не потрібна в production)

**Для імплементації читайте тільки `screens.jsx`.** Там весь потрібний UI-код: хекси, типографіка, SVG-іконки, копі. Перенесіть в React-компоненти Next.js, замінивши inline-стилі на Tailwind-класи або на `globals.css` CSS-змінні.

## Шрифти
Підключити у `src/app/layout.tsx` через `next/font/google`:
```ts
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
```
Додати CSS-змінні в `globals.css` і використовувати у `@theme` блоці Tailwind 4.
