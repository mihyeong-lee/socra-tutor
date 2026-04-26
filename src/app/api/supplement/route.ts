import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SUPPLEMENT_SYSTEM } from "@/lib/prompts";
import { SupplementRequest } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { reason, currentStepGuide, currentStepQuestion, levelId, masterSolution }: SupplementRequest =
      await req.json();

    const userPrompt = `
【학생이 직접 쓴 어려움】
${reason}

【현재 진행 중인 step】
안내: ${currentStepGuide}
질문: ${currentStepQuestion}

【해설지 참고용】
핵심 개념: ${masterSolution.coreConcepts.join(", ")}
풀이 단계: ${masterSolution.solutionSteps.join(" | ")}
선행 지식: ${masterSolution.prerequisiteKnowledge.join(", ")}
자주 하는 실수: ${masterSolution.commonMistakes.join(", ")}

【현재 레벨】${levelId}
(easy2/easy1이면 type: "mcq"만 허용)

보충 step 1개를 생성해줘.
`.trim();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SUPPLEMENT_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content.find(b => b.type === "text")?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const step = JSON.parse(clean);
    step.isSupplementary = true;

    return NextResponse.json({ ok: true, step });
  } catch (e) {
    console.error("[supplement]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
