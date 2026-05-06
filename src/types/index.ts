// ── 1차 분석 결과 ──────────────────────────────────────────────
export interface ProblemAnalysis {
  subject: string;        // 수학, 영어, 과학, 국어, 사회, 역사 등
  grade: string;          // 중1, 고2 등
  semester: string;       // 1학기 | 2학기
  unit: string;           // 단원명
  confidence: number;     // 0~100
  problemSummary: string; // 한 줄 요약
  choices: string[];      // ["① ...", "② ..."] 없으면 []
  answerIndex: number;    // 정답 index (-1 = 주관식)
  isMultipleChoice: boolean;
}

// ── 해설지 (튜터만 참조, 유저에게 노출 금지) ───────────────────
export interface MasterSolution {
  finalAnswer: string;
  coreConcepts: string[];
  solutionSteps: string[];
  commonMistakes: string[];
  prerequisiteKnowledge: string[];
  answerExplanation: string;
}

// ── 튜터링 스텝 ────────────────────────────────────────────────
export interface MCQStep {
  type: "mcq";
  guide: string;
  question: string;
  options: string[];
  correct: number;
  hint1: string;
  hint2: string;
  feedbackCorrect: string;
  feedbackReveal: string;
  isSupplementary?: boolean;
  supplementReason?: string;
}

export interface ShortStep {
  type: "short";
  guide: string;
  question: string;
  sampleAnswer: string;
  keywords: string[];
  hint1: string;
  hint2: string;
  feedbackReveal: string;
  isSupplementary?: boolean;
}

export type TutorStep = MCQStep | ShortStep;

// ── 레벨 ───────────────────────────────────────────────────────
export type LevelId = "easy2" | "easy1" | "normal";

export interface TutorLevel {
  id: LevelId;
  label: string;
  sublabel: string;
  emoji: string;
  color: string;
  steps: TutorStep[];
}

// ── 전체 튜터링 데이터 ─────────────────────────────────────────
export interface TutoringData {
  masterSolution: MasterSolution;
  analysis: ProblemAnalysis;
  levels: TutorLevel[];
}

// ── API 요청/응답 ──────────────────────────────────────────────
export interface AnalyzeRequest {
  imageBase64?: string;
  mediaType?: string;
  text?: string;
}

export interface GenerateTutoringRequest {
  imageBase64?: string;
  mediaType?: string;
  text?: string;
  analysis: ProblemAnalysis;
  levelId: LevelId;
}

export interface SupplementRequest {
  reason: string;
  currentStepGuide: string;
  currentStepQuestion: string;
  levelId: LevelId;
  masterSolution: MasterSolution;
}

// ── 멀티모델 리포트 ────────────────────────────────────────────
export interface ModelResult {
  id: "A" | "B" | "C";
  label: string;
  answer: string;
}

export interface ReportData {
  models: ModelResult[];
  signal: "green" | "yellow";
}

// ── 채팅 ──────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── 인풋 ──────────────────────────────────────────────────────
export interface InputData {
  text?: string;
  imageBase64?: string;
  mediaType?: string;
  preview?: string;
}
