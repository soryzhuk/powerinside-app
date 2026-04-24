import { NextRequest } from "next/server";
import { validateTelegramWebAppData, parseTelegramInitData } from "@/lib/telegram";
import { createTelegramJWT } from "@/lib/telegram-jwt";
import prisma from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

const ADMIN_USERNAMES = ["soloveynik", "sergiyryzhuk"];

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

    const isAdminUser = tgUser.username ? ADMIN_USERNAMES.includes(tgUser.username) : false;
    const assignedRole = isAdminUser ? "ADMIN" : "ATHLETE";
    // Admins skip onboarding — they get access to all interfaces immediately
    let isNew = false;

    if (!user) {
      // Only non-admin new users need onboarding
      if (!isAdminUser) isNew = true;
      const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

      user = await prisma.user.create({
        data: {
          telegramId,
          name: name || `tg_${telegramId}`,
          email: `tg_${telegramId}@telegram.powerinside.app`,
          image: tgUser.photo_url || null,
          language: tgUser.language_code === "uk" ? "uk" : "uk",
          role: assignedRole,
        },
      });

      await prisma.messageBalance.create({
        data: { userId: user.id, freeRemaining: 50 },
      });
    } else {
      const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          image: tgUser.photo_url || user.image,
          ...(isAdminUser && user.role === "ATHLETE" ? { role: "ADMIN" } : {}),
        },
      });
    }

    // Auto-create CoachProfile for admins so they can use coach procedures
    if (isAdminUser || user.role === "ADMIN" || user.role === "OWNER") {
      const existingProfile = await prisma.coachProfile.findUnique({ where: { userId: user.id } });
      if (!existingProfile) {
        await prisma.coachProfile.create({ data: { userId: user.id, status: "PENDING" } });
      }
    }

    // Generate JWT token
    const token = createTelegramJWT({
      userId: user.id,
      telegramId,
      role: user.role,
    });

    return Response.json({
      token,
      isNew,
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
