import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Called by Vercel/Railway Cron on the 1st and 15th of each month.
// Marks all PENDING payouts >= $250 (25000 cents) as PROCESSING.
// Actual transfer is done manually or via Stripe Payouts API.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfMonth = now.getDate();

  // Run only on 1st and 15th
  if (dayOfMonth !== 1 && dayOfMonth !== 15) {
    return NextResponse.json({ skipped: true, day: dayOfMonth });
  }

  // Aggregate pending payouts per coach
  const pendingByCoach = await prisma.payout.groupBy({
    by: ["coachId"],
    where: { status: "PENDING" },
    _sum: { amount: true },
  });

  const processed: string[] = [];
  const skipped: string[] = [];

  for (const group of pendingByCoach) {
    const total = group._sum.amount ?? 0;
    // Minimum payout: $250 = 25000 cents (ТЗ п.7.1)
    if (total < 25000) {
      skipped.push(group.coachId);
      continue;
    }

    // Mark all pending payouts for this coach as PROCESSING
    await prisma.payout.updateMany({
      where: { coachId: group.coachId, status: "PENDING" },
      data: { status: "PROCESSING" },
    });

    processed.push(group.coachId);
  }

  return NextResponse.json({
    ok: true,
    date: now.toISOString(),
    processed: processed.length,
    skipped: skipped.length,
    processedCoachIds: processed,
  });
}
