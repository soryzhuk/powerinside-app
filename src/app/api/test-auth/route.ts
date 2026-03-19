import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log("Test auth - looking up:", email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("Test auth - user found:", !!user, "has hash:", !!user?.passwordHash);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await compare(password, user.passwordHash);
    console.log("Test auth - password valid:", valid);

    return NextResponse.json({
      found: true,
      passwordValid: valid,
      role: user.role,
      id: user.id
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
