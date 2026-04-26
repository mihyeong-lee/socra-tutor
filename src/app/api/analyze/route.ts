import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ANALYZE_SYSTEM } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: ANALYZE_SYSTEM,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
          },
          { type: "text", text: "이 문제를 분석해줘." },
        ],
      }],
    });

    const text = response.content.find(b => b.type === "text")?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(clean);

    return NextResponse.json({ ok: true, analysis });
  } catch (e) {
    console.error("[analyze]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
