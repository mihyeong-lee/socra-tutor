"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ProblemAnalysis, TutoringData, TutorStep, LevelId, ReportData, ChatMessage, InputData } from "@/types";

type Phase =
  | "home" | "asking" | "report" | "chatting"
  | "analyzing" | "confirm" | "select" | "generating" | "tutor" | "complete"
  | "playground" | "pgTopic" | "pgPartner";

type SelectedMode = "해설지" | "튜터링" | "고민상담";

type PlaygroundMode = "SINGLE" | "GROUP";
type PgMessage = { role: "user" | "ai1" | "ai2"; content: string };
type ModelStatusValue = "waiting" | "solving" | "done";
type ModelStatus = { A: ModelStatusValue; B: ModelStatusValue; C: ModelStatusValue };

const SUBJECTS = ["수학","영어","국어","과학","사회","역사","기술가정","도덕","음악","미술","기타"];
const GRADES = ["초5","초6","중1","중2","중3","고1","고2","고3"];
const LEVEL_DEFS = [
  { id: "easy2" as const, label: "아주 쉬운 설명", sublabel: "눈으로 따라가기", emoji: "🌱", color: "#16a34a" },
  { id: "easy1" as const, label: "쉬운 설명", sublabel: "개념 연결 중심", emoji: "📘", color: "#2563eb" },
  { id: "normal" as const, label: "기본 설명", sublabel: "정규 수준", emoji: "🔥", color: "#d97706" },
];

const PG_FIRST_MSG: Record<string, Record<string, string>> = {
  "소라": {
    "공부": "안녕! 나 소라야 🐶 공부 얘기 들어줄게~ 요즘 어떤 거 때문에 힘들어?",
    "심심": "안녕! 나 소라야 🐶 심심하구나ㅋㅋ 나도 마침 할 거 없었어~ 뭐 얘기할까?",
  },
  "크라": {
    "공부": "크라야 🦉 공부 고민? 말해봐. 같이 생각해볼게.",
    "심심": "크라야 🦉 심심하면 나한테 잘 왔어. 뭐든 얘기해봐.",
  },
};

