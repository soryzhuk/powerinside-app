import OpenAI from "openai";
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildQASystemPrompt,
  SUPPORT_SYSTEM_PROMPT,
} from "./prompts";

let _openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MODEL = "gpt-4o";
const MAX_TOKENS = 4096;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithCoach(
  messages: ChatMessage[],
  systemPrompt: string = INTERVIEW_SYSTEM_PROMPT
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function chatWithAthlete(
  messages: ChatMessage[],
  coachContext: { coachName: string; coachRules: string }
): Promise<string> {
  const systemPrompt = buildQASystemPrompt(
    coachContext.coachName,
    coachContext.coachRules
  );

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function chatSupport(messages: ChatMessage[]): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: SUPPORT_SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function* streamChatWithCoach(
  messages: ChatMessage[],
  systemPrompt: string = INTERVIEW_SYSTEM_PROMPT
): AsyncGenerator<string, void, unknown> {
  const stream = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

export async function* streamChatWithAthlete(
  messages: ChatMessage[],
  coachContext: { coachName: string; coachRules: string }
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = buildQASystemPrompt(
    coachContext.coachName,
    coachContext.coachRules
  );

  const stream = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

export async function* streamChatSupport(
  messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const stream = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    stream: true,
    messages: [
      { role: "system", content: SUPPORT_SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
