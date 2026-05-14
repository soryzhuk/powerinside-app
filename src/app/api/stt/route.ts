import { NextRequest } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const form = await req.formData();
    const audio = form.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return Response.json({ error: "No audio" }, { status: 400 });
    }

    const file = new File([audio], "audio.webm", { type: audio.type || "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return Response.json({ text: transcription.text });
  } catch (err) {
    console.error("[STT]", err);
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}
