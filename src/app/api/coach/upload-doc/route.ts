import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "COACH") {
    return NextResponse.json({ error: "Coaches only" }, { status: 403 });
  }

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Allowed types: JPEG, PNG, WebP, PDF" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Max file size: ${MAX_SIZE_MB}MB` }, { status: 400 });
  }

  // Save to public/uploads/docs/ (ephemeral on Railway, acceptable for MVP)
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${profile.id}_${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "docs");

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const docUrl = `/uploads/docs/${filename}`;

  await prisma.coachProfile.update({
    where: { id: profile.id },
    data: { identityDoc: docUrl },
  });

  return NextResponse.json({ ok: true, url: docUrl });
}
