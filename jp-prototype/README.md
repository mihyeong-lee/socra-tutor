# Socra Tutor — 日本版クリッカブルプロトタイプ

일본 시장용 4대 핵심 기능을 하나의 모바일 앱 흐름으로 묶은 클릭 가능한 프로토타입입니다.
의존성 없는 단일 HTML 파일이며, `index.html`을 브라우저로 열면 바로 동작합니다.

## 화면 구성

| # | 탭 | 화면 | 핵심 카피 |
|---|---|---|---|
| 1 | 質問 (Q&A) | `qa-home` → `qa-chat` | 疑問を質問して3回検証された回答をもらう |
| 2 | 家庭教師 (Tutoring) | `tutor-home` → `tutor-detail` | トップレベル大学の先輩たちから家庭教師を受ける |
| 3 | 間違いノート (Mistakes) | `mistake-home` → `mistake-detail` | 間違えた問題をまとめた間違えノートで復習する |
| 4 | デイリー学習 (Daily Path) | `daily-home` → `daily-sheet` | 弱点に基づいて処方された自分だけのデイリー学習紙をもらう |

## 인터랙션

- **하단 탭바** — 4개 핵심 기능 이동
- **Q&A** — 추천 칩 또는 직접 입력 → `AI A 1차 답변 → AI B 교차 검증 → 최종 검수` 3단계 검증 애니메이션 후 검증 완료 배지가 붙은 최종 답변
- **家庭教師** — 선생님 4명(京都大 / 東北大 / 名古屋大 / 北海道大) 프로필 상세 → 신청 바텀시트
- **間違いノート** — 과목 필터 칩, 오답 카드 → 상세(내 답 vs 정답, AI 오답 분석, 유사문제) → 다시 풀기 바텀시트
- **デイリー学習** — **매일 · 과목별로 학습지가 1장씩 생성되는 구조**. 상단에 오늘 날짜(예: 2026年8月20日（木）· 数学の学習紙)가 표시되고, 학습 경로는 그제 → 어제 → 오늘 → 내일 순의 날짜 노드로 이어집니다. 과목 칩을 바꾸면 날짜 헤더·경로·학습지 문항이 전부 해당 과목 처방으로 교체되고, 지난 날짜는 완료 상태(6/6)로, 내일 학습지는 "매일 아침 6시 자동 생성" 상태로 표시됩니다
- **KO 번역 토글** — 우측 하단 버튼으로 일본어 카피에 한국어 병기 표시/숨김

## 디자인 시스템

모든 색·타이포·radius·spacing·shadow는 [`design-system.md`](./design-system.md)의 토큰을 CSS 변수로 매핑해 사용했습니다.

- §1 Color → `--color-blue-*`, `--color-gray-*`, `--color-purple/green/error/yellow/coral/pink-*`, `--gradient-*`
- §2 Typography → `.t-h1` ~ `.t-caption2` 유틸 클래스, 폰트 `IBM Plex Sans JP / KR`
- §3 Shadow → `--shadow-down-*`, `--shadow-up-*`, `--shadow-down-light`
- §4 Spacing & Radius → `--spacing-*`, `--radius-*`
- §5 Components → Button / Chip / Drawer / Toast / TabBar / ProgressBar / AgentMessage / HumanMessage / ChatInput 패턴 반영
- §6 화면 패턴 → 패턴 A(채팅), 패턴 B(목록), 패턴 C(선택 바텀시트)

하단 탭바(`Bottombar`)는 디자인 시스템상 코드 미구현 컴포넌트라 가장 가까운 형태로 구현하고 `TODO: 컴포넌트 확인` 주석을 남겼습니다.

## 실행

```bash
open jp-prototype/index.html
# 또는
python3 -m http.server 8000 && open http://localhost:8000/jp-prototype/
```
