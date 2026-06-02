# WeatherCast Studio (프로토타입)

케이웨더 데이터 기반 **AI 날씨송·영상·썸네일 반자동 생성** 대시보드.
한 화면에서 `데이터 → 텍스트 → 미디어 → 패키징` 4단계 파이프라인을 흐름대로 진행합니다.

> ⚠️ **현재는 MVP 프로토타입입니다.** 외부 API(케이웨더·Gemini·Suno·OmniHuman/Seedance)는
> 모두 **목업**(`app/api/*`)으로, 실제 호출 대신 그럴듯한 더미 데이터를 지연과 함께 반환합니다.
> UI/UX 흐름과 데이터 모델을 먼저 확정하고, 실제 키가 준비되면 라우트 내부만 교체하는 구조입니다.

## 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

> ⚠️ **Windows에서 `npm run dev`가 500 / `EISDIR` / `UNKNOWN` / `ENOENT` 오류로 실패한다면 — 실시간 백신 때문입니다 (코드 문제 아님).**
> 이 PC는 **알약(ALYac)** 실시간 감시가 켜져 있어, Next.js 개발 서버가 `.next` 폴더 파일을
> 매 컴파일마다 빠르게 다시 쓸 때 백신이 파일을 잠가 파일시스템 syscall(readlink/open)이
> 무작위로 실패합니다. (참고: `npm install`처럼 한 번에 쓰는 작업은 정상 동작)
>
> **해결 방법 (택1)**
> 1. 알약 → 환경설정 → **검사 예외(제외) 설정** → 폴더 추가 →
>    `E:\Backup\AI\Program Dev\weathercast-studio` (최소한 `.next` 하위) 등록 후 재실행
> 2. 알약 **실시간 감시 일시 중지** 후 `npm run dev`
> 3. 백신 예외가 적용된 **로컬 폴더**(예: `C:\dev\...`)에 복사해 실행

## 기술 스택

- **Next.js 14 (App Router) + TypeScript** — 프론트(대시보드) + 백엔드(API Route) 단일 프로젝트
- **Tailwind CSS** — 다크 대시보드 UI
- **Web Audio API** — 후보곡 미리듣기 톤 합성 / **Canvas** — 썸네일 실시간 렌더링

## 화면 구성 (PRD 4패널)

| 패널 | 역할 |
| --- | --- |
| 상단바 | 기상 키워드 태그 자동 추출 + 4단계 진행 스텝 |
| **Panel A** | 날짜·지역·예보타입 선택 → 케이웨더 호출 → 무드/길이/페르소나 |
| **Panel B** | Gemini 가사·나레이션·프롬프트 생성 → 직접 편집 |
| **Panel C** | Suno 후보곡 선택 · 영상 30초 분절 렌더링 · 썸네일 · 발행 |

## 아키텍처

```
app/
  page.tsx              # 대시보드 오케스트레이터 (useReducer 파이프라인 상태)
  api/
    weather/route.ts    # ⚠️ MOCK → 케이웨더
    lyrics/route.ts     # ⚠️ MOCK → Gemini
    songs/route.ts      # ⚠️ MOCK → Suno
    video/route.ts      # ⚠️ MOCK → OmniHuman/Seedance (분절 계획만 반환)
components/             # TopBar, PanelA~C, AudioPlayer, VideoPreview, Thumbnail, ui
lib/
  types.ts             # 파이프라인 공용 타입
  api.ts               # 프론트 fetch 헬퍼
  personas.ts          # 써니/레인/클라우디/썬더
  mock/                # 더미 데이터 생성기 (날씨/가사/곡/영상)
```

## 목업 → 실제 API 교체 지점

각 라우트 상단에 `⚠️ MOCK` 주석이 있습니다. 해당 함수 본문만 실제 호출로 바꾸면 됩니다.
`.env.local.example`를 `.env.local`로 복사해 키를 채우세요.

| 라우트 | 실제 서비스 | 환경변수 | 비고 |
| --- | --- | --- | --- |
| `/api/weather` | 케이웨더 B2B | `KWEATHER_API_KEY` | 계약·키 필요 |
| `/api/lyrics` | Google Gemini | `GEMINI_API_KEY` | 가장 안정적 |
| `/api/songs` | Suno | `SUNO_API_KEY` | ⚠️ 공식 API 접근 제한적 — 비동기 job 폴링 구조 필요 |
| `/api/video` | OmniHuman/Seedance | `VIDEO_API_KEY` | ⚠️ ByteDance 계열, 접근 난이도 |

## 지금도 동작하는 "실제" 기능

- ✅ 썸네일 **PNG 다운로드** (Canvas 렌더링, 16:9 / 9:16, 4색 톤)
- ✅ 대본 **.txt 다운로드** (가사/나레이션/프롬프트)
- ✅ 후보곡 미리듣기 톤 + 파형/플레이헤드, 영상 30초 분절 진행률 시뮬레이션

## 다음 단계 (우선순위)

1. **Suno·영상 API PoC** — 파이프라인 단일 실패점. 가용성·과금·약관 검증 먼저.
2. 음원/영상 비동기 job 폴링 구조로 라우트 확장.
3. 케이웨더 실제 스키마 매핑 → `lib/types.ts`의 `WeatherData` 정합.
4. 프로젝트 저장/이력, 발행(YouTube/MBN) 연동.
