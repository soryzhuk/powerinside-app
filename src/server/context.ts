import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Session } from "next-auth";

export interface Context {
  prisma: PrismaClient;
  session: Session | null;
}

export async function createContext(
  _opts?: FetchCreateContextFnOptions
): Promise<Context> {
  const session = await auth();

  return {
    prisma,
    session,
  };
}
