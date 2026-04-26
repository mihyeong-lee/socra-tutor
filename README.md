# SOCRA TUTOR

> AI 전과목 튜터 — 문제 사진 한 장으로 맞춤 튜터링 시작

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. API 키 설정
cp .env.local .env.local.bak
# .env.local 열고 ANTHROPIC_API_KEY 입력
# https://console.anthropic.com/settings/keys

# 3. 개발 서버
npm run dev
# → http://localhost:3000
```

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 🔍 자동 분석 | 문제 이미지 → 과목/학년/학기/단원 자동 판별 |
| ✏️ 분석 수정 | 틀린 부분 드롭다운으로 바로 수정 |
| 🌱 아주 쉬운 | MCQ only, 초등 고학년 수준 |
| 📘 쉬운 | MCQ only, 해당 학년 -1 수준 |
| 🔥 기본 | MCQ + 주관식 혼합, 정규 수준 |
| ✋ 손들기 | 중간 개입 → 보충 step AI 생성 |
| 📊 네비 바 | 단계 진행 상황 실시간 표시 |

## 수심달 철학
- 답을 절대 먼저 알려주지 않는다
- 오답 1회 → 방향 힌트, 2회 → 구체 힌트, 3회 → 정답 공개
- 개념에서 출발해 스스로 발견하게 유도

## 환경변수

| 변수 | 설명 |
|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 (필수) |

## 배포 (Vercel)

```bash
npx vercel
# ANTHROPIC_API_KEY 환경변수 설정
```
