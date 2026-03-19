import { NextRequest } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;
const APP_URL = process.env.NEXTAUTH_URL!;

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function handleStartCommand(chatId: number, firstName: string): Promise<void> {
  const webAppUrl = `${APP_URL}/tg`;

  const text = [
    `<b>PowerInside</b>`,
    ``,
    `${firstName}, ласкаво просимо до PowerInside!`,
    ``,
    `Тут ти знайдеш AI-коучинг для силових видів спорту, персональні програми та базу знань від найкращих тренерів.`,
    ``,
    `Натисни кнопку нижче, щоб відкрити додаток:`,
  ].join("\n");

  return sendTelegramMessage(chatId, text, {
    inline_keyboard: [
      [
        {
          text: "Відкрити PowerInside",
          web_app: { url: webAppUrl },
        },
      ],
    ],
  });
}

function handleHelpCommand(chatId: number): Promise<void> {
  const text = [
    `<b>Допомога PowerInside</b>`,
    ``,
    `/start — Відкрити додаток`,
    `/help — Показати цю довідку`,
    ``,
    `<b>Можливості:</b>`,
    `• AI-чат з персональним тренером`,
    `• Баланс повідомлень та підписки`,
    `• Профіль спортсмена`,
    ``,
    `Підтримка: support@powerinside.app`,
  ].join("\n");

  return sendTelegramMessage(chatId, text);
}

export async function POST(request: NextRequest) {
  // Validate webhook secret
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message?.text || !message.from) {
      return Response.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const firstName = message.from.first_name;

    // Check if message contains a bot command entity
    const isCommand = message.entities?.some((e) => e.type === "bot_command");

    if (isCommand) {
      const command = text.split(/\s+/)[0].toLowerCase().replace(/@\w+$/, "");

      switch (command) {
        case "/start":
          await handleStartCommand(chatId, firstName);
          break;
        case "/help":
          await handleHelpCommand(chatId);
          break;
        default:
          await sendTelegramMessage(
            chatId,
            "Невідома команда. Спробуй /help для списку команд."
          );
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error processing update:", error);
    // Always return 200 to Telegram to prevent retries
    return Response.json({ ok: true });
  }
}
