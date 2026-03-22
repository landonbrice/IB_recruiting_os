/**
 * llm.ts — Provider abstraction layer
 *
 * Routes LLM calls through a unified interface. Switch providers via
 * the LLM_PROVIDER env var ("deepseek" | "anthropic"). Default: deepseek.
 *
 * Both providers yield plain text deltas through the same async iterable.
 * SSE encoding stays in route handlers — this module only handles upstream calls.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type Role = "system" | "user" | "assistant";

interface StreamOptions {
  messages: Array<{ role: Role; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

type Provider = "deepseek" | "anthropic";

function getProvider(): Provider {
  const v = process.env.LLM_PROVIDER?.toLowerCase().trim();
  if (v === "anthropic") return "anthropic";
  return "deepseek";
}

export function getProviderInfo(): { provider: string; model: string } {
  const p = getProvider();
  if (p === "anthropic") return { provider: "anthropic", model: "claude-sonnet-4-20250514" };
  return { provider: "deepseek", model: "deepseek-chat" };
}

// ── DeepSeek (OpenAI-compatible) ────────────────────────────────────────────

async function* streamDeepSeek(opts: StreamOptions): AsyncIterable<string> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const stream = await client.chat.completions.create({
    model: "deepseek-chat",
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature,
    messages: opts.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) yield text;
  }
}

// ── Anthropic ───────────────────────────────────────────────────────────────

async function* streamAnthropic(opts: StreamOptions): AsyncIterable<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Anthropic requires system prompt separate from messages
  const systemMessages = opts.messages.filter((m) => m.role === "system");
  const systemPrompt = systemMessages.map((m) => m.content).join("\n\n");
  const chatMessages = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature,
    system: systemPrompt || undefined,
    messages: chatMessages,
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

// ── Public API ──────────────────────────────────────────────────────────────

export async function streamChatCompletion(
  opts: StreamOptions
): Promise<AsyncIterable<string>> {
  const provider = getProvider();
  if (provider === "anthropic") return streamAnthropic(opts);
  return streamDeepSeek(opts);
}

/** Alias matching the spec in CLAUDE.md */
export const streamChat = streamChatCompletion;

/** Non-streaming completion — collects full response into a single string. */
export async function complete(
  opts: StreamOptions
): Promise<string> {
  const chunks: string[] = [];
  for await (const text of await streamChatCompletion(opts)) {
    chunks.push(text);
  }
  return chunks.join("");
}
