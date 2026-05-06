import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CHAT_SYSTEM } from "@/lib/prompts";
import { ChatMessage } from "@/types";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

type ApiContent =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: MediaType; data: string } };

type ApiMessage = { role: "user" | "assistant"; content: string | ApiContent[] };

export async function POST(req: NextRequest) {
  try {
    const { messages, context, imageBase64, mediaType, questionText }: {
      messages: ChatMessage[];
      context?: string;
      imageBase64?: string;
      mediaType?: string;
      questionText?: string;
    } = await req.json();

    const system = context
      ? `${CHAT_SYSTEM}\n\n【원래 질문/문제 맥락】\n${context}`
      : CHAT_SYSTEM;

    // chatMessages가 assistant(모델 답변)로 시작하는 경우 분리
    const firstIsAssistant = messages.length > 0 && messages[0].role === "assistant";
    const modelAnswer = firstIsAssistant ? (messages[0].content as string) : null;
    // 실제 대화 (모델 답변 이후 부분, user부터 시작)
    const tail = firstIsAssistant ? messages.slice(1) : messages;
    const firstUserIdx = tail.findIndex(m => m.role === "user");
    const conversation = firstUserIdx >= 0 ? tail.slice(firstUserIdx) : [];

    const apiMessages: ApiMessage[] = [];

    if (imageBase64 && mediaType) {
      // 이미지 있음: user=이미지+질문텍스트, assistant=모델답변
      const userContent: ApiContent[] = [
        { type: "image", source: { type: "base64", media_type: mediaType as MediaType, data: imageBase64 } },
      ];
      if (questionText) userContent.push({ type: "text", text: questionText });
      apiMessages.push({ role: "user", content: userContent });
      apiMessages.push({ role: "assistant", content: modelAnswer ?? "네, 문제를 확인했어요!" });
    } else if (questionText) {
      // 텍스트만 있음: user=질문, assistant=모델답변
      apiMessages.push({ role: "user", content: questionText });
      if (modelAnswer) apiMessages.push({ role: "assistant", content: modelAnswer });
    } else if (modelAnswer) {
      // 문제 인풋 없음: 모델 답변만 있으면 대화에서 제외하고 시작
    }

    // 이후 실제 대화 추가
    for (const m of conversation) {
      apiMessages.push({ role: m.role, content: m.content });
    }

    if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role !== "user") {
      return NextResponse.json({ ok: false, error: "No user message to respond to" }, { status: 400 });
    }

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: apiMessages,
    });

    const reply = res.content.find(b => b.type === "text")?.text ?? "";
    return NextResponse.json({ ok: true, reply });
  } catch (e) {
    console.error("[chat]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
