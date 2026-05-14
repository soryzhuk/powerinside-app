import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = body?.locale as string | undefined;

  if (!locale || !(locales as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale as Locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true });
}
