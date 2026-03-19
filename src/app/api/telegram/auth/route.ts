import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { validateTelegramWebAppData, parseTelegramInitData } from "@/lib/telegram";
import prisma from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "powerinside-tg-secret";

/**
 * Creates a simple HMAC-based JWT token for Telegram Mini App users.
 * This token is used to authenticate tRPC requests from the Mini App.
 */
function createTelegramJWT(payload: {
  userId: string;
  telegramId: string;
  role: string;
}): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");

  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    })
  ).toString("base64url");

  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData || typeof initData !== "string") {
      return Response.json(
        { error: "Missing initData" },
        { status: 400 }
      );
    }

    // Validate Telegram WebApp data
    const isValid = validateTelegramWebAppData(initData, BOT_TOKEN);
    if (!isValid) {
      return Response.json(
        { error: "Invalid Telegram data" },
        { status: 401 }
      );
    }

    // Parse the validated data
    const parsed = parseTelegramInitData(initData);

    if (!parsed.user) {
      return Response.json(
        { error: "No user data in initData" },
        { status: 400 }
      );
    }

    const tgUser = parsed.user;
    const telegramId = String(tgUser.id);

    // Check if auth_date is not too old (5 minutes max)
    const now = Math.floor(Date.now() / 1000);
    if (now - parsed.auth_date > 300) {
      return Response.json(
        { error: "Auth data expired" },
        { status: 401 }
      );
    }

    // Find or create user by telegramId
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      // Build name from Telegram data
      const name = [tgUser.first_name, tgUser.last_name]
        .filter(Boolean)
        .join(" ");

      user = await prisma.user.create({
        data: {
          telegramId,
          name: name || `tg_${telegramId}`,
          email: `tg_${telegramId}@telegram.powerinside.app`,
          image: tgUser.photo_url || null,
          language: tgUser.language_code === "uk" ? "uk" : "uk",
          role: "ATHLETE",
        },
      });

      // Create initial message balance for new user
      await prisma.messageBalance.create({
        data: {
          userId: user.id,
          freeRemaining: 50,
        },
      });
    } else {
      // Update user info from Telegram (name, photo may change)
      const name = [tgUser.first_name, tgUser.last_name]
        .filter(Boolean)
        .join(" ");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          image: tgUser.photo_url || user.image,
        },
      });
    }

    // Generate JWT token
    const token = createTelegramJWT({
      userId: user.id,
      telegramId,
      role: user.role,
    });

    return Response.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        telegramId,
      },
    });
  } catch (error) {
    console.error("[Telegram Auth] Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
