import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ANSWER_SYSTEM, SIGNAL_SYSTEM } from "@/lib/prompts";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: MediaType; data: string } };

function buildContent(text?: string, imageBase64?: string, mediaType?: string): ContentBlock[] {
  const content: ContentBlock[] = [];
  if (imageBase64 && mediaType) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType as MediaType, data: imageBase64 },
    });
  }
  if (text) content.push({ type: "text", text });
  if (content.length === 0) content.push({ type: "text", text: "이 문제를 풀어줘." });
  return content;
}

async function getAnswer(content: ContentBlock[]): Promise<string> {
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: ANSWER_SYSTEM,
    messages: [{ role: "user", content }],
  });
  return res.content.find(b => b.type === "text")?.text?.trim() ?? "";
}

async function getSignal(a: string, b: string, c: string): Promise<"green" | "yellow"> {
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 10,
    system: SIGNAL_SYSTEM,
    messages: [{
      role: "user",
      content: `A: ${a}\nB: ${b}\nC: ${c}`,
    }],
  });
  const text = res.content.find(b => b.type === "text")?.text?.trim().toLowerCase() ?? "";
  return text.includes("green") ? "green" : "yellow";
}

export async function POST(req: NextRequest) {
  try {
    const { text, imageBase64, mediaType } = await req.json();
    const content = buildContent(text, imageBase64, mediaType);

    const [ansA, ansB, ansC] = await Promise.all([
      getAnswer(content),
      getAnswer(content),
      getAnswer(content),
    ]);

    const signal = await getSignal(ansA, ansB, ansC);

    return NextResponse.json({
      ok: true,
      models: [
        { id: "A", label: "Claude", answer: ansA },
        { id: "B", label: "GPT", answer: ansB },
        { id: "C", label: "Gemini", answer: ansC },
      ],
      signal,
    });
  } catch (e) {
    console.error("[ask]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
