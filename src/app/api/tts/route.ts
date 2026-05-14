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

    const { text } = await req.json() as { text: string };
    if (!text?.trim()) return Response.json({ error: "No text" }, { status: 400 });

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[TTS]", err);
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}
