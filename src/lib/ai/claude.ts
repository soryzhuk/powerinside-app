import Anthropic from "@anthropic-ai/sdk";
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildQASystemPrompt,
  SUPPORT_SYSTEM_PROMPT,
} from "./prompts";

// Lazy initialization to avoid build-time errors when ANTHROPIC_API_KEY is not set
let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send messages to Claude for coach interview or general coach interaction.
 * Returns the full response text.
 */
export async function chatWithCoach(
  messages: ChatMessage[],
  systemPrompt: string = INTERVIEW_SYSTEM_PROMPT
): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Send messages to Claude for athlete Q&A based on coach's methodology.
 * Returns the full response text.
 */
export async function chatWithAthlete(
  messages: ChatMessage[],
  coachContext: { coachName: string; coachRules: string }
): Promise<string> {
  const systemPrompt = buildQASystemPrompt(
    coachContext.coachName,
    coachContext.coachRules
  );

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Send messages to Claude for technical support.
 * Returns the full response text.
 */
export async function chatSupport(messages: ChatMessage[]): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SUPPORT_SYSTEM_PROMPT,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Stream responses from Claude for coach interview.
 * Yields text chunks as they arrive.
 */
export async function* streamChatWithCoach(
  messages: ChatMessage[],
  systemPrompt: string = INTERVIEW_SYSTEM_PROMPT
): AsyncGenerator<string, void, unknown> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Stream responses from Claude for athlete Q&A.
 * Yields text chunks as they arrive.
 */
export async function* streamChatWithAthlete(
  messages: ChatMessage[],
  coachContext: { coachName: string; coachRules: string }
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = buildQASystemPrompt(
    coachContext.coachName,
    coachContext.coachRules
  );

  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Stream responses from Claude for technical support.
 * Yields text chunks as they arrive.
 */
export async function* streamChatSupport(
  messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SUPPORT_SYSTEM_PROMPT,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