export default function Page() {
  const [phase, setPhase] = useState<Phase>("home");
  const [selectedMode, setSelectedMode] = useState<SelectedMode>("해설지");

  // ── 인풋 ──
  const [inputText, setInputText] = useState("");
  const [inputImage, setInputImage] = useState<InputData | null>(null);
  const [tutoringMode, setTutoringMode] = useState(false);

  // ── 리포트 ──
  const [report, setReport] = useState<ReportData | null>(null);

  // ── 채팅 ──
  const [chatModelLabel, setChatModelLabel] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatContext, setChatContext] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ── 튜터링 ──
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [tutoring, setTutoring] = useState<TutoringData | null>(null);
  const [levelIdx, setLevelIdx] = useState<number | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [steps, setSteps] = useState<TutorStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [shortInput, setShortInput] = useState("");
  const [fbType, setFbType] = useState<"" | "correct" | "hint1" | "hint2" | "reveal">("");
  const [wrongs, setWrongs] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [handRaise, setHandRaise] = useState(false);
  const [handRaiseMode, setHandRaiseMode] = useState<"" | "custom">("");
  const [handRaiseText, setHandRaiseText] = useState("");
  const [supplementLoading, setSupplementLoading] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [error, setError] = useState("");

  // ── 분석 결과 편집 ──
  const [editSubject, setEditSubject] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editUnit, setEditUnit] = useState("");

  // ── 해설지 ──
  const [showSolution, setShowSolution] = useState(false);

  // ── 모델 로딩 상태 ──
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ A: "waiting", B: "waiting", C: "waiting" });

  // ── 플레이그라운드 ──
  const [pgMessages, setPgMessages] = useState<PgMessage[]>([]);
  const [pgInput, setPgInput] = useState("");
  const [pgLoading, setPgLoading] = useState(false);
  const [pgMode, setPgMode] = useState<PlaygroundMode>("SINGLE");
  const [pgTurnCount, setPgTurnCount] = useState(0);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [pgModeSelected, setPgModeSelected] = useState(false);
  const [pgTopic, setPgTopic] = useState<"공부" | "심심" | null>(null);
  const [pgPartner, setPgPartner] = useState<"소라" | "크라" | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pgEndRef = useRef<HTMLDivElement>(null);

  const level = levelIdx !== null && tutoring ? tutoring.levels[levelIdx] : null;
  const step = steps[stepIdx] ?? null;
  const isOk = fbType === "correct";
  const canNext = isOk || fbType === "reveal";
  const showFb = fbType !== "";

  useEffect(() => {
    if (phase !== "generating") { setGenProgress(0); return; }
    const timer = setInterval(() => {
      setGenProgress(p => p < 88 ? +(p + (88 - p) * 0.055).toFixed(1) : p);
    }, 400);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    pgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pgMessages]);

  const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setError("JPG · PNG · GIF · WEBP만 지원해. 아이폰 사진(HEIC)은 카메라 설정에서 '호환성 우선'으로 바꾸거나, JPG로 변환 후 업로드해줘!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setInputImage({
        imageBase64: dataUrl.split(",")[1],
        mediaType: file.type,
        preview: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // ── 질문 제출 ──
  async function askModels(tutoring = false) {
    if (!inputText.trim() && !inputImage) return;
    setTutoringMode(tutoring);
    setPhase("asking");
    setError("");
    setModelStatus({ A: "solving", B: "waiting", C: "waiting" });
    const timerB = setTimeout(() => setModelStatus(prev => ({ ...prev, B: "solving" })), 800);
    const timerC = setTimeout(() => setModelStatus(prev => ({ ...prev, C: "solving" })), 1600);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim() || undefined,
          imageBase64: inputImage?.imageBase64,
          mediaType: inputImage?.mediaType,
        }),
      });
      const data = await res.json();
      clearTimeout(timerB);
      clearTimeout(timerC);
      if (!data.ok) throw new Error(data.error);
      setModelStatus(s => ({ ...s, A: "done" }));
      setTimeout(() => setModelStatus(s => ({ ...s, B: "done" })), 150);
      setTimeout(() => setModelStatus(s => ({ ...s, C: "done" })), 300);
      setTimeout(() => {
        setReport({ models: data.models, signal: data.signal });
        setPhase("report");
      }, 700);
    } catch {
      clearTimeout(timerB);
      clearTimeout(timerC);
      setModelStatus({ A: "waiting", B: "waiting", C: "waiting" });
      setError("분석 실패. 다시 시도해줘.");
      setPhase("home");
    }
  }

  // ── 튜터링 ──
  async function goTutoring() {
    setPhase("analyzing");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim() || undefined,
          imageBase64: inputImage?.imageBase64,
          mediaType: inputImage?.mediaType,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      setEditSubject(data.analysis.subject);
      setEditGrade(data.analysis.grade);
      setEditSemester(data.analysis.semester);
      setEditUnit(data.analysis.unit);
      setPhase("confirm");
    } catch {
      setError("분석 실패. 다시 시도해줘.");
      setPhase("report");
    }
  }

  function confirmAnalysis() {
    if (!analysis) return;
    setAnalysis({ ...analysis, subject: editSubject, grade: editGrade, semester: editSemester, unit: editUnit });
    setPhase("select");
  }

  async function pickLevel(levelDef: typeof LEVEL_DEFS[0]) {
    if (!analysis) return;
    setSelectedLevelId(levelDef.id);
    setPhase("generating");
    setError("");
    setGenProgress(0);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim() || undefined,
          imageBase64: inputImage?.imageBase64,
          mediaType: inputImage?.mediaType,
          analysis,
          levelId: levelDef.id,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setGenProgress(100);
      const generatedLevel = data.tutoring.level;
      setTimeout(() => {
        setTutoring({ masterSolution: data.tutoring.masterSolution, analysis, levels: [generatedLevel] });
        setLevelIdx(0);
        setSteps([...generatedLevel.steps]);
        setStepIdx(0); setAttempt(0); setChosen(null);
        setShortInput(""); setFbType(""); setWrongs(0);
        setHandRaise(false); setHandRaiseMode(""); setHandRaiseText("");
        setShowIntro(true);
        setPhase("tutor");
      }, 300);
    } catch {
      setError("튜터링 생성 실패. 다시 시도해줘.");
      setPhase("select");
    }
  }

  // ── 모델 채팅 ──
  function openChat(modelLabel: string) {
    setChatModelLabel(modelLabel);
    const modelResult = report?.models.find(m => m.label === modelLabel);
    const contextParts: string[] = [];
    if (inputText) contextParts.push(`학생의 질문: ${inputText}`);
    if (modelResult) contextParts.push(`${modelLabel}의 답변: ${modelResult.answer}`);
    setChatContext(contextParts.join("\n"));
    setChatMessages(modelResult ? [{ role: "assistant", content: modelResult.answer }] : []);
    setChatInput("");
    setPhase("chatting");
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: chatContext,
          imageBase64: inputImage?.imageBase64,
          mediaType: inputImage?.mediaType,
          questionText: inputText.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "오류가 발생했어. 다시 시도해줘." }]);
    } finally {
      setChatLoading(false);
    }
  }

  // ── MCQ ──
  function pickMCQ(i: number) {
    if (showFb || !step || step.type !== "mcq") return;
    setChosen(i);
    if (i === step.correct) {
      setFbType("correct");
    } else {
      const next = attempt + 1;
      setAttempt(next); setWrongs(w => w + 1);
      setFbType(next === 1 ? "hint1" : next === 2 ? "hint2" : "reveal");
    }
  }

  function submitShort() {
    if (!shortInput.trim() || !step || step.type !== "short") return;
    const kw = step.keywords;
    const matched = kw.filter((k: string) => shortInput.includes(k)).length;
    if (matched >= Math.ceil(kw.length * 0.5)) {
      setFbType("correct");
    } else {
      const next = attempt + 1;
      setAttempt(next); setWrongs(w => w + 1);
      setFbType(next === 1 ? "hint1" : next === 2 ? "hint2" : "reveal");
    }
  }

  function next() {
    if (stepIdx + 1 >= steps.length) { setPhase("complete"); return; }
    setStepIdx(s => s + 1);
    setAttempt(0); setChosen(null); setShortInput("");
    setFbType(""); setHandRaise(false); setHandRaiseMode(""); setHandRaiseText("");
  }

  async function handleHandRaise(reason: string) {
    if (!tutoring || !level || !step || !reason.trim()) return;
    setHandRaise(false); setHandRaiseMode(""); setHandRaiseText("");
    setSupplementLoading(true);
    try {
      const res = await fetch("/api/supplement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          currentStepGuide: step.guide,
          currentStepQuestion: step.question,
          levelId: level.id as LevelId,
          masterSolution: tutoring.masterSolution,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const newSteps = [...steps];
      newSteps.splice(stepIdx + 1, 0, data.step);
      setSteps(newSteps);
    } catch { /* 실패 시 무시 */ }
    finally { setSupplementLoading(false); }
  }

  function getFeedbackText(): string {
    if (!step) return "";
    if (fbType === "correct") return (step as any).feedbackCorrect ?? "";
    if (fbType === "reveal") return step.feedbackReveal ?? "";
    if (fbType === "hint1") return step.hint1;
    if (fbType === "hint2") return step.hint2;
    return "";
  }

  // ── 고민 모드 (파트너 선택) ──
  function selectPartner(partner: "소라" | "크라") {
    const topic = pgTopic ?? "심심";
    setPgPartner(partner);
    setPgMode("SINGLE");
    setPgModeSelected(true);
    setPgTurnCount(0);
    setShowJoinPopup(false);
    setPgInput("");
    setPgMessages([{ role: "ai1", content: PG_FIRST_MSG[partner][topic] }]);
    setPhase("playground");
  }

  async function sendPgMessage() {
    if (!pgInput.trim() || pgLoading) return;
    const userMsg: PgMessage = { role: "user", content: pgInput.trim() };
    const newMessages = [...pgMessages, userMsg];
    setPgMessages(newMessages);
    setPgInput("");
    const newTurnCount = pgTurnCount + 1;
    setPgTurnCount(newTurnCount);
    setPgLoading(true);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, mode: pgMode, partner: pgPartner, topic: pgTopic }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const withAi1 = [...newMessages, { role: "ai1" as const, content: data.reply1 }];
      if (pgMode === "GROUP" && data.reply2) {
        setPgMessages([...withAi1, { role: "ai2" as const, content: data.reply2 }]);
      } else {
        setPgMessages(withAi1);
      }
      if (newTurnCount === 5 && pgMode === "SINGLE") {
        setTimeout(() => setShowJoinPopup(true), 600);
      }
    } catch {
      setPgMessages(prev => [...prev, { role: "ai1", content: "오류가 발생했어. 다시 시도해줘!" }]);
    } finally {
      setPgLoading(false);
    }
  }

  function handleJoinAccept() {
    setShowJoinPopup(false);
    setPgMode("GROUP");
    const joinMsg = pgPartner === "소라"
      ? "와! 나 크라야 🦉 기다리고 있었는데ㅋㅋ 같이 얘기하자!"
      : "나 소라야 🐶 와줬다! 같이 얘기하면 재밌겠다~";
    setPgMessages(prev => [...prev, { role: "ai2", content: joinMsg }]);
  }

  function handleJoinReject() {
    setShowJoinPopup(false);
    const msg = pgPartner === "소라"
      ? "알겠어! 우리 둘이 계속 얘기하자 😊"
      : "그래. 우리끼리 계속가자.";
    setPgMessages(prev => [...prev, { role: "ai1", content: msg }]);
  }

  function reset() {
    setPhase("home");
    setSelectedMode("해설지");
    setInputText(""); setInputImage(null); setTutoringMode(false);
    setReport(null);
    setChatModelLabel(""); setChatMessages([]); setChatContext(""); setChatInput("");
    setAnalysis(null); setTutoring(null);
    setLevelIdx(null); setSelectedLevelId(null); setSteps([]); setStepIdx(0);
    setAttempt(0); setChosen(null); setShortInput("");
    setFbType(""); setWrongs(0); setHandRaise(false);
    setHandRaiseMode(""); setHandRaiseText("");
    setShowIntro(false); setError("");
    setEditSubject(""); setEditGrade(""); setEditSemester(""); setEditUnit("");
    setShowSolution(false);
    setModelStatus({ A: "waiting", B: "waiting", C: "waiting" });
    setPgMessages([]); setPgInput(""); setPgLoading(false);
    setPgMode("SINGLE"); setPgTurnCount(0); setShowJoinPopup(false);
    setPgModeSelected(false); setPgTopic(null); setPgPartner(null);
  }

  const canSubmit = inputText.trim().length > 0 || inputImage !== null;

  // playground 캐릭터 스타일 헬퍼
  const pgPartnerEmoji = pgPartner === "소라" ? "🐶" : "🦉";
  const pgOtherEmoji = pgPartner === "소라" ? "🦉" : "🐶";
  const pgOtherName = pgPartner === "소라" ? "크라" : "소라";
  const pgAi1Bg = pgPartner === "소라" ? "#fffbeb" : "#f5f3ff";
  const pgAi1Border = pgPartner === "소라" ? "#f59e0b44" : "#7c3aed44";
  const pgAi2Bg = pgPartner === "소라" ? "#f5f3ff" : "#fffbeb";
  const pgAi2Border = pgPartner === "소라" ? "#7c3aed44" : "#f59e0b44";

  return (
    <div style={S.root}>
      <header style={S.header}>
        <button onClick={reset} style={S.logo}>
          <span style={{ color: "#f59e0b" }}>S</span>OCRA
          <span style={{ color: "#bbb", fontSize: 10, marginLeft: 4, letterSpacing: 2 }}>TUTOR</span>
        </button>
        {level && (
          <span style={{ ...S.chip, color: level.color, borderColor: level.color + "55" }}>
            {level.emoji} {level.label}
          </span>
        )}
        {phase === "playground" && pgPartner && (
          <span style={{ fontSize: 13, color: "#444", fontWeight: 700 }}>
            {pgPartner === "소라" ? "소라 🐶" : "크라 🦉"}
            {pgMode === "GROUP" && (pgPartner === "소라" ? " & 크라 🦉" : " & 소라 🐶")}
          </span>
        )}
      </header>

      {phase === "tutor" && !showIntro && (inputImage?.preview || inputText) && (
        <div style={S.problemBar}>
          {inputImage?.preview
            ? <img src={inputImage.preview} alt="문제" style={S.problemBarImg} />
            : <div style={{ fontSize: 12, color: "#999", maxWidth: 440, width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }}>{inputText}</div>
          }
        </div>
      )}

      <main style={S.main}>

        {/* ══ HOME ══ */}
        {phase === "home" && (
          <div style={S.card}>
            {/* 모드 탭 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["해설지모드", "튜터링모드", "고민상담모드"] as const).map((label) => {
                const key = label.replace("모드", "") as SelectedMode;
                const active = selectedMode === key;
                return (
                  <button
                    key={label}
                    onClick={() => setSelectedMode(key)}
                    style={{
                      flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", border: "1.5px solid",
                      borderColor: active ? "#f59e0b" : "#e0e0db",
                      background: active ? "#fffbeb" : "#f5f5f2",
                      color: active ? "#d97706" : "#aaa",
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 고민상담 모드 안내 */}
            {selectedMode === "고민상담" && (
              <div style={{ ...S.infoBox, marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                  소라 🐶 또는 크라 🦉 와 1:1 대화<br />
                  <span style={{ fontSize: 12, color: "#bbb" }}>공부 고민이든 그냥 심심해서든 다 OK</span>
                </div>
              </div>
            )}

            {/* 입력 영역 (고민상담 외) */}
            {selectedMode !== "고민상담" && (
              <>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={selectedMode === "튜터링" ? "같이 풀 문제를 입력해봐..." : "질문이나 문제를 직접 입력해봐..."}
                  style={S.textarea}
                />

                <div
                  style={{ ...S.drop, minHeight: 80, marginTop: 10 }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                >
                  {inputImage?.preview ? (
                    <div style={{ position: "relative", textAlign: "center" }}>
                      <img src={inputImage.preview} alt="업로드된 이미지" style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
                      <button onClick={e => { e.stopPropagation(); setInputImage(null); }}
                        style={{ position: "absolute", top: -8, right: -8, background: "#ddd", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#555", cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
                      <div style={{ fontSize: 13, color: "#888" }}>이미지 클릭 또는 드래그</div>
                      <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>JPG · PNG · HEIC</div>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }}
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                </div>
              </>
            )}

            {error && <div style={S.err}>{error}</div>}

            <button
              style={{
                ...S.cta,
                opacity: selectedMode === "고민상담" || canSubmit ? 1 : 0.4,
              }}
              onClick={() => {
                if (selectedMode === "고민상담") {
                  setPhase("pgTopic");
                } else {
                  askModels(selectedMode === "튜터링");
                }
              }}
              disabled={selectedMode !== "고민상담" && !canSubmit}
            >
              {selectedMode === "고민상담" ? "대화 시작하기 →" : "분석 시작 →"}
            </button>
          </div>
        )}

        {/* ══ ASKING ══ */}
        {phase === "asking" && (
          <div style={{ ...S.card, paddingTop: 32 }}>
            {inputImage?.preview && <img src={inputImage.preview} alt="" style={S.previewImg} />}
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 6, textAlign: "center" }}>
              풀이 중이야, 잠깐만!
            </div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 22, textAlign: "center" }}>
              Claude · GPT · Gemini가 동시에 분석 중
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { key: "A" as const, label: "Claude" },
                { key: "B" as const, label: "GPT" },
                { key: "C" as const, label: "Gemini" },
              ]).map(({ key, label }) => {
                const status = modelStatus[key];
                return (
                  <div key={key} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "#f5f5f2", border: "1px solid #e8e8e4",
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#eeeee9", border: "1px solid #e0e0db",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: "#888", flexShrink: 0,
                    }}>
                      {label[0]}
                    </div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#111" }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      {status === "waiting" && (
                        <span style={{ color: "#ccc" }}>⏳ 풀이 대기 중</span>
                      )}
                      {status === "solving" && (
                        <span style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            width: 13, height: 13,
                            border: "2px solid #fde68a",
                            borderTop: "2px solid #f59e0b",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.75s linear infinite",
                          }} />
                          풀이 중...
                        </span>
                      )}
                      {status === "done" && (
                        <span style={{ color: "#16a34a" }}>✅ 완료</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ REPORT ══ */}
        {phase === "report" && report && (
          <div style={S.card}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              {inputImage?.preview && <img src={inputImage.preview} alt="문제" style={{ ...S.previewImg, marginBottom: 12 }} />}
              {inputText && (
                <div style={{ ...S.infoBox, textAlign: "left", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>📝 질문</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{inputText}</div>
                </div>
              )}
              <div style={{ fontSize: 44, marginBottom: 4 }}>
                {report.signal === "green" ? "🟢" : "🟡"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: report.signal === "green" ? "#16a34a" : "#d97706" }}>
                {report.signal === "green" ? "3개 모델 모두 같은 답" : "모델 간 답이 달라"}
              </div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                {report.signal === "green" ? "정답일 가능성이 높아" : "각 모델의 풀이를 확인해봐"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {report.models.map((m) => (
                <div key={m.id} style={{
                  background: "#f7f7f5", border: "1px solid #e8e8e4",
                  borderRadius: 12, padding: "13px 15px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: "#ccc" }}>모델 {m.id}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 10, letterSpacing: tutoringMode ? 3 : 0 }}>
                    {tutoringMode ? "●●●●●" : m.answer}
                  </div>
                  <button
                    onClick={() => openChat(m.label)}
                    style={{ ...S.ghost, marginTop: 0, padding: "8px 12px", fontSize: 12, width: "auto" }}
                  >
                    💬 이 모델과 대화하기
                  </button>
                </div>
              ))}
            </div>

            {tutoringMode && (
              <button style={S.cta} onClick={goTutoring}>
                🎓 튜터링 하러가기
              </button>
            )}
            <button style={S.ghost} onClick={() => setPhase("home")}>← 다시 입력</button>
          </div>
        )}

        {/* ══ CHATTING ══ */}
        {phase === "chatting" && (
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button onClick={() => setPhase("report")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>←</button>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{chatModelLabel}</div>
            </div>

            {(inputImage?.preview || inputText) && (
              <div style={{ ...S.infoBox, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>📋 원래 문제</div>
                {inputImage?.preview && (
                  <img src={inputImage.preview} alt="문제" style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 8, marginBottom: inputText ? 8 : 0, border: "1px solid #e0e0db" }} />
                )}
                {inputText && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{inputText}</div>}
              </div>
            )}

            <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {chatMessages.map((msg, i) => (
                <div key={i}>
                  {i === 0 && msg.role === "assistant" && (
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>{chatModelLabel}의 답변</div>
                  )}
                  <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "82%", padding: "10px 13px",
                      borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "4px 12px 12px 12px",
                      background: msg.role === "user" ? "#f59e0b" : "#eeeee9",
                      border: msg.role === "assistant" ? "1px solid #e0e0db" : "none",
                      fontSize: 13, color: msg.role === "user" ? "#000" : "#444",
                      lineHeight: 1.6, whiteSpace: "pre-wrap",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", gap: 5, padding: "10px 13px" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ccc", animation: `bounce 1s ${i*0.2}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="메시지 입력..."
                style={{ ...S.inp, flex: 1, padding: "11px 13px", fontSize: 13 }}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                style={{ padding: "11px 16px", background: "#f59e0b", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, cursor: "pointer", opacity: chatInput.trim() ? 1 : 0.4 }}
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* ══ ANALYZING ══ */}
        {phase === "analyzing" && (
          <div style={{ ...S.card, textAlign: "center", paddingTop: 48 }}>
            <div style={S.spin} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 8 }}>문제 분석 중…</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>과목·학년·단원 판별 중</div>
          </div>
        )}

        {/* ══ CONFIRM ══ */}
        {phase === "confirm" && analysis && (
          <div style={S.card}>
            <h2 style={S.h1}>문제 정보 확인</h2>
            <p style={S.sub}>AI가 분석한 내용이야. 틀린 부분이 있으면 수정해줘</p>

            {inputImage?.preview && (
              <img src={inputImage.preview} alt="문제" style={{ ...S.previewImg, marginBottom: 14 }} />
            )}
            {inputText && (
              <div style={{ ...S.infoBox, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>📝 입력한 문제</div>
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{inputText}</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div style={S.fieldRow}>
                <label style={S.fieldLabel}>과목</label>
                <select value={editSubject} onChange={e => setEditSubject(e.target.value)} style={S.select}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={S.fieldRow}>
                <label style={S.fieldLabel}>학년</label>
                <select value={editGrade} onChange={e => setEditGrade(e.target.value)} style={S.select}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={S.fieldRow}>
                <label style={S.fieldLabel}>학기</label>
                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                  {["1학기", "2학기"].map(sem => (
                    <button key={sem} onClick={() => setEditSemester(sem)} style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, cursor: "pointer",
                      background: editSemester === sem ? "#fffbeb" : "#f5f5f2",
                      border: `1.5px solid ${editSemester === sem ? "#f59e0b" : "#e0e0db"}`,
                      color: editSemester === sem ? "#d97706" : "#888", fontWeight: editSemester === sem ? 700 : 400,
                    }}>{sem}</button>
                  ))}
                </div>
              </div>
              <div style={S.fieldRow}>
                <label style={S.fieldLabel}>단원</label>
                <input
                  value={editUnit}
                  onChange={e => setEditUnit(e.target.value)}
                  style={{ ...S.inp, flex: 1, padding: "9px 12px", fontSize: 13 }}
                  placeholder="단원명을 입력해줘"
                />
              </div>
            </div>

            <div style={{ ...S.infoBox, marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>💬 문제 요약</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{analysis.problemSummary}</div>
            </div>

            {error && <div style={S.err}>{error}</div>}

            <button style={S.cta} onClick={confirmAnalysis}>
              이대로 튜터링 시작 →
            </button>
            <button style={S.ghost} onClick={() => setPhase("report")}>← 리포트로 돌아가기</button>
          </div>
        )}

        {/* ══ SELECT ══ */}
        {phase === "select" && analysis && (
          <div style={S.card}>
            <div style={S.infoBox}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>
                {analysis.grade} {analysis.subject} · {analysis.unit}
              </div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{analysis.problemSummary}</div>
            </div>
            <h2 style={{ ...S.h1, marginTop: 18 }}>어떻게 설명해줄까?</h2>
            <p style={S.sub}>레벨을 선택하면 AI가 맞춤 튜터링을 생성해줄게 👇</p>
            {error && <div style={S.err}>{error}</div>}
            {LEVEL_DEFS.map((lv) => (
              <button key={lv.id} onClick={() => pickLevel(lv)} style={{
                display: "flex", alignItems: "center", gap: 13,
                background: "#f8f8f5", border: `1.5px solid ${lv.color}33`,
                borderRadius: 13, padding: "15px 17px", width: "100%",
                cursor: "pointer", textAlign: "left", marginBottom: 10,
              }}>
                <span style={{ fontSize: 26 }}>{lv.emoji}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: lv.color }}>{lv.label}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{lv.sublabel}</div>
                </div>
                <span style={{ marginLeft: "auto", color: lv.color, fontSize: 18 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* ══ GENERATING ══ */}
        {phase === "generating" && (
          <div style={{ ...S.card, textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 6 }}>맞춤 튜터링 생성 중…</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>잠깐만 기다려줘 (보통 15~20초)</div>
            <div style={S.progressTrack}>
              <div style={{ ...S.progressFill, width: `${genProgress}%` }} />
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>{Math.round(genProgress)}%</div>
          </div>
        )}

        {/* ══ TUTOR ══ */}
        {phase === "tutor" && level && (
          <div style={S.card}>
            {showIntro && tutoring && (
              <div>
                {inputImage?.preview && (
                  <div style={{ textAlign: "center", marginBottom: inputText ? 10 : 18 }}>
                    <img src={inputImage.preview} alt="문제" style={{ ...S.previewImg, maxHeight: 240, marginBottom: 0 }} />
                  </div>
                )}
                {inputText && (
                  <div style={{ ...S.infoBox, marginBottom: 18 }}>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>📝 원래 문제</div>
                    <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{inputText}</div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 30 }}>{level.emoji}</span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: level.color }}>{level.label}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{level.sublabel}</div>
                  </div>
                </div>
                <div style={S.infoBox}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>📌 이 문제는</div>
                  <div style={{ fontSize: 14, color: "#222", fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
                    {tutoring.analysis.grade} {tutoring.analysis.subject} — {tutoring.analysis.unit}
                  </div>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.65 }}>
                    {tutoring.analysis.problemSummary}
                  </div>
                </div>
                <div style={{ ...S.infoBox, marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>🔑 핵심 개념</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tutoring.masterSolution.coreConcepts.map((c: string, i: number) => (
                      <span key={i} style={{ fontSize: 12, color: level.color, border: `1px solid ${level.color}44`, borderRadius: 99, padding: "3px 10px", background: level.color + "11" }}>{c}</span>
                    ))}
                  </div>
                </div>
                <div style={{ ...S.infoBox, marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>🗺 이렇게 풀어볼 거야</div>
                  <div style={{ fontSize: 13, color: "#777", lineHeight: 1.7 }}>
                    총 <b style={{ color: "#555" }}>{steps.length}단계</b>로 나눠서, 각 단계마다 네가 직접 생각하고 답을 찾게 도와줄게.<br />
                    답은 절대 먼저 알려주지 않아 — 스스로 발견할 수 있어! 💪
                  </div>
                </div>
                <button style={{ ...S.cta, background: level.color, color: "#fff", marginTop: 16 }} onClick={() => setShowIntro(false)}>
                  시작할게! →
                </button>
              </div>
            )}

            {!showIntro && step && (
              <>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8 }}>
                  <div style={{ display: "flex", gap: 4, flex: 1 }}>
                    {steps.map((s, i) => (
                      <div key={i} style={{
                        height: 5, borderRadius: 9, flex: i === stepIdx ? 2 : 1,
                        background: i <= stepIdx ? level.color : "#e8e8e4",
                        opacity: i === stepIdx ? 1 : i < stepIdx ? 0.5 : 0.3,
                        transition: "all 0.3s",
                        outline: s.isSupplementary ? `1px solid ${level.color}66` : "none",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>{stepIdx + 1} / {steps.length}</span>
                </div>

                {step.isSupplementary && <div style={S.supBadge}>💡 보충 설명</div>}

                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={S.ava}>🦉</div>
                  <div style={S.bubble}>{step.guide}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.55, marginBottom: 14 }}>
                  {step.question}
                </div>

                {step.type === "mcq" && (
                  <div style={{ marginBottom: 10 }}>
                    {step.options.map((opt: string, i: number) => {
                      let bg = "#f8f8f5", border = "#e0e0db", color = "#444";
                      if (showFb) {
                        if (i === step.correct) { bg = "#f0fff6"; border = "#4ade80"; color = "#16a34a"; }
                        else if (i === chosen) { bg = "#fff5f5"; border = "#f87171"; color = "#dc2626"; }
                        else { bg = "#f5f5f2"; border = "#ebebeb"; color = "#ccc"; }
                      }
                      return (
                        <button key={i} onClick={() => pickMCQ(i)} disabled={showFb}
                          style={{ display: "flex", alignItems: "center", gap: 11, background: bg, border: `1.5px solid ${border}`, borderRadius: 11, padding: "12px 15px", width: "100%", cursor: showFb ? "default" : "pointer", marginBottom: 7, textAlign: "left", transition: "all 0.15s" }}>
                          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#eee", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color, flexShrink: 0 }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span style={{ fontSize: 13.5, color, lineHeight: 1.4 }}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step.type === "short" && (
                  <div style={{ marginBottom: 10 }}>
                    <textarea value={shortInput} onChange={e => setShortInput(e.target.value)}
                      disabled={showFb} placeholder="여기에 풀이 과정을 써봐..."
                      style={{ width: "100%", minHeight: 100, background: "#fff", border: "1.5px solid #e0e0db", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#333", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }} />
                    {!showFb && <button style={S.cta} onClick={submitShort}>제출하기</button>}
                  </div>
                )}

                {showFb && (
                  <div style={{ border: `1.5px solid ${isOk ? "#4ade80" : fbType === "reveal" ? "#f59e0b" : "#f87171"}`, background: isOk ? "#f0fff6" : fbType === "reveal" ? "#fffbeb" : "#fff5f5", borderRadius: 13, padding: 14, marginBottom: 10 }}>
                    <div style={{ color: isOk ? "#16a34a" : fbType === "reveal" ? "#d97706" : "#dc2626", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                      {isOk ? "✅ 정답!" : fbType === "reveal" ? `💡 정답 공개 (${attempt}번 시도)` : `❌ 다시 생각해봐 (${attempt}번째)`}
                    </div>
                    <div style={{ fontSize: 13, color: "#555", lineHeight: 1.65 }}>{getFeedbackText()}</div>
                    {canNext
                      ? <button style={S.cta} onClick={next}>{stepIdx + 1 >= steps.length ? "풀이 완료! 🎉" : "다음 단계 →"}</button>
                      : <button style={S.ghost} onClick={() => { setChosen(null); setShortInput(""); setFbType(""); }}>다시 시도하기</button>
                    }
                  </div>
                )}

                {!handRaise && !supplementLoading && (
                  <button style={S.handBtn} onClick={() => setHandRaise(true)}>✋ 이해가 안 돼요</button>
                )}
                {supplementLoading && <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, marginTop: 10 }}>보충 설명 생성 중…</div>}

                {handRaise && (
                  <div style={S.handPanel}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 10 }}>어떤 부분이 어려워?</div>
                    {handRaiseMode !== "custom" ? (
                      <>
                        <button style={S.handOpt} onClick={() => handleHandRaise("질문이 무슨 뜻인지 이해가 안 돼요")}>🤔 질문이 이해가 안돼요</button>
                        <button style={S.handOpt} onClick={() => handleHandRaise("질문은 이해했는데 어떻게 풀어야 할지 모르겠어요")}>💭 질문은 이해되는데 모르겠어요</button>
                        <button style={{ ...S.handOpt, color: "#7c3aed", borderColor: "#a78bfa44" }} onClick={() => setHandRaiseMode("custom")}>✏️ (기타) 직접 쓰기</button>
                        <button style={S.ghost} onClick={() => setHandRaise(false)}>취소</button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>어떤 부분이 헷갈려? 자유롭게 써줘</div>
                        <textarea value={handRaiseText} onChange={e => setHandRaiseText(e.target.value)} placeholder="예) 왜 이 공식을 쓰는지 모르겠어요"
                          style={{ width: "100%", minHeight: 80, background: "#fff", border: "1.5px solid #e0e0db", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#333", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }} />
                        <button style={{ ...S.cta, marginTop: 10, opacity: handRaiseText.trim() ? 1 : 0.4 }} onClick={() => handleHandRaise(handRaiseText)} disabled={!handRaiseText.trim()}>
                          보충 설명 요청 →
                        </button>
                        <button style={S.ghost} onClick={() => setHandRaiseMode("")}>← 뒤로</button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ COMPLETE ══ */}
        {phase === "complete" && tutoring && level && (
          <div style={{ ...S.card, textAlign: "center" }}>
            <div style={{ fontSize: 58, marginBottom: 12 }}>🏆</div>
            <h2 style={S.h1}>풀이 완료!</h2>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 6 }}>
              정답: <b style={{ color: level.color, fontSize: 17 }}>{tutoring.masterSolution.finalAnswer}</b>
            </div>
            <div style={{ ...S.infoBox, marginBottom: 16, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>📝 풀이 핵심</div>
              {tutoring.masterSolution.solutionSteps.map((s: string, i: number) => (
                <div key={i} style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>{s}</div>
              ))}
            </div>
            <div style={S.infoBox}>
              {[["난이도", level.label, level.color], ["총 단계", `${steps.length}`, "#555"], ["오답", `${wrongs}회`, wrongs > 0 ? "#dc2626" : "#16a34a"]].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: "1px solid #ebebeb" }}>
                  <span style={{ color: "#aaa" }}>{k}</span>
                  <span style={{ color: c as string, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <button
              style={{ ...S.ghost, marginTop: 16, color: "#7c3aed", borderColor: "#a78bfa55" }}
              onClick={() => setShowSolution(s => !s)}
            >
              {showSolution ? "해설지 닫기 ▲" : "📄 해설지 보기 ▼"}
            </button>

            {showSolution && (
              <div style={{ ...S.infoBox, textAlign: "left", marginTop: 0, marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", marginBottom: 12 }}>📄 해설지</div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>최종 정답</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#d97706" }}>{tutoring.masterSolution.finalAnswer}</div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>풀이 과정</div>
                  {tutoring.masterSolution.solutionSteps.map((s: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#666", marginBottom: 6, lineHeight: 1.6 }}>
                      <span style={{ color: "#bbb", flexShrink: 0 }}>{i + 1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

                {tutoring.masterSolution.answerExplanation && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>정답 해설</div>
                    <div style={{ fontSize: 13, color: "#666", lineHeight: 1.65 }}>{tutoring.masterSolution.answerExplanation}</div>
                  </div>
                )}

                {tutoring.masterSolution.commonMistakes?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>자주 하는 실수</div>
                    {tutoring.masterSolution.commonMistakes.map((m: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: "#dc2626", marginBottom: 5, lineHeight: 1.6 }}>• {m}</div>
                    ))}
                  </div>
                )}

                {tutoring.masterSolution.prerequisiteKnowledge?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>필요한 선행 지식</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {tutoring.masterSolution.prerequisiteKnowledge.map((k: string, i: number) => (
                        <span key={i} style={{ fontSize: 12, color: "#2563eb", border: "1px solid #2563eb33", borderRadius: 99, padding: "3px 10px", background: "#2563eb11" }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button style={{ ...S.cta, marginTop: 8, background: level.color, color: "#fff" }}
              onClick={() => { const lv = LEVEL_DEFS.find(l => l.id === selectedLevelId); if (lv) pickLevel(lv); }}>
              같은 난이도로 다시
            </button>
            <button style={S.ghost} onClick={() => setPhase("select")}>다른 난이도</button>
            <button style={S.ghost} onClick={() => setPhase("report")}>리포트로 돌아가기</button>
            <button style={S.ghost} onClick={reset}>새 문제 풀기</button>
          </div>
        )}

        {/* ══ PG TOPIC ══ */}
        {phase === "pgTopic" && (
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <button onClick={() => setPhase("home")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>←</button>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>오늘 어떤 얘기 할까?</div>
            </div>

            <button
              onClick={() => { setPgTopic("공부"); setPhase("pgPartner"); }}
              style={S.modeCard}
            >
              <span style={{ fontSize: 30 }}>📚</span>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>공부/시험 고민</div>
              </div>
              <span style={{ color: "#ccc", fontSize: 18 }}>→</span>
            </button>

            <button
              onClick={() => { setPgTopic("심심"); setPhase("pgPartner"); }}
              style={{ ...S.modeCard, marginTop: 10 }}
            >
              <span style={{ fontSize: 30 }}>🎲</span>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>그냥 심심해서</div>
              </div>
              <span style={{ color: "#ccc", fontSize: 18 }}>→</span>
            </button>
          </div>
        )}

        {/* ══ PG PARTNER ══ */}
        {phase === "pgPartner" && (
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <button onClick={() => setPhase("pgTopic")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>←</button>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>누구랑 얘기할래?</div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => selectPartner("소라")}
                style={{
                  flex: 1, padding: "22px 12px", background: "#fffbeb",
                  border: "2px solid #f59e0b55", borderRadius: 16,
                  cursor: "pointer", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}
              >
                <div style={{ fontSize: 36 }}>🐶</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#d97706" }}>소라</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>공감 잘 해줘</div>
                <div style={{ fontSize: 11, color: "#999", lineHeight: 1.55 }}>
                  고민 들어주는 스타일.<br />네 편 확실히 들어줌.
                </div>
                <div style={{ fontSize: 10, color: "#d97706", background: "#fff8e0", border: "1px solid #f59e0b33", borderRadius: 99, padding: "4px 10px", marginTop: 2, fontStyle: "italic" }}>
                  "그렇구나~ 어떻게 된 거야?"
                </div>
              </button>

              <button
                onClick={() => selectPartner("크라")}
                style={{
                  flex: 1, padding: "22px 12px", background: "#f5f3ff",
                  border: "2px solid #7c3aed55", borderRadius: 16,
                  cursor: "pointer", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}
              >
                <div style={{ fontSize: 36 }}>🦉</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#7c3aed" }}>크라</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>솔직하게 말해줘</div>
                <div style={{ fontSize: 11, color: "#999", lineHeight: 1.55 }}>
                  직설적이지만 차갑진 않아.<br />새로운 시각 줌.
                </div>
                <div style={{ fontSize: 10, color: "#7c3aed", background: "#ede9fe", border: "1px solid #7c3aed33", borderRadius: 99, padding: "4px 10px", marginTop: 2, fontStyle: "italic" }}>
                  "근데 그게 진짜 문제야?"
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ══ PLAYGROUND ══ */}
        {phase === "playground" && (
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <button onClick={reset} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>
                  {pgMode === "GROUP"
                    ? (pgPartner === "소라" ? "소라 🐶 & 크라 🦉" : "크라 🦉 & 소라 🐶")
                    : (pgPartner === "소라" ? "소라 🐶" : "크라 🦉")
                  }
                </div>
                <div style={{ fontSize: 11, color: "#bbb" }}>
                  {pgMode === "GROUP" ? "함께하기" : "1:1 대화"}
                </div>
              </div>
            </div>

            {pgModeSelected && (
              <>
                <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                  {pgMessages.map((msg, i) => {
                    if (msg.role === "user") {
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                          <div style={{
                            maxWidth: "78%", padding: "10px 13px",
                            borderRadius: "12px 12px 4px 12px",
                            background: "#f59e0b",
                            fontSize: 13, color: "#000", lineHeight: 1.6, whiteSpace: "pre-wrap",
                          }}>{msg.content}</div>
                        </div>
                      );
                    }
                    const isAi2 = msg.role === "ai2";
                    const bg = isAi2 ? pgAi2Bg : pgAi1Bg;
                    const border = isAi2 ? pgAi2Border : pgAi1Border;
                    const emoji = isAi2 ? pgOtherEmoji : pgPartnerEmoji;
                    const name = isAi2 ? pgOtherName : (pgPartner ?? "");
                    return (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: bg, border: `1px solid ${border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, flexShrink: 0,
                        }}>{emoji}</div>
                        <div>
                          <div style={{ fontSize: 10, color: "#bbb", marginBottom: 3 }}>{name}</div>
                          <div style={{
                            maxWidth: 300, padding: "10px 13px",
                            borderRadius: "4px 12px 12px 12px",
                            background: bg, border: `1px solid ${border}`,
                            fontSize: 13, color: "#444", lineHeight: 1.6, whiteSpace: "pre-wrap",
                          }}>{msg.content}</div>
                        </div>
                      </div>
                    );
                  })}
                  {pgLoading && (
                    <div style={{ display: "flex", gap: 5, padding: "8px 40px" }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ccc", animation: `bounce 1s ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  )}
                  <div ref={pgEndRef} />
                </div>

                {showJoinPopup && (
                  <div style={{ animation: "slideUp 0.3s ease", background: "#faf5ff", border: "1.5px solid #a78bfa66", borderRadius: 14, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 22, textAlign: "center", marginBottom: 6 }}>
                      {pgPartner === "소라" ? "🦉" : "🐶"}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", textAlign: "center", marginBottom: 4 }}>
                      {pgPartner === "소라" ? "크라도 불러볼까?" : "소라도 부를까?"}
                    </div>
                    <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginBottom: 14 }}>
                      같이 얘기하면 더 재밌을 것 같은데?
                    </div>
                    <button onClick={handleJoinAccept} style={{ ...S.cta, background: "#7c3aed", color: "#fff", marginTop: 0, marginBottom: 8 }}>
                      좋아! 같이 얘기하자 👥
                    </button>
                    <button onClick={handleJoinReject} style={S.ghost}>
                      아니, 지금은 괜찮아 🙅
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={pgInput}
                    onChange={e => setPgInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendPgMessage()}
                    placeholder="메시지 입력..."
                    style={{ ...S.inp, flex: 1, padding: "11px 13px", fontSize: 13 }}
                    disabled={showJoinPopup}
                  />
                  <button
                    onClick={sendPgMessage}
                    disabled={!pgInput.trim() || pgLoading || showJoinPopup}
                    style={{ padding: "11px 16px", background: "#f59e0b", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, cursor: "pointer", opacity: pgInput.trim() && !showJoinPopup ? 1 : 0.4 }}
                  >
                    →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#f9f9f7", fontFamily: "'Noto Sans KR', sans-serif", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: "1px solid #e8e8e4", position: "sticky", top: 0, zIndex: 10, background: "#f9f9f7" },
  logo: { background: "none", border: "none", color: "#111", fontSize: 19, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "baseline" },
  chip: { fontSize: 11, background: "#f0f0ee", border: "1px solid", padding: "3px 10px", borderRadius: 99 },
  main: { flex: 1, display: "flex", justifyContent: "center", padding: "22px 16px 56px" },
  card: { width: "100%", maxWidth: 440 },
  h1: { fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "#aaa", marginBottom: 16 },
  textarea: { width: "100%", minHeight: 90, background: "#fff", border: "1.5px solid #e0e0db", borderRadius: 12, padding: "13px 15px", fontSize: 14, color: "#333", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 },
  drop: { border: "2px dashed #d8d8d3", borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer", background: "#f5f5f2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 0 },
  previewImg: { width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 10, marginBottom: 16, border: "1px solid #e0e0db" },
  infoBox: { background: "#f5f5f2", border: "1px solid #e8e8e4", borderRadius: 12, padding: "13px 15px" },
  err: { marginTop: 10, padding: "11px 14px", background: "#fff5f5", border: "1px solid #f87171", borderRadius: 10, fontSize: 13, color: "#dc2626" },
  cta: { display: "block", width: "100%", marginTop: 12, padding: "13px", background: "#f59e0b", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#000", cursor: "pointer" },
  ghost: { display: "block", width: "100%", marginTop: 8, padding: "11px", background: "transparent", border: "1px solid #e0e0db", borderRadius: 12, fontSize: 13, color: "#888", cursor: "pointer" },
  inp: { background: "#fff", border: "1.5px solid #e0e0db", borderRadius: 10, color: "#333", outline: "none", fontFamily: "inherit" },
  spin: { width: 34, height: 34, border: "3px solid #e8e8e4", borderTop: "3px solid #f59e0b", borderRadius: "50%", margin: "0 auto 18px", animation: "spin 0.75s linear infinite" },
  ava: { width: 35, height: 35, borderRadius: "50%", background: "#eeeee9", border: "1px solid #e0e0db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 },
  bubble: { background: "#eeeee9", border: "1px solid #e0e0db", borderRadius: "4px 12px 12px 12px", padding: "10px 13px", fontSize: 13, color: "#444", lineHeight: 1.65 },
  supBadge: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#7c3aed", border: "1px solid #a78bfa55", borderRadius: 99, padding: "3px 10px", marginBottom: 12 },
  handBtn: { display: "block", width: "100%", marginTop: 10, padding: "11px", background: "transparent", border: "1px dashed #d0d0cb", borderRadius: 10, fontSize: 13, color: "#aaa", cursor: "pointer" },
  handPanel: { background: "#f5f5f2", border: "1px solid #a78bfa44", borderRadius: 13, padding: 14, marginTop: 8 },
  handOpt: { display: "block", width: "100%", marginBottom: 7, padding: "11px 14px", background: "#fff", border: "1px solid #e0e0db", borderRadius: 10, fontSize: 13, color: "#444", cursor: "pointer", textAlign: "left" },
  problemBar: { position: "sticky", top: 54, zIndex: 9, background: "#f9f9f7", borderBottom: "1px solid #e8e8e4", padding: "8px 16px", display: "flex", justifyContent: "center" },
  problemBarImg: { maxHeight: 90, maxWidth: "100%", objectFit: "contain", borderRadius: 8 },
  progressTrack: { background: "#e8e8e4", borderRadius: 99, height: 8, overflow: "hidden", width: "100%" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: 99, transition: "width 0.4s ease" },
  fieldRow: { display: "flex", alignItems: "center", gap: 12 },
  fieldLabel: { fontSize: 12, color: "#aaa", width: 36, flexShrink: 0 },
  select: { flex: 1, background: "#fff", border: "1.5px solid #e0e0db", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#333", outline: "none", fontFamily: "inherit" },
  counterBadge: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e8e8e4", borderRadius: 12, padding: "12px 15px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  modeCard: { display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1.5px solid #e8e8e4", borderRadius: 14, padding: "18px 16px", width: "100%", cursor: "pointer", textAlign: "left", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
};
