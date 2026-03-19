const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = "PowerInside <noreply@powerinside.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://powerinside.app";

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping email to", params.to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Failed to send:", err);
  }
}

export async function sendInterviewRoundCompletedEmail(params: {
  coachEmail: string;
  coachName: string;
  roundLabel: string;
  insights: string;
}): Promise<void> {
  await sendEmail({
    to: params.coachEmail,
    subject: `PowerInside — Раунд завершено: ${params.roundLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">PowerInside</h2>
        <p>Вітаємо, <strong>${params.coachName}</strong>!</p>
        <p>Ви успішно завершили раунд інтерв'ю: <strong>${params.roundLabel}</strong></p>
        <h3>Ключові інсайти:</h3>
        <p style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${params.insights}</p>
        <p>
          <a href="${APP_URL}/interview" style="background:#f97316;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
            Переглянути повне резюме
          </a>
        </p>
        <p style="color:#999;font-size:12px">PowerInside — платформа для силових видів спорту</p>
      </div>
    `,
  });
}

export async function sendInterviewCompletedEmail(params: {
  coachEmail: string;
  coachName: string;
}): Promise<void> {
  await sendEmail({
    to: params.coachEmail,
    subject: "PowerInside — Інтерв'ю методики завершено!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">PowerInside</h2>
        <p>Вітаємо, <strong>${params.coachName}</strong>!</p>
        <p>Ви завершили всі <strong>7 раундів</strong> інтерв'ю методики.</p>
        <p>Ваша методологія тепер зафіксована в базі знань платформи та доступна атлетам через AI-асистента.</p>
        <p>
          <a href="${APP_URL}/interview" style="background:#f97316;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
            Переглянути базу знань
          </a>
        </p>
        <p style="color:#999;font-size:12px">PowerInside — платформа для силових видів спорту</p>
      </div>
    `,
  });
}
