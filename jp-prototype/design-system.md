---
title: "디자인 시스템"
type: convention
status: current
scope: "apps/web design tokens, typography, components"
audience:
  - web
  - agents
owners:
  - "web"
source_of_truth: true
update_triggers:
  - "design token 구조 변경(colors/fonts/shadows/spacings/radius)"
  - "shared/ui 컴포넌트 추가·리네임"
  - "Storybook story title(Components/*) 구조 변경"
related:
  - apps/web/docs/conventions/tailwind-css.md
  - apps/web/docs/guides/prototyping.md
  - apps/web/src/shared/styles/colors.css
  - apps/web/src/shared/styles/fonts.css
tags:
  - web
  - design-system
  - tokens
---

# 디자인 시스템

이 문서는 Socra web의 **디자인 토큰·타이포·컴포넌트 카탈로그(SSOT)**이며, 아래 Figma를 단일 진실 공급원으로 참고합니다. 스타일을 작성하는 **방법**(utility-first·`cn`·토큰화/컴포넌트 승격 시점)은 [`tailwind-css.md`](tailwind-css.md)를 따릅니다.

- [Socra 스타일 가이드](https://www.figma.com/design/7nUi27PGTBZcyrMYFsOmHq/%F0%9F%90%B1SOCRA-AI_Style-guide_Re?m=auto&t=09whpgXvJ3kuvc9b-6)를 추출한 디자인 토큰을 tailwind 테마 변수로 매핑합니다.
- [Socra 컴포넌트](https://www.figma.com/design/zuh4YCrkQqwvPh6ChoD3VT/%F0%9F%90%B1SOCRA-AI_Components-Patterns_Re?m=auto&t=09whpgXvJ3kuvc9b-6)에 따라 컴포넌트를 정의합니다.

## 원칙

**토큰만 사용**
- 색·폰트·radius·spacing은 §1·§2·§4의 **테마 변수(토큰)만** 사용합니다. 임의의 hex/px/색이나 새 테마 변수를 함부로 만들지 않습니다. (예: `color-blue-100`, `text-body2-r`, `rounded-3`)
- 적합한 토큰이 없으면 추측하지 말고 **가장 가까운 토큰**을 쓰고 `// TODO: 토큰 확인` 주석을 남깁니다.
- 코드베이스가 socra-tutor-fe(apps/web) 내부면 `@shared/styles` 정의를 그대로 따르고, 외부면 위 토큰을 새로 정의해 사용합니다.

**기본값**
- Font family는 `IBM Plex Sans KR` (전체 공통).
- 본문 `text-body2-r`/`text-body3-r`, 제목 `text-h*`, 버튼 라벨 `text-button-*`.
- 기본 액션·링크·포커스 색은 `color-blue-500` (#4C9EF3).

**컴포넌트 우선**
- 새 UI를 마크업으로 그리지 말고 **§5의 기존 컴포넌트를 import해 인스턴스로** 사용합니다.
- 정확한 prop·예시는 소스/Storybook을 참고합니다.
- §5에 없는 컴포넌트는 새로 그리지 말고 가장 가까운 것 + `// TODO: 컴포넌트 확인`.

**코드 → Figma 매핑**
- 이 문서의 매핑 표는 양방향입니다. 코드 구현을 Figma로 옮길 때도 임의 스타일·프레임을 새로 그리지 말고, 각 테마 변수·컴포넌트에 대응하는 **Figma Variable/Style**과 **Figma 컴포넌트**를 인스턴스로 사용합니다. 
- 색·shadow·흑백은 §1·§3 표의 `Figma 스타일명` 열을, 컴포넌트는 §5 `Figma → 코드 이름 매핑` 표를 **역방향으로** 참조합니다.
- 타이포·spacing·radius는 별도 `Figma 스타일명` 열이 없고 테마 변수 이름이 곧 Figma Text style·Variable에 대응합니다(예: `text-body2-r` → Figma Text style, `spacing-4` → Figma Variable).
- 대응하는 Figma Variable/Style·컴포넌트가 없으면 새로 만들지 말고 가장 가까운 것을 쓰고 `// TODO` 주석을 남기는 위 원칙을 동일하게 적용합니다.

## 1. Color

> **디폴트 컬러는 `color-blue-500`** (#4C9EF3).

### Blue

| Variable        | HEX     | Figma 스타일명 |
|------------------|---------|----------------|
| `color-blue-900` | #060E20 | Blue/Blue-900  |
| `color-blue-800` | #021439 | Blue/Blue-800  |
| `color-blue-700` | #0E2759 | Blue/Blue-700  |
| `color-blue-650` | #1B478E | Blue/Blue-650  |
| `color-blue-600` | #2766C4 | Blue/Blue-600  |
| `color-blue-550` | #3A82DB | Blue/Blue-550  |
| `color-blue-500` | #4C9EF3 | Blue/Blue-500  |
| `color-blue-400` | #82C0F9 | Blue/Blue-400  |
| `color-blue-300` | #B8E2FF | Blue/Blue-300  |
| `color-blue-200` | #D1EBFF | Blue/Blue-200  |
| `color-blue-150` | #E8F4FF | Blue/Blue-150  |
| `color-blue-100` | #F5FAFF | Blue/Blue-100  |
| `color-blue-50`  | #FAFDFF | Blue/Blue-50   |


### Gray

> 코드(`--color-gray-*`) 기준. 기준(GRAY-0)에서 **`m`=밝게(minus)**, **`p`=어둡게(plus)**. Tailwind class는 `text-gray-m4`, `bg-gray-p1` 형태


| Variable | HEX | Figma 스타일명 |
|---|---|---|
| `color-gray-m4` | #F3F4F6 | Gray/GRAY-4 |
| `color-gray-m3.5` | #E3E4EB | Gray/GRAY-3.5 |
| `color-gray-m3` | #DADAE2 | Gray/GRAY-3 |
| `color-gray-m2` | #B5B7C6 | Gray/GRAY-2 |
| `color-gray-m1` | #9398AC | Gray/GRAY-1 |
| `color-gray` | #777B96 | Gray/GRAY-0 |
| `color-gray-p0.5` | #6A6E89 | Gray/GRAY+0.5 |
| `color-gray-p1` | #5D617C | Gray/GRAY+1 |
| `color-gray-p2` | #464A65 | Gray/GRAY+2 |
| `color-gray-p3` | #30344F | Gray/GRAY+3 |
| `color-gray-p4` | #090C32 | Gray/GRAY+4 |

### Point (보조 컬러)

> Pink 스케일은 현재 미구현입니다. 구현에 필요하다면 테마 변수를 새롭게 정의해 주세요.
 

| Variable           | HEX     | Figma 스타일명                                        |
|--------------------|---------|-------------------------------------------------------|
| `color-purple-900` | #3A1C99 | Point/Purple/Purple-900                               |
| `color-purple-700` | #4F2BCF | Point/Purple/Purple-700                               |
| `color-purple-500` | #7556F1 | Point/Purple/Purple-500                               |
| `color-purple-300` | #B7A3FF | Point/Purple/Purple-300                               |
| `color-purple-100` | #F0E9FF | Point/Purple/Purple-100                               |
| `color-green-900`  | #168852 | Point/Green/Green-900                                 |
| `color-green-700`  | #0FAF6A | Point/Green/Green-700                                 |
| `color-green-500`  | #63E4A0 | Point/Green/Green-500                                 |
| `color-green-300`  | #A8F4C9 | Point/Green/Green-300                                 |
| `color-green-100`  | #E3F9EE | Point/Green/Green-100                                 |
| `color-error-900`  | #99283C | Point/Red/Red-900                                     |
| `color-error-700`  | #DC2C4B | Point/Red/Red-700                                     |
| `color-error-500`  | #F95C78 | Point/Red/Red-500                                     |
| `color-error-300`  | #F8A8B4 | Point/Red/Red-300                                     |
| `color-error-100`  | #FDE3E8 | Point/Red/Red-100                                     |
| `color-yellow-900` | #8F7420 | Point/Yellow/Yellow-900                               |
| `color-yellow-700` | #DAB72A | Point/Yellow/Yellow-700                               |
| `color-yellow-500` | #FFE56E | Point/Yellow/Yellow-500                               |
| `color-yellow-300` | #FFF0A8 | Point/Yellow/Yellow-300                               |
| `color-yellow-100` | #FFF9E1 | Point/Yellow/Yellow-100                               |
| `color-coral-900`  | #8B3F2A | Point/Coral/Coral-900                                 |
| `color-coral-700`  | #D65840 | Point/Coral/Coral-700                                 |
| `color-coral-500`  | #F48D72 | Point/Coral/Coral-500                                 |
| `color-coral-300`  | #F8B8A6 | Point/Coral/Coral-300                                 |
| `color-coral-100`  | #FDE9E4 | Point/Coral/Coral-100                                 |
| `color-pink-900`   | #7D2D60 | Point/Pink/Pink-900 · 코드 미구현                   |
| `color-pink-700`   | #D42396 | Point/Pink/Pink-700 · 코드엔 `gradient-pink-from`만 |
| `color-pink-500`   | #EE70C2 | Point/Pink/Pink-500 · 코드엔 `gradient-pink-to`만   |
| `color-pink-300`   | #F6ACD5 | Point/Pink/Pink-300 · 코드 미구현                   |
| `color-pink-100`   | #FCE6F3 | Point/Pink/Pink-100 · 코드 미구현                   |


### Common (흑/백)

**(1) 솔리드 — 테마 변수**

| Variable      | HEX     | Figma 스타일명     |
|---------------|---------|--------------------|
| `color-white` | #FFFFFF | Common/White/White |
| `color-black` | #000000 | Common/Black/Black |


**(2) 투명도 — Tailwind opacity 유틸 (테마 변수 아님)**

> 투명도는 별도 변수가 없고 Tailwind opacity 모디파이어로 처리합니다. `bg-` 외 `text-`/`border-` 등에도 동일하게 적용됩니다(`text-white/70`).
> HEX는 Figma sRGB 알파 기준이며, Tailwind `/n`은 oklab `color-mix`라 **근사치**입니다.

| Variable      | ≈ HEX     | Figma 스타일명        |
|---------------|-----------|-----------------------|
| `bg-white/90` | #FFFFFFE5 | Common/White/White_90 |
| `bg-white/80` | #FFFFFFCC | Common/White/White_80 |
| `bg-white/70` | #FFFFFFB2 | Common/White/White_70 |
| `bg-white/60` | #FFFFFF99 | Common/White/White_60 |
| `bg-white/50` | #FFFFFF80 | Common/White/White_50 |
| `bg-white/40` | #FFFFFF66 | Common/White/White_40 |
| `bg-white/30` | #FFFFFF4D | Common/White/White_30 |
| `bg-white/20` | #FFFFFF33 | Common/White/White_20 |
| `bg-white/10` | #FFFFFF1A | Common/White/White_10 |
| `bg-black/10` | #0000001A | Common/Black/Black_10 |
| `bg-black/20` | #00000033 | Common/Black/Black_20 |
| `bg-black/30` | #0000004D | Common/Black/Black_30 |
| `bg-black/40` | #00000066 | Common/Black/Black_40 |
| `bg-black/50` | #00000080 | Common/Black/Black_50 |
| `bg-black/60` | #00000099 | Common/Black/Black_60 |
| `bg-black/70` | #000000B2 | Common/Black/Black_70 |
| `bg-black/80` | #000000CC | Common/Black/Black_80 |
| `bg-black/90` | #000000E5 | Common/Black/Black_90 |


### Gradient


| Variable            | HEX (from → … → to)                             | Figma 스타일명             |
|---------------------|-------------------------------------------------|----------------------------|
| `gradient-blue-700` | #2766C4 → #0E2759  (linear)                     | Gradient/Blue-700          |
| `gradient-blue-600` | #0FAFFF → #0067BF  (linear)                     | Gradient/Blue-600          |
| `gradient-blue-500` | #72C6FF → #2A72DE  (linear)                     | Gradient/Blue-500          |
| `gradient-blue-400` | #B3E0FF → #61B8F1  (linear)                     | Gradient/Blue-400          |
| `gradient-blue-200` | #FDFDFD → #B3E0FF  (linear)                     | Gradient/Blue-200          |
| `gradient-pink`     | #D42396 → #EE70C2  (radial)                     | Gradient/Pink              |
| `gradient-pb`       | #B7A3FF → #4C9EF3 → #82C0F9  (linear)           | Gradient/Purple-Blue       |
| `gradient-bgp`      | #8BC9FB → #A8F4C9 → #76BDF8 → #B7A3FF  (linear) | Gradient/Blue-Green-Purple |
| `gradient-grb`      | #A8F4C9 → #B3E0FF → #61B8F1  (linear)           | Gradient/Green-Blue        |
| `gradient-gb`       | #DADAE2 → #B3E0FF  (linear)                     | Gradient/Gray-Blue         |


## 2. Typography

모든 스타일은 `IBM Plex Sans KR`. line-height·letter-spacing은 별도 표기 없으면 아래 값.

> **기본 본문은 16px** (`text-body2-r` / `text-body2-m`). 단, **채팅 말풍선은 전용 토큰 `text-body-chat`**(16px·line-height 170%·자간 -2%)을 사용합니다.

### Display (큰 제목)

| Variable           | Size | Weight         | Line-height | Letter-spacing |
|--------------------|------|----------------|-------------|----------------|
| `text-display1-sb` | 44px | SemiBold (600) | 160%        | -1.2%          |
| `text-display2-b`  | 36px | Bold (700)     | 160%        | -1.2%          |
| `text-display2-sb` | 36px | SemiBold (600) | 160%        | -1.2%          |
| `text-display3-b`  | 32px | Bold (700)     | 160%        | -1.2%          |
| `text-display3-sb` | 32px | SemiBold (600) | 160%        | -1.2%          |
| `text-display3-m`  | 32px | Medium (500)   | 160%        | -1.2%          |
| `text-display4-sb` | 28px | SemiBold (600) | 160%        | -1.2%          |
| `text-display4-m`  | 28px | Medium (500)   | 160%        | -1.2%          |
| `text-display5-sb` | 24px | SemiBold (600) | 160%        | -1.2%          |

### Heading (제목)

| Variable                | Size | Weight         | Line-height | Letter-spacing |
|-------------------------|------|----------------|-------------|----------------|
| `text-h1`               | 22px | SemiBold (600) | 160%        | -1.2%          |
| `text-h2`               | 20px | SemiBold (600) | 160%        | -1.2%          |
| `text-h3`               | 18px | SemiBold (600) | 160%        | -1.2%          |
| `text-h4`               | 16px | SemiBold (600) | 160%        | -1.2%          |
| `text-h5` _(코드 전용)_ | 14px | Medium (500)   | 160%        | -1.2%          |

### Body (본문)

| Variable          | Size | Weight        | Line-height | Letter-spacing |
|-------------------|------|---------------|-------------|----------------|
| `text-body1-m`    | 18px | Medium (500)  | 160%        | -1.2%          |
| `text-body1-r`    | 18px | Regular (400) | 160%        | -1.2%          |
| `text-body2-m`    | 16px | Medium (500)  | 160%        | -1.2%          |
| `text-body2-r`    | 16px | Regular (400) | 160%        | -1.2%          |
| `text-body3-m`    | 15px | Medium (500)  | 160%        | -1.2%          |
| `text-body3-r`    | 15px | Regular (400) | 160%        | -1.2%          |
| `text-body4-m`    | 14px | Medium (500)  | 160%        | -1.2%          |
| `text-body4-r`    | 14px | Regular (400) | 160%        | -1.2%          |
| `text-body5-m`    | 13px | Medium (500)  | 160%        | -1.2%          |
| `text-body5-r`    | 13px | Regular (400) | 160%        | -1.2%          |
| `text-body-model` | 14px | Regular (400) | 180%        | -1.2%          |
| `text-body-chat`  | 16px | Regular (400) | 170%        | -2%            |

### Label (버튼·캡션·태그)

| Variable            | Size | Weight         | Line-height | Letter-spacing |
|---------------------|------|----------------|-------------|----------------|
| `text-button-l`     | 16px | SemiBold (600) | 160%        | 0%             |
| `text-button-m`     | 14px | SemiBold (600) | 160%        | 0%             |
| `text-button-s`     | 13px | Medium (500)   | 160%        | 0%             |
| `text-caption1`     | 11px | SemiBold (600) | 160%        | -1.2%          |
| `text-caption2`     | 11px | Regular (400)  | 160%        | -1.2%          |
| `text-tag`          | 12px | Medium (500)   | 160%        | -2%            |
| `text-tag-model`    | 14px | Text (450)     | 18px        | -2%            |
| `text-tag-model-s`  | 12px | Text (450)     | 18px        | -2%            |
| `text-tag-model-xs` | 10px | Regular (400)  | 16px        | -2%            |


## 3. Shadow & Effect

### Shadow (코드: `--shadow-*` 토큰 → `shadow-*` 유틸)


| Variable            | box-shadow                           | Figma 스타일명                         |
|---------------------|--------------------------------------|----------------------------------------|
| `shadow-down-100`   | 0 3px 12px rgba(203, 215, 223, 0.2)  | Shadow/down-100                        |
| `shadow-down-200`   | 0 3px 12px rgba(203, 215, 223, 0.4)  | Shadow/down-200                        |
| `shadow-down-300`   | 0 6px 16px rgba(185, 186, 210, 0.4)  | Shadow/down-300                        |
| `shadow-down-500`   | 0 4px 16px rgba(0, 0, 0, 0.2)        | Shadow/down-500                        |
| `shadow-up-100`     | 0 -3px 12px rgba(203, 215, 223, 0.2) | Shadow/up-100                          |
| `shadow-up-200`     | 0 -3px 12px rgba(203, 215, 223, 0.4) | Shadow/up-200                          |
| `shadow-up-300`     | 0 -6px 16px rgba(185, 186, 210, 0.4) | Shadow/up-300                          |
| `shadow-up-500`     | 0 -4px 16px rgba(0, 0, 0, 0.2)       | Shadow/up-500                          |
| `shadow-down-light` | 0 3px 12px rgba(185, 186, 210, 0.4)  | ⚠️ Figma에 없는 커스텀(채팅 입력창 등) |

### Effect (blur · glass)

> blur는 별도 effect 토큰 없이 Tailwind `--blur-*`(`backdrop-blur-1/2/4` = 4/8/16px)로 처리합니다.
> `glass`/`mirror`/`noise`는 blur+shadow+노이즈 텍스처 합성이라 단일 토큰으로 부적합 → 필요 시 유틸/오버레이로 구현(현재 미구현).

| Figma | CSS | 비고 |
|---|---|---|
| Effect/Blur-100·200·300 | backdrop-filter: blur(4/8/16px) | `backdrop-blur-1/2/4` 사용 |
| Effect/glass | blur(10px) + 0 3px 20px rgba(176,190,200,.3) | 미구현 (합성) |
| Effect/mirror | blur(8px) + noise | 미구현 (텍스처) |
| Effect/noise-100 | noise overlay | 미구현 (텍스처) |


## 4. Spacing & Radius

> 코드는 Tailwind 스케일을 사용합니다.
> `--spacing-1` = 0.25rem = **4px**, `--spacing-4` = 1rem = **16px**

### Spacing (코드: `--spacing-*`, Tailwind 4-step)
| Variable     | 값   | Tailwind class | 주 용도                       |
|--------------|------|----------------|-------------------------------|
| `spacing-1`  | 4px  | `p-1`,`gap-1`  | 아이콘-텍스트, 최소 gap       |
| `spacing-2`  | 8px  | `p-2`          | 칩/인풋 내부, 기본 gap        |
| `spacing-3`  | 12px | `p-3`          | 리스트 행 좌우 패딩           |
| `spacing-4`  | 16px | `p-4`          | 버튼 패딩, 컨테이너 기본 여백 |
| `spacing-5`  | 20px | `p-5`          | 중간 여백                     |
| `spacing-6`  | 24px | `p-6`          | 섹션 간 간격                  |
| `spacing-8`  | 32px | `p-8`          | 큰 섹션 구분                  |
| `spacing-10` | 40px | `p-10`         | 페이지 상하 여백              |
| `spacing-12` | 48px | `p-12`         | 넓은 여백                     |
| `spacing-16` | 64px | `p-16`         | 페이지 외곽 / 히어로          |


### Radius (코드: `--radius-*`, Tailwind 스케일)

> Tailwind class는 **숫자 그대로** `rounded-3`, `rounded-2.5` 형태(`rounded-sm/md/lg`가 아님). `rounded-full`은 `--radius-*` 변수가 아닌 **Tailwind 빌트인**(9999px pill)이며 실제로 가장 많이 쓰인다.

| Variable        | 값     | Tailwind class    | 적용 예                              |
|-----------------|--------|-------------------|--------------------------------------|
| `radius-1`      | 4px    | `rounded-1`       | 작은 배지, 바                        |
| `radius-1.5`    | 6px    | `rounded-1.5`     | 작은 라운드                          |
| `radius-2`      | 8px    | `rounded-2`       | chip, system 인풋                    |
| `radius-2.5`    | 10px   | `rounded-2.5`     | Tab·list 실측 10px                   |
| `radius-3`      | 12px   | `rounded-3`       | Button, Toast (최다 사용)            |
| `radius-4`      | 16px   | `rounded-4`       | 카드                                 |
| `radius-5`      | 20px   | `rounded-5`       | card_main                            |
| `radius-6`      | 24px   | `rounded-6`       | 큰 카드/시트                         |
| `radius-8`      | 32px   | `rounded-8`       | 매우 큰 시트                         |
| `radius-circle` | 50%    | `rounded-circle`  | 원형 (정사각형 요소에서만 원)        |
| _(빌트인)_      | 9999px | `rounded-full`    | pill (Toggle/badge 등 가로로 긴 요소) |


## 5. Components

- 구현된 컴포넌트는 모두 `apps/web/src` 안에 있고, 각 컴포넌트에 **Storybook 스토리(`Components/<이름>`)**가 있어 사용 예시를 제공하고 있습니다.
- 새 화면을 시작할 때는 마크업을 새로 그리거나 컴포넌트를 새로 만들기보다는, 가급적 기존 컴포넌트를 사용합니다.
- prop·사용 예시는 소스(`*.tsx`)와 Storybook 스토리(`*.stories.tsx`)를 참고합니다. 아래 표는 빠른 인덱스입니다.
- `import` 열의 `(내부)`는 특정 widget 슬라이스 **내부 컴포넌트**(범용 빌딩블록 아님, 해당 화면 맥락 전용)입니다.
- `Dialog`/`Drawer`/`ToastContainer`/`FullOverlay`/`SessionOverlay`는 직접 렌더가 아니라 `showDialog`/`showDrawer`/`showToast`/`showSessionOverlay` 등으로 띄웁니다(스토리의 하네스 참고).


| 컴포넌트 (export) | import | Storybook | 용도 |
|---|---|---|---|
| `AgentIcon` | `@/widgets/chat-log/ui/agent-icon` (내부) | Components/Agent Icon | AI 모델 아바타 |
| `AgentMessage` | `@/widgets/chat-log` | Components/Agent Message | AI 말풍선(마크다운 렌더) |
| `AnimatedCheck` · `AnimatedClose` · `AnimatedHypen` | `@/shared/ui/animated-icons` | Components/Animated Icons | 인라인 애니메이션 아이콘(체크/닫기/하이픈) |
| `AnimatedTrafficSignal` | `@/shared/ui/animated-traffic-signal` | Components/Animated Traffic Signal | 신호등(애니메이션) |
| `Badge` | `@/shared/ui/badge` | Components/Badge | 점 뱃지(그라데이션) |
| `Button` | `@/shared/ui/button` | Components/Button | 기본 버튼(theme·size) |
| `CatAnimatedImage` | `@/shared/ui/cat-animated-image` | Components/Cat Animated Image | 고양이 캐릭터 애니메이션 |
| `ChatInput` | `@/widgets/chat-composer` | Components/Chat Input Web | 채팅 입력 컴포저(전체) |
| `ChatInputBrowseButton` | `@/widgets/chat-input` | Components/Browse Button | 사진 첨부 버튼 |
| `ChatInputFloatingActions` | `@/widgets/chat-input` | Components/Floating Actions | 입력창 전송/액션 버튼 |
| `ChatLog` | `@/widgets/chat-log` | Components/Chat Log | 채팅 로그 리스트 |
| `CheckBox` | `@/shared/ui/check-box` | Components/Check Box | 체크박스·라디오(`theme`) |
| `Chip` | `@/shared/ui/chip` | Components/Chip | 칩 라벨 |
| `CompletionCallout` | `@/widgets/session-tutorial-overlay` | Components/Completion Callout | 튜토리얼 완료 콜아웃 |
| `DeleteButton` | `@/widgets/side-drawer/ui/delete-button` (내부) | Components/Delete Button | 삭제 액션 버튼 |
| `Dialog` | `@/shared/ui/dialog` | Components/Error Alert | 중앙 모달(`showDialog`) |
| `Drawer` | `@/shared/ui/drawer` | Components/Drawer | 바텀시트(`showDrawer`) |
| `ErrorAlert` | `@/features/dialog-prompts` | Components/Error Alert | 에러 다이얼로그(Dialog 기반) |
| `FullOverlay` | `@/shared/ui/full-overlay` | Components/Full Overlay | 전체화면 포털 오버레이 |
| `GuardTooltip` | `@/shared/ui/guard-tooltip` | Components/Guard Tooltip | 차단 동작 안내 툴팁 |
| `HistoryItem` | `@/widgets/side-drawer/ui/history-item` (내부) | Components/History Item | 세션 기록 행 |
| `HistoryItemCard` | `@/widgets/side-drawer/ui/history-item-card` (내부) | Components/History Item Card | 세션 기록 카드 |
| `HumanMessage` | `@/widgets/chat-log/ui/human-message` (내부) | Components/Human Message | 유저 말풍선 |
| `Icon` | `@/shared/ui/icons` | Components/Icons | 아이콘 세트(`Icon.Close` 등) |
| `IconButton` | `@/shared/ui/icon-button` | Components/Icon Button | 아이콘 전용 버튼 |
| `ImagePreview` | `@/shared/ui/image-preview` | Components/Image Preview | 이미지 확대 미리보기 |
| `IncidentBox` | `@/widgets/chat-log` | Components/Incident Box | 오류·안내 박스 |
| `LoaderBounce` | `@/shared/ui/loader-bounce` | Components/Loader Bounce | 점 바운스 로딩 |
| `LoadingSpinner` | `@/shared/ui/loading-spinner` | Components/Loading Spinner | 원형 스피너 |
| `MarkdownViewer` | `@/shared/ui/markdown-viewer` | Components/Markdown Viewer | 마크다운·수식 렌더 |
| `Menu` | `@/shared/ui/menu` | Components/Menu | 메뉴/설정 리스트 |
| `ModelChipLogo` · `ModelCardLogo` | `@/entities/chat` | Components/Model Logo | 모델 로고(칩·카드) |
| `ProgressBar` | `@/shared/ui/progress-bar` | Components/Progress Bar | 진행 바 |
| `QuotePrinter` | `@/shared/ui/quote-printer` | Components/Quote Printer | 타이핑 효과 텍스트 |
| `RadioGroup` | `@/shared/ui/radio-group` | Components/Radio Group | 라디오 그룹 컨텍스트 |
| `RippleEffect` | `@/shared/ui/ripple-effect` | Components/Ripple Effect | 클릭 물결 효과(부모 채움) |
| `ScrollDown` | `@/widgets/chat-log/ui/scroll-down` (내부) | Components/Scroll Down | 맨 아래로 스크롤 버튼 |
| `SessionBlockedAlert` 등 | `@/features/dialog-prompts` | Components/Session Alerts | 세션 상태 다이얼로그 |
| `SessionPageSkeleton` | `@/widgets/session-report` | Components/Session Page Skeleton | 세션 페이지 스켈레톤 |
| `showSessionOverlay` | `@/features/session-overlay` | Components/Session Overlay | 세션 전체화면 오버레이 |
| `Shimmer` · `ShimmerGroup` | `@/shared/ui/shimmer` | Components/Shimmer | 스켈레톤 셔머 |
| `ShiningText` | `@/shared/ui/shining-text` | Components/Shining Text | 빛 흐르는 텍스트 |
| `SignalHeader` | `@/widgets/session-report/ui/signal-header` (내부) | Components/Signal Header | 신호(정답) 헤더 |
| `SolutionCarousel` | `@/widgets/session-report/ui/solution-carousel` (내부) | Components/Solution Carousel | 모델 풀이 캐러셀 |
| `SurveyOption` | `@/widgets/survey-form` | Components/Survey Option | 설문 선택 항목 |
| `SystemMessage` | `@/widgets/chat-log/ui/system-message` (내부) | Components/System Message | 시스템 메시지(think/error 등) |
| `TabBar` · `TabItem` | `@/shared/ui/tab` | Components/Tab | 탭(line·button) |
| `TextField` | `@/shared/ui/text-field` | Components/Text Field | 입력 필드(input·textarea) |
| `TextInputSet` | `@/shared/ui/text-input-set` | Components/Text Input Set | 라벨+힌트 인풋 세트 |
| `TextSelectSet` | `@/widgets/text-select-set` | Components/Text Select Set | 드롭다운형 선택(Drawer) |
| `ToastContainer` | `@/shared/lib/toast` | Components/Toast Container | 토스트(`showToast`) |
| `ToggleSwitch` | `@/shared/ui/toggle-switch` | Components/Toggle Switch | 토글 스위치 |
| `TooltipBubble` | `@/shared/ui/tooltip-bubble` | Components/Tooltip Bubble | 말풍선 툴팁 |
| `TopBar` · `TopBarWithBack` | `@/shared/ui/top-bars` | Components/Top Bar | 상단바 |
| `TrafficSignal` | `@/shared/ui/traffic-signal` | Components/Traffic Signal | 신호등(정적) |
| UniqueIcons (`DownGradient` · `SparkGradient`) | `@/shared/ui/unique-icons` | Components/Unique Icons | 그라데이션 아이콘 |
| `VideoAnimation` | `@/shared/ui/video-animation` | Components/Video Animation | 비디오 애니메이션 |
| `VirtualizedList` | `@/shared/ui/virtualized-list` | Components/Virtualized List | 가상 스크롤 리스트 |


### Figma → 코드 이름 매핑

Figma 컴포넌트명과 코드 export 이름이 다른 주요 항목(Figma 이름으로 찾지 말고 코드 export 사용):

| Figma | 코드 |
|---|---|
| Modal / System popup | `Dialog` (+ `ErrorAlert` / `Session*Alert`) |
| Bottomsheet / action_sheet | `Drawer` |
| Spinner | `LoadingSpinner` |
| Toast popup | `ToastContainer` |
| Topbar | `TopBar` / `TopBarWithBack` |
| Bubble_AI | `AgentMessage` |
| Bubble_user | `HumanMessage` |
| send_btn | `ChatInputFloatingActions` |
| camera_btn | `ChatInputBrowseButton` |
| model_chip | `ModelChipLogo` |
| Control / check box | `CheckBox` (`theme=check\|radio`) |
| Dropdown | `Menu` / `TextSelectSet` |
| list | `VirtualizedList` |
| Toggle | `ToggleSwitch` |
| chip | `Chip` (color는 `primary\|gray`만 구현) |


### Figma엔 있으나 코드 미구현

`Bottombar`(하단 탭바), `profile`(3D 캐릭터), `survey_list`(단독 컴포넌트), `Page Indicator`, `keypad_group`, `Compare_btn` 등 — 새로 그리지 말고 가장 가까운 기존 컴포넌트를 쓰고 `// TODO: 컴포넌트 확인` 주석을 남깁니다.

## 6. 화면 패턴 (제안 — 실제 화면으로 검증 필요)

> 이 제품은 AI 대화 앱으로 현재는 주로 모바일 화면을 통해 제공됩니다.
> 정식으로 PC 웹 버전의 디자인을 지원하기 전까지는 아래 앱 패턴을 따릅니다.

### 패턴 A — 채팅 화면
```
[TopBar (title)]
[메시지 리스트: AgentMessage / HumanMessage 반복]
[하단 고정: ChatInput (전송·사진 첨부 버튼 포함)]
```

### 패턴 B — 설정/목록 화면
```
[TopBarWithBack]
[Menu (설정 행 리스트)]
[필요 시 섹션 구분]
```

### 패턴 C — 선택 바텀시트
```
[Drawer (direction=bottom, showDrawer로 표시)]
  [선택 리스트: RadioGroup / CheckBox 또는 TextSelectSet]
  [하단: Button (취소·확인)]
```

> 새 화면은 위 패턴 중 하나로 시작하고, 들어가는 컴포넌트만 교체합니다.

## 부록 A. Figma에는 없지만 코드에서는 사용 중인 테마 변수


| 토큰 | 값 | 비고 |
|---|---|---|
| `color-tutorial-highlight` | #FF7FD2 | 튜토리얼 콜아웃/하이라이트 전용 (Figma 정식 토큰 아님) |
| `color-tutorial-signal-bg` | #D8FEED | 튜토리얼 시그널 배경 |
| `text-h5` | 14px / Medium 500 | 코드 heading 스케일 막내 |
| `text-tag-model-s` | 12px / Text 450 | model 태그 small |
| `text-tag-model-xs` | 10px / Regular 400 | model 태그 x-small |
| `radius-2.5` | 10px | Tab·list 실측값 |


