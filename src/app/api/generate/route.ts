import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { GENERATE_SYSTEM } from "@/lib/prompts";
import { ProblemAnalysis } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, analysis }: {
      imageBase64: string;
      mediaType: string;
      analysis: ProblemAnalysis;
    } = await req.json();

    const userPrompt = `
과목: ${analysis.subject}
학년: ${analysis.grade}
학기: ${analysis.semester}
단원: ${analysis.unit}
문제 요약: ${analysis.problemSummary}
${analysis.isMultipleChoice ? `보기: ${analysis.choices.join(" / ")}` : "주관식 문제"}

위 정보를 기반으로 3단계 튜터링 플로우를 생성해줘.
해설지(masterSolution)를 먼저 완성하고, 그걸 기반으로 각 레벨 step을 만들어줘.
`.trim();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: GENERATE_SYSTEM,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
          },
          { type: "text", text: userPrompt },
        ],
      }],
    });

    const text = response.content.find(b => b.type === "text")?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const tutoring = JSON.parse(clean);

    return NextResponse.json({ ok: true, tutoring });
  } catch (e) {
    console.error("[generate]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
