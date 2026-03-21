import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createHmac } from "crypto";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Session } from "next-auth";

export interface Context {
  prisma: PrismaClient;
  session: Session | null;
}

function verifyTelegramJWT(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = process.env.NEXTAUTH_SECRET || "powerinside-tg-secret";
    const expectedSig = createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export async function createContext(
  opts?: FetchCreateContextFnOptions
): Promise<Context> {
  const session = await auth();
  if (session) return { prisma, session };

  // Support Telegram Mini App JWT
  const authHeader = opts?.req?.headers?.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyTelegramJWT(authHeader.slice(7));
    if (payload) {
      const tgSession: Session = {
        user: {
          id: payload.userId,
          role: payload.role as "ATHLETE" | "COACH" | "INVESTOR" | "ADMIN" | "OWNER",
          email: "",
          name: null,
          image: null,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      return { prisma, session: tgSession };
    }
  }

  return { prisma, session: null };
}
