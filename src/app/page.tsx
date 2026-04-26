"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ProblemAnalysis, TutoringData, TutorStep, LevelId } from "@/types";

type Phase = "upload" | "analyzing" | "confirm" | "generating" | "select" | "tutor" | "complete";

const SUBJECTS = ["수학","영어","국어","과학","사회","역사","기술가정","도덕","음악","미술","기타"];
const GRADES = ["초5","초6","중1","중2","중3","고1","고2","고3"];

export default function Page() {
  const [phase, setPhase] = useState<Phase>("upload");

  const [preview, setPreview] = useState<string | null>(null);
  const [imgData, setImgData] = useState<{ base64: string; mediaType: string } | null>(null);

  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [tutoring, setTutoring] = useState<TutoringData | null>(null);

  const [levelIdx, setLevelIdx] = useState<number | null>(null);
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
  const fileRef = useRef<HTMLInputElement>(null);

  const level = levelIdx !== null && tutoring ? tutoring.levels[levelIdx] : null;
  const step = steps[stepIdx] ?? null;
  const isOk = fbType === "correct";
  const canNext = isOk || fbType === "reveal";
  const showFb = fbType !== "";

  // ── 생성 진행률 애니메이션 ────────────────────────────────────
  useEffect(() => {
    if (phase !== "generating") { setGenProgress(0); return; }
    const timer = setInterval(() => {
      setGenProgress(p => p < 88 ? +(p + (88 - p) * 0.055).toFixed(1) : p);
    }, 400);
    return () => clearInterval(timer);
  }, [phase]);

  // ── 이미지 처리 ──────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setError("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type as string;
      setImgData({ base64, mediaType });
      setPhase("analyzing");
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        setAnalysis(data.analysis);
        setPhase("confirm");
      } catch {
        setError("분석 실패. 이미지를 다시 확인해봐.");
        setPhase("upload");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // ── 튜터링 생성 ───────────────────────────────────────────────
  async function generate() {
    if (!imgData || !analysis) return;
    setPhase("generating");
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgData.base64, mediaType: imgData.mediaType, analysis }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setGenProgress(100);
      setTimeout(() => {
        setTutoring({ masterSolution: data.tutoring.masterSolution, analysis, levels: data.tutoring.levels });
        setPhase("select");
      }, 300);
    } catch {
      setError("튜터링 생성 실패. 다시 시도해줘.");
      setPhase("confirm");
    }
  }

  // ── 레벨 선택 ─────────────────────────────────────────────────
  function pickLevel(i: number) {
    if (!tutoring) return;
    setLevelIdx(i);
    setSteps([...tutoring.levels[i].steps]);
    setStepIdx(0); setAttempt(0); setChosen(null);
    setShortInput(""); setFbType(""); setWrongs(0);
    setHandRaise(false); setHandRaiseMode(""); setHandRaiseText("");
    setShowIntro(true);
    setPhase("tutor");
  }

  // ── MCQ 선택 ─────────────────────────────────────────────────
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

  // ── 주관식 제출 ───────────────────────────────────────────────
  function submitShort() {
    if (!shortInput.trim() || !step || step.type !== "short") return;
    const kw = step.keywords;
    const matched = kw.filter(k => shortInput.includes(k)).length;
    if (matched >= Math.ceil(kw.length * 0.5)) {
      setFbType("correct");
    } else {
      const next = attempt + 1;
      setAttempt(next); setWrongs(w => w + 1);
      setFbType(next === 1 ? "hint1" : next === 2 ? "hint2" : "reveal");
    }
  }

  // ── 다음 단계 ─────────────────────────────────────────────────
  function next() {
    if (stepIdx + 1 >= steps.length) { setPhase("complete"); return; }
    setStepIdx(s => s + 1);
    setAttempt(0); setChosen(null); setShortInput("");
    setFbType(""); setHandRaise(false); setHandRaiseMode(""); setHandRaiseText("");
  }

  // ── 손들기 처리 ───────────────────────────────────────────────
  async function handleHandRaise(reason: string) {
    if (!tutoring || !level || !step || !reason.trim()) return;
    setHandRaise(false);
    setHandRaiseMode("");
    setHandRaiseText("");
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
    } catch {
      // 실패 시 무시
    } finally {
      setSupplementLoading(false);
    }
  }

  // ── 피드백 텍스트 ─────────────────────────────────────────────
  function getFeedbackText(): string {
    if (!step) return "";
    if (fbType === "correct") return (step as any).feedbackCorrect ?? "";
    if (fbType === "reveal") return step.feedbackReveal ?? "";
    if (fbType === "hint1") return step.hint1;
    if (fbType === "hint2") return step.hint2;
    return "";
  }

  // ── 초기화 ───────────────────────────────────────────────────
  function reset() {
    setPhase("upload"); setPreview(null); setImgData(null);
    setAnalysis(null); setTutoring(null); setEditMode(false);
    setLevelIdx(null); setSteps([]); setStepIdx(0);
    setAttempt(0); setChosen(null); setShortInput("");
    setFbType(""); setWrongs(0); setHandRaise(false);
    setHandRaiseMode(""); setHandRaiseText("");
    setShowIntro(false); setError("");
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* ── 헤더 ── */}
      <header style={S.header}>
        <button onClick={reset} style={S.logo}>
          <span style={{ color: "#f59e0b" }}>S</span>OCRA
          <span style={{ color: "#444", fontSize: 10, marginLeft: 4, letterSpacing: 2 }}>TUTOR</span>
        </button>
        {level && (
          <span style={{ ...S.chip, color: level.color, borderColor: level.color + "44" }}>
            {level.emoji} {level.label}
          </span>
        )}
      </header>

      {/* ── 문제 이미지 sticky 바 (튜터링 본문 중) ── */}
      {phase === "tutor" && !showIntro && preview && (
        <div style={S.problemBar}>
          <img src={preview} alt="문제" style={S.problemBarImg} />
        </div>
      )}

      <main style={S.main}>

        {/* ══ UPLOAD ══ */}
        {phase === "upload" && (
          <div style={S.card}>
            <h1 style={S.h1}>문제 사진을 올려줘</h1>
            <p style={S.sub}>AI가 과목·학년·단원을 자동 분석해줄게</p>
            <div
              style={S.drop}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <div style={{ fontSize: 44, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 15, color: "#bbb", fontWeight: 600 }}>클릭 또는 드래그</div>
              <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>JPG · PNG · HEIC</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>
            {error && <div style={S.err}>{error}</div>}
          </div>
        )}

        {/* ══ ANALYZING ══ */}
        {phase === "analyzing" && (
          <div style={{ ...S.card, textAlign: "center", paddingTop: 48 }}>
            {preview && <img src={preview} alt="" style={S.previewImg} />}
            <div style={S.spin} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>문제 분석 중…</div>
            <div style={{ fontSize: 13, color: "#444" }}>과목·학년·단원 판별 중</div>
          </div>
        )}

        {/* ══ GENERATING ══ */}
        {phase === "generating" && (
          <div style={{ ...S.card, textAlign: "center", paddingTop: 40 }}>
            {preview && <img src={preview} alt="" style={S.previewImg} />}
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              맞춤 튜터링 생성 중…
            </div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>
              3가지 난이도 풀이를 동시에 준비하고 있어 (보통 20~40초 소요)
            </div>
            <div style={S.progressTrack}>
              <div style={{ ...S.progressFill, width: `${genProgress}%` }} />
            </div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>{Math.round(genProgress)}%</div>
          </div>
        )}

        {/* ══ CONFIRM ══ */}
        {phase === "confirm" && analysis && (
          <div style={S.card}>
            <h2 style={S.h1}>AI 분석 결과</h2>
            <p style={S.sub}>틀린 부분이 있으면 수정해줘</p>
            {preview && <img src={preview} alt="문제" style={S.previewImg} />}
            <div style={S.analysisCard}>
              {[
                { label: "과목", key: "subject", options: SUBJECTS },
                { label: "학년", key: "grade", options: GRADES },
                { label: "학기", key: "semester", options: ["1학기", "2학기"] },
              ].map(({ label, key, options }) => (
                <div key={key} style={S.row}>
                  <span style={S.rowLabel}>{label}</span>
                  {editMode
                    ? <select value={(analysis as any)[key]}
                        onChange={e => setAnalysis(a => a ? { ...a, [key]: e.target.value } : a)}
                        style={S.sel}>
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : <span style={S.rowVal}>{(analysis as any)[key]}</span>
                  }
                </div>
              ))}
              <div style={S.row}>
                <span style={S.rowLabel}>단원</span>
                {editMode
                  ? <input value={analysis.unit}
                      onChange={e => setAnalysis(a => a ? { ...a, unit: e.target.value } : a)}
                      style={S.inp} />
                  : <span style={S.rowVal}>{analysis.unit}</span>
                }
              </div>
              <div style={{ ...S.row, border: "none" }}>
                <span style={S.rowLabel}>신뢰도</span>
                <span style={{ color: analysis.confidence > 80 ? "#4ade80" : "#f59e0b", fontWeight: 700, fontSize: 14 }}>
                  {analysis.confidence}%
                </span>
              </div>
            </div>
            {analysis.problemSummary && (
              <div style={{ ...S.infoBox, marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>📌 인식된 문제</div>
                <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>{analysis.problemSummary}</div>
              </div>
            )}
            {error && <div style={S.err}>{error}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button style={{ ...S.ghost, flex: 1 }} onClick={() => setEditMode(e => !e)}>
                {editMode ? "✅ 수정 완료" : "✏️ 수정하기"}
              </button>
              <button style={{ ...S.cta, flex: 2, marginTop: 0 }} onClick={generate}>
                맞아, 튜터 시작 →
              </button>
            </div>
          </div>
        )}

        {/* ══ SELECT ══ */}
        {phase === "select" && tutoring && (
          <div style={S.card}>
            <div style={S.infoBox}>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>
                {analysis?.grade} {analysis?.subject} · {analysis?.unit}
              </div>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>{analysis?.problemSummary}</div>
            </div>
            <h2 style={{ ...S.h1, marginTop: 18 }}>어떻게 설명해줄까?</h2>
            <p style={S.sub}>AI 튜터 3개가 각 수준으로 준비했어 👇</p>
            {tutoring.levels.map((lv, i) => (
              <button key={lv.id} onClick={() => pickLevel(i)} style={{
                display: "flex", alignItems: "center", gap: 13,
                background: "#0c0c0c", border: `1.5px solid ${lv.color}22`,
                borderRadius: 13, padding: "15px 17px", width: "100%",
                cursor: "pointer", textAlign: "left", marginBottom: 10,
              }}>
                <span style={{ fontSize: 26 }}>{lv.emoji}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: lv.color }}>{lv.label}</div>
                  <div style={{ fontSize: 12, color: "#444" }}>{lv.sublabel}</div>
                </div>
                <span style={{ marginLeft: "auto", color: lv.color, fontSize: 18 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* ══ TUTOR ══ */}
        {phase === "tutor" && level && (
          <div style={S.card}>

            {/* ── 인트로 카드 ── */}
            {showIntro && tutoring && (
              <div>
                {preview && (
                  <div style={{ textAlign: "center", marginBottom: 18 }}>
                    <img src={preview} alt="문제" style={{ ...S.previewImg, maxHeight: 240, marginBottom: 0 }} />
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 30 }}>{level.emoji}</span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: level.color }}>{level.label}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{level.sublabel}</div>
                  </div>
                </div>

                <div style={S.infoBox}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>📌 이 문제는</div>
                  <div style={{ fontSize: 14, color: "#ddd", fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
                    {tutoring.analysis.grade} {tutoring.analysis.subject} — {tutoring.analysis.unit}
                  </div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.65 }}>
                    {tutoring.analysis.problemSummary}
                  </div>
                </div>

                <div style={{ ...S.infoBox, marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>🔑 핵심 개념</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tutoring.masterSolution.coreConcepts.map((c, i) => (
                      <span key={i} style={{
                        fontSize: 12, color: level.color,
                        border: `1px solid ${level.color}44`,
                        borderRadius: 99, padding: "3px 10px",
                        background: level.color + "11",
                      }}>{c}</span>
                    ))}
                  </div>
                </div>

                <div style={{ ...S.infoBox, marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>🗺 이렇게 풀어볼 거야</div>
                  <div style={{ fontSize: 13, color: "#777", lineHeight: 1.7 }}>
                    총 <b style={{ color: "#aaa" }}>{steps.length}단계</b>로 나눠서, 각 단계마다 네가 직접 생각하고 답을 찾게 도와줄게.<br />
                    답은 절대 먼저 알려주지 않아 — 스스로 발견할 수 있어! 💪
                  </div>
                </div>

                <button
                  style={{ ...S.cta, background: level.color, color: "#000", marginTop: 16 }}
                  onClick={() => setShowIntro(false)}
                >
                  시작할게! →
                </button>
              </div>
            )}

            {/* ── 튜터링 본문 ── */}
            {!showIntro && step && (
              <>
                {/* 네비게이션 바 */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8 }}>
                  <div style={{ display: "flex", gap: 4, flex: 1 }}>
                    {steps.map((s, i) => (
                      <div key={i} style={{
                        height: 5, borderRadius: 9,
                        flex: i === stepIdx ? 2 : 1,
                        background: i <= stepIdx ? level.color : "#1e1e1e",
                        opacity: i === stepIdx ? 1 : i < stepIdx ? 0.5 : 0.2,
                        transition: "all 0.3s",
                        outline: s.isSupplementary ? `1px solid ${level.color}66` : "none",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#444", whiteSpace: "nowrap" }}>
                    {stepIdx + 1} / {steps.length}
                  </span>
                </div>

                {step.isSupplementary && (
                  <div style={S.supBadge}>💡 보충 설명</div>
                )}

                {/* 튜터 말풍선 */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={S.ava}>🤖</div>
                  <div style={S.bubble}>{step.guide}</div>
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.55, marginBottom: 14 }}>
                  {step.question}
                </div>

                {/* MCQ */}
                {step.type === "mcq" && (
                  <div style={{ marginBottom: 10 }}>
                    {step.options.map((opt: string, i: number) => {
                      let bg = "#111", border = "#222", color = "#ccc";
                      if (showFb) {
                        if (i === step.correct) { bg = "#041f0f"; border = "#4ade80"; color = "#4ade80"; }
                        else if (i === chosen) { bg = "#1f0404"; border = "#f87171"; color = "#f87171"; }
                        else { bg = "#0a0a0a"; border = "#151515"; color = "#2a2a2a"; }
                      }
                      return (
                        <button key={i} onClick={() => pickMCQ(i)} disabled={showFb}
                          style={{
                            display: "flex", alignItems: "center", gap: 11,
                            background: bg, border: `1.5px solid ${border}`,
                            borderRadius: 11, padding: "12px 15px", width: "100%",
                            cursor: showFb ? "default" : "pointer",
                            marginBottom: 7, textAlign: "left", transition: "all 0.15s",
                          }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: "#1a1a1a", border: `1px solid ${border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800, color, flexShrink: 0,
                          }}>{String.fromCharCode(65 + i)}</span>
                          <span style={{ fontSize: 13.5, color, lineHeight: 1.4 }}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 주관식 */}
                {step.type === "short" && (
                  <div style={{ marginBottom: 10 }}>
                    <textarea value={shortInput} onChange={e => setShortInput(e.target.value)}
                      disabled={showFb} placeholder="여기에 풀이 과정을 써봐..."
                      style={{
                        width: "100%", minHeight: 100, background: "#0d0d0d",
                        border: "1.5px solid #2a2a2a", borderRadius: 10,
                        padding: "12px 14px", fontSize: 13, color: "#ccc",
                        resize: "vertical", outline: "none",
                        boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6,
                      }} />
                    {!showFb && (
                      <button style={S.cta} onClick={submitShort}>제출하기</button>
                    )}
                  </div>
                )}

                {/* 피드백 */}
                {showFb && (
                  <div style={{
                    border: `1.5px solid ${isOk ? "#4ade80" : fbType === "reveal" ? "#f59e0b" : "#f87171"}`,
                    background: isOk ? "#041f0f" : fbType === "reveal" ? "#1a1000" : "#1a0404",
                    borderRadius: 13, padding: 14, marginBottom: 10,
                  }}>
                    <div style={{
                      color: isOk ? "#4ade80" : fbType === "reveal" ? "#f59e0b" : "#f87171",
                      fontWeight: 700, fontSize: 13, marginBottom: 6,
                    }}>
                      {isOk ? "✅ 정답!" : fbType === "reveal" ? `💡 정답 공개 (${attempt}번 시도)` : `❌ 다시 생각해봐 (${attempt}번째)`}
                    </div>
                    <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.65 }}>{getFeedbackText()}</div>
                    {canNext
                      ? <button style={S.cta} onClick={next}>
                          {stepIdx + 1 >= steps.length ? "풀이 완료! 🎉" : "다음 단계 →"}
                        </button>
                      : <button style={S.ghost} onClick={() => { setChosen(null); setShortInput(""); setFbType(""); }}>
                          다시 시도하기
                        </button>
                    }
                  </div>
                )}

                {/* 손들기 버튼 */}
                {!handRaise && !supplementLoading && (
                  <button style={S.handBtn} onClick={() => setHandRaise(true)}>
                    ✋ 이해가 안 돼요
                  </button>
                )}
                {supplementLoading && (
                  <div style={{ textAlign: "center", color: "#555", fontSize: 13, marginTop: 10 }}>
                    보충 설명 생성 중…
                  </div>
                )}

                {/* 손들기 패널 */}
                {handRaise && (
                  <div style={S.handPanel}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
                      어떤 부분이 어려워?
                    </div>

                    {handRaiseMode !== "custom" ? (
                      <>
                        <button style={S.handOpt}
                          onClick={() => handleHandRaise("질문이 무슨 뜻인지 이해가 안 돼요")}>
                          🤔 질문이 이해가 안돼요
                        </button>
                        <button style={S.handOpt}
                          onClick={() => handleHandRaise("질문은 이해했는데 어떻게 풀어야 할지 모르겠어요")}>
                          💭 질문은 이해되는데 모르겠어요
                        </button>
                        <button style={{ ...S.handOpt, color: "#a78bfa", borderColor: "#a78bfa33" }}
                          onClick={() => setHandRaiseMode("custom")}>
                          ✏️ (기타) 직접 쓰기
                        </button>
                        <button style={S.ghost} onClick={() => setHandRaise(false)}>취소</button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
                          어떤 부분이 헷갈려? 자유롭게 써줘
                        </div>
                        <textarea
                          value={handRaiseText}
                          onChange={e => setHandRaiseText(e.target.value)}
                          placeholder="예) 왜 이 공식을 쓰는지 모르겠어요"
                          style={{
                            width: "100%", minHeight: 80, background: "#111",
                            border: "1.5px solid #2a2a2a", borderRadius: 10,
                            padding: "10px 12px", fontSize: 13, color: "#ccc",
                            resize: "none", outline: "none",
                            boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6,
                          }}
                        />
                        <button
                          style={{ ...S.cta, marginTop: 10, opacity: handRaiseText.trim() ? 1 : 0.4 }}
                          onClick={() => handleHandRaise(handRaiseText)}
                          disabled={!handRaiseText.trim()}
                        >
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
              <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}>📝 풀이 핵심</div>
              {tutoring.masterSolution.solutionSteps.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>{s}</div>
              ))}
            </div>
            <div style={S.infoBox}>
              {[["난이도", level.label, level.color], ["총 단계", `${steps.length}`, "#aaa"], ["오답", `${wrongs}회`, wrongs > 0 ? "#f87171" : "#4ade80"]].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: "1px solid #141414" }}>
                  <span style={{ color: "#555" }}>{k}</span>
                  <span style={{ color: c as string, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <button style={{ ...S.cta, marginTop: 16, background: level.color, color: "#000" }}
              onClick={() => pickLevel(levelIdx!)}>같은 난이도로 다시</button>
            <button style={S.ghost} onClick={() => setPhase("select")}>다른 난이도</button>
            <button style={S.ghost} onClick={reset}>새 문제 풀기</button>
          </div>
        )}

      </main>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#070707", fontFamily: "'Noto Sans KR', sans-serif", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: "1px solid #111", position: "sticky", top: 0, zIndex: 10, background: "#070707" },
  logo: { background: "none", border: "none", color: "#fff", fontSize: 19, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "baseline" },
  chip: { fontSize: 11, background: "#111", border: "1px solid", padding: "3px 10px", borderRadius: 99 },
  main: { flex: 1, display: "flex", justifyContent: "center", padding: "22px 16px 56px" },
  card: { width: "100%", maxWidth: 440 },
  h1: { fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "#555", marginBottom: 16 },
  drop: { border: "2px dashed #222", borderRadius: 14, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "#0a0a0a", minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  previewImg: { width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 10, marginBottom: 16, border: "1px solid #1e1e1e" },
  analysisCard: { background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 13, overflow: "hidden" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #141414", gap: 12 },
  rowLabel: { fontSize: 12, color: "#555", width: 36, flexShrink: 0 },
  rowVal: { fontSize: 14, color: "#ccc", fontWeight: 600 },
  sel: { fontSize: 13, background: "#141414", border: "1px solid #2a2a2a", borderRadius: 7, padding: "5px 8px", color: "#ccc", outline: "none" },
  inp: { fontSize: 13, background: "#141414", border: "1px solid #2a2a2a", borderRadius: 7, padding: "5px 10px", color: "#ccc", outline: "none", flex: 1 },
  infoBox: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: "13px 15px" },
  err: { marginTop: 10, padding: "11px 14px", background: "#1f0404", border: "1px solid #f87171", borderRadius: 10, fontSize: 13, color: "#f87171" },
  cta: { display: "block", width: "100%", marginTop: 12, padding: "13px", background: "#f59e0b", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#000", cursor: "pointer" },
  ghost: { display: "block", width: "100%", marginTop: 8, padding: "11px", background: "transparent", border: "1px solid #222", borderRadius: 12, fontSize: 13, color: "#555", cursor: "pointer" },
  spin: { width: 34, height: 34, border: "3px solid #1a1a1a", borderTop: "3px solid #f59e0b", borderRadius: "50%", margin: "0 auto 18px", animation: "spin 0.75s linear infinite" },
  ava: { width: 35, height: 35, borderRadius: "50%", background: "#111", border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 },
  bubble: { background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: "4px 12px 12px 12px", padding: "10px 13px", fontSize: 13, color: "#bbb", lineHeight: 1.65 },
  supBadge: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#a78bfa", border: "1px solid #a78bfa44", borderRadius: 99, padding: "3px 10px", marginBottom: 12 },
  handBtn: { display: "block", width: "100%", marginTop: 10, padding: "11px", background: "transparent", border: "1px dashed #2a2a2a", borderRadius: 10, fontSize: 13, color: "#555", cursor: "pointer" },
  handPanel: { background: "#0d0d0d", border: "1px solid #a78bfa44", borderRadius: 13, padding: 14, marginTop: 8 },
  handOpt: { display: "block", width: "100%", marginBottom: 7, padding: "11px 14px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, fontSize: 13, color: "#bbb", cursor: "pointer", textAlign: "left" },
  problemBar: { position: "sticky", top: 54, zIndex: 9, background: "#070707", borderBottom: "1px solid #111", padding: "8px 16px", display: "flex", justifyContent: "center" },
  problemBarImg: { maxHeight: 90, maxWidth: "100%", objectFit: "contain", borderRadius: 8 },
  progressTrack: { background: "#111", borderRadius: 99, height: 8, overflow: "hidden", width: "100%" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: 99, transition: "width 0.4s ease" },
};
