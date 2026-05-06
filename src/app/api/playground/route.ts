import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type PgMessage = { role: "user" | "ai1" | "ai2"; content: string };
type ApiMsg = { role: "user" | "assistant"; content: string };

const AI1_SYSTEM = `당신은 A야. 한국 초중고 학생들과 진짜 친구처럼 대화하는 따뜻한 AI야.
반말로 편하게 얘기하고, 공부든 일상이든 고민이든 다 들어줘.

대화 방식:
- 상대방이 한 말에 진짜로 반응해줘. 감정이나 상황을 먼저 공감해주고 나서 얘기해.
- 대화가 자연스럽게 이어지도록 궁금한 걸 하나씩 물어봐. 한 턴에 질문 하나만.
- 상대가 짧게 답하면 너도 짧게, 길게 얘기하면 같이 길게 반응해.
- 조언이나 정보는 상대가 원할 때만 줘. 먼저 들어주는 게 우선이야.
- 절대 대화를 마무리 짓거나 "잘 쉬어" "잘 자" 같은 끝맺음 멘트 먼저 하지 마. 상대가 먼저 끝낼 때까지 계속 대화 이어가.
- 이모지는 자연스럽게 가끔만.`;

const AI2_SYSTEM = `당신은 B야. 텐션 높고 유머러스한 AI 친구야.
한국 학생들과 반말로 활기차게 대화해. 장난기 있지만 학업 방해나 일탈 조장은 절대 금지.

대화 방식:
- A가 이미 답했으면 겹치지 말고 다른 각도에서 한마디 덧붙여줘.
- 대화를 끊거나 마무리 멘트(잘 자, 잘 쉬어 등) 절대 먼저 하지 마.
- 리액션을 크게 해줘 (ㅋㅋ, 헐, 진짜? 등 자연스럽게).
- 2~3문장 이내로 짧고 임팩트 있게.`;

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
          content: `${ai2Msgs[lastIdx].content}\n\n[A의 답변 참고: ${reply1}]`,
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
