import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { GENERATE_SYSTEM } from "@/lib/prompts";
import { ProblemAnalysis, LevelId } from "@/types";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LEVEL_META: Record<LevelId, { label: string; sublabel: string; emoji: string; color: string }> = {
  easy2: { label: "아주 쉬운 설명", sublabel: "눈으로 따라가기", emoji: "🌱", color: "#4ade80" },
  easy1: { label: "쉬운 설명", sublabel: "개념 연결 중심", emoji: "📘", color: "#60a5fa" },
  normal: { label: "기본 설명", sublabel: "정규 수준", emoji: "🔥", color: "#f59e0b" },
};

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } };

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, text, analysis, levelId }: {
      imageBase64?: string;
      mediaType?: string;
      text?: string;
      analysis: ProblemAnalysis;
      levelId: LevelId;
    } = await req.json();

    const meta = LEVEL_META[levelId];

    const userPrompt = `
과목: ${analysis.subject}
학년: ${analysis.grade}
학기: ${analysis.semester}
단원: ${analysis.unit}
문제 요약: ${analysis.problemSummary}
${analysis.isMultipleChoice ? `보기: ${analysis.choices.join(" / ")}` : "주관식 문제"}

【요청 레벨】
id: "${levelId}"
label: "${meta.label}"
sublabel: "${meta.sublabel}"
emoji: "${meta.emoji}"
color: "${meta.color}"

이 레벨에 맞는 masterSolution과 level 하나만 생성해줘.
step은 최대 3개로 제한해. JSON만 출력해.
`.trim();

    const content: ContentBlock[] = [];
    if (imageBase64 && mediaType) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
      });
    }
    const fullPrompt = text ? `원래 문제:\n${text}\n\n${userPrompt}` : userPrompt;
    content.push({ type: "text", text: fullPrompt });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: GENERATE_SYSTEM,
      messages: [{ role: "user", content }],
    });

    const raw = response.content.find(b => b.type === "text")?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in response");
    const tutoring = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ ok: true, tutoring });
  } catch (e) {
    console.error("[generate]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
