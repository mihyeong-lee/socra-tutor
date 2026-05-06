import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ANALYZE_SYSTEM } from "@/lib/prompts";

export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } };

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, text } = await req.json();

    const content: ContentBlock[] = [];
    if (imageBase64 && mediaType) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
      });
    }
    content.push({ type: "text", text: text ? `문제: ${text}\n\n이 문제를 분석해줘.` : "이 문제를 분석해줘." });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: ANALYZE_SYSTEM,
      messages: [{ role: "user", content }],
    });

    const raw = response.content.find(b => b.type === "text")?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in response");
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ ok: true, analysis });
  } catch (e) {
    console.error("[analyze]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
