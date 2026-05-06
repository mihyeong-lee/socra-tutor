import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type PgMessage = { role: "user" | "ai1" | "ai2"; content: string };
type ApiMsg = { role: "user" | "assistant"; content: string };

const AI1_SYSTEM = `당신은 소크라야. 한국 초중고 학생들과 대화하는 따뜻하고 다정한 AI 튜터 친구야.
반말로 편하게 대화하고, 공부든 일상 얘기든 다 들어줘. 항상 격려하고 판단하지 마.
응답은 2~3문장으로 간결하게 해. 이모지를 한두 개 자연스럽게 넣어도 좋아.`;

const AI2_SYSTEM = `당신은 튜터비야. 텐션 높고 유머러스한 AI 친구야.
한국 학생들과 반말로 활기차게 대화해. 장난기 있지만 학업 방해나 일탈 조장은 절대 금지.
소크라(다른 AI)가 이미 답했다면 다른 각도에서 짧게 덧붙여줘.
응답은 1~2문장으로 아주 짧게 해. 이모지와 ㅋㅋ 같은 표현 자연스럽게 써도 돼.`;

function toApiMessages(msgs: PgMessage[], aiRole: "ai1" | "ai2"): ApiMsg[] {
  const result: ApiMsg[] = [];
  for (const msg of msgs) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
    } else if (msg.role === aiRole) {
      result.push({ role: "assistant", content: msg.content });
    }
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode }: { messages: PgMessage[]; mode: "SINGLE" | "GROUP" } = await req.json();

    const ai1Msgs = toApiMessages(messages, "ai1");
    if (!ai1Msgs.length || ai1Msgs[ai1Msgs.length - 1].role !== "user") {
      return NextResponse.json({ ok: false, error: "No user message" }, { status: 400 });
    }

    const ai1Res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: AI1_SYSTEM,
      messages: ai1Msgs,
    });
    const reply1 = ai1Res.content[0].type === "text" ? ai1Res.content[0].text : "";

    let reply2: string | undefined;
    if (mode === "GROUP") {
      const ai2Msgs = toApiMessages(messages, "ai2");
      const lastIdx = ai2Msgs.length - 1;
      if (lastIdx >= 0 && ai2Msgs[lastIdx].role === "user") {
        ai2Msgs[lastIdx] = {
          role: "user",
          content: `${ai2Msgs[lastIdx].content}\n\n[소크라의 답변 참고: ${reply1}]`,
        };
      }
      const ai2Res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        system: AI2_SYSTEM,
        messages: ai2Msgs,
      });
      reply2 = ai2Res.content[0].type === "text" ? ai2Res.content[0].text : "";
    }

    return NextResponse.json({ ok: true, reply1, reply2 });
  } catch (e) {
    console.error("[playground]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
