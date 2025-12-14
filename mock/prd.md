# Snowby - 스키/스노보드 트래킹 앱 PRD

## 1. 개요

### 1.1 앱 설명
Snowby는 스키/스노보드 활동을 실시간으로 추적하고 기록하는 모바일 애플리케이션입니다. GPS 기반으로 위치, 속도, 고도를 추적하며, 자동으로 활강/리프트/정지 상태를 감지합니다.

### 1.2 핵심 가치
- 실시간 GPS 기반 활동 추적
- 자동 상태 감지 (활강/리프트/정지)
- 백그라운드 추적 지원
- 데이터 보호 및 크래시 복구
- 갤러리 사진 자동 매핑

---

## 2. 기술 스택

### 2.1 프레임워크 및 런타임
| 기술 | 버전 | 용도 |
|------|------|------|
| Expo | ^54.0.0 | React Native 프레임워크 |
| React Native | 0.81.5 | 모바일 앱 개발 |
| React | 19.1.0 | UI 라이브러리 |
| TypeScript | ~5.9.2 | 타입 안전성 |
| Expo Router | ~6.0.10 | 파일 기반 라우팅 |

### 2.2 상태 관리 및 저장소
| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| Zustand | ^5.0.9 | 전역 상태 관리 |
| AsyncStorage | ^2.2.0 | 설정 영속화 |
| expo-sqlite | ~16.0.10 | 로컬 SQLite DB |

### 2.3 위치 및 지도
| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| expo-location | ~19.0.8 | GPS 위치 추적 |
| expo-task-manager | ~14.0.9 | 백그라운드 태스크 |
| @maplibre/maplibre-react-native | ^10.4.2 | 지도 렌더링 |

### 2.4 인증
| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| better-auth | - | 클라이언트 인증 |
| @better-auth/expo | - | Expo 인증 플러그인 |
| expo-secure-store | - | 토큰 보안 저장 |

### 2.5 기타 핵심 라이브러리
| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| expo-notifications | ~0.32.14 | 푸시 알림 |
| expo-media-library | ~18.2.1 | 갤러리 접근 |
| expo-keep-awake | ~15.0.8 | 화면 유지 |
| expo-localization | ~17.0.8 | 다국어 지원 |
| NativeWind | ^4.2.1 | Tailwind CSS |
| dayjs | ^1.11.19 | 날짜/시간 처리 |
| i18n-js | ^4.5.1 | 다국어 번역 |

---

## 3. 데이터 모델

### 3.1 User (사용자)
```typescript
type User = {
    id: string
    email: string
    name: string
    image: string | null
} | null
```

### 3.2 TrackingStatus (상태)
```typescript
type TrackingStatus = 'start' | 'pause' | 'stop'
```

| 상태 | 설명 | UI 표시 |
|------|------|---------|
| `stop` | 트래킹 대기 | Flag 버튼 |
| `start` | 트래킹 진행 중 | Pause + Square 버튼 |
| `pause` | 트래킹 일시정지 | Play + Square 버튼 |

### 3.3 TrackingData (실시간 데이터)
```typescript
type TrackingData = {
    startLatitude: number      // 시작 위도
    startLongitude: number     // 시작 경도
    currentLatitude: number    // 현재 위도
    currentLongitude: number   // 현재 경도
    totalDistance: number      // 총 이동 거리 (km)
    maxVertical: number        // 최대 수직 이동 (m)
    totalRuns: number          // 총 활주 횟수
    maxSpeed: number           // 최고 속도 (km/h)
    totalTime: number          // 총 시간 (분)
    locations: [number, number][] // [lng, lat] 경로 배열
}
```

### 3.4 ActivityState (자동 감지 상태)
```typescript
type ActivityState = 'skiing' | 'lifting' | 'resting'
```

| 상태 | 감지 조건 |
|------|----------|
| `skiing` | 고도 하강 + 속도 > 5km/h |
| `lifting` | 고도 상승 + 일정 속도 이동 |
| `resting` | 속도 < 1km/h + 고도 변화 없음 |

### 3.5 GPS Signal Level
```typescript
const GPS_SIGNAL_LEVELS = {
    excellent: { bars: 4, color: '#22c55e' },  // accuracy < 5m
    good:      { bars: 3, color: '#84cc16' },  // accuracy < 10m
    fair:      { bars: 2, color: '#eab308' },  // accuracy < 20m
    poor:      { bars: 1, color: '#f97316' },  // accuracy < 50m
    none:      { bars: 0, color: '#ef4444' },  // accuracy >= 50m
}
```

---

## 4. 핵심 기능

### 4.1 소셜 로그인 인증

#### 4.1.1 지원 로그인 방식
| 제공자 | 플랫폼 | 설명 |
|--------|--------|------|
| Google | iOS, Android | Google OAuth 2.0 |
| Apple | iOS | Sign in with Apple |

#### 4.1.2 인증 흐름
1. 비로그인 상태에서 프로필(/user) 페이지 접근 시 로그인 화면 표시
2. 소셜 로그인 버튼 클릭 시 better-auth를 통해 OAuth 흐름 시작
3. 인증 성공 시 사용자 정보를 Zustand store에 저장
4. 세션은 expo-secure-store에 안전하게 저장

#### 4.1.3 서버 연동
- 백엔드: Hono + better-auth
- API 엔드포인트: `EXPO_PUBLIC_API_URL/api/auth/*`
- 세션 관리: better-auth 기본 세션

#### 4.1.4 권한
- iOS: `NSUserTrackingUsageDescription` (IDFA 추적 선택사항)

### 4.2 자동 상태 감지 시스템

#### 4.2.1 활강 (Skiing) 상태
- **감지 조건:** 고도가 일정 수준 이상 낮아지고 속도가 빠를 때
- **동작:** 활주 거리와 속도 기록, 칼로리 소모 계산

#### 4.2.2 리프트 (Lifting) 상태
- **감지 조건:** 고도가 높아지고 일정 속도로 이동 중
- **동작:** 활주 기록 일시 중단, 리프트 탑승으로 간주

#### 4.2.3 정지 (Resting) 상태
- **감지 조건:** 속도와 고도 변화가 거의 없을 때
- **동작:** 대기 시간으로 기록
- **알림:** 30분 이상 정지 시 "트래킹을 종료하시겠습니까?" 알림

#### 4.2.4 활주 횟수 카운트
- 활강 → 리프트/정지 상태 전환 시 유효한 활강 판단
- 유효 활강: 최소 거리(100m) 이상 + 최소 고도 변화(20m) 이상

### 4.3 데이터 보호 및 복구 (Crash Recovery)

#### 4.3.1 실시간 저장
- 위치 정보 수신 시 SQLite에 즉시 기록
- 저장 주기: 1초 간격
- 서버 동기화: 1분 간격

#### 4.3.2 자동 복구
- 앱 재시작 시 미완료 기록 감지
- 복구 팝업: "이전 기록을 이어서 진행하시겠습니까?"
- 옵션: 이어서 기록 / 새로 시작 / 삭제

### 4.4 갤러리 사진 자동 매핑

#### 4.4.1 동작 방식
1. 트래킹 종료 시 해당 시간대 갤러리 사진 검색
2. 사진 메타데이터에서 촬영 시간/위치 추출
3. 경로와 매칭하여 지도 위에 썸네일 핀 표시

#### 4.4.2 권한
- `NSPhotoLibraryUsageDescription`: 갤러리 접근 권한

### 4.5 백그라운드 위치 추적

#### 4.5.1 구현 방식
- `expo-task-manager` + `expo-location` 연동
- 태스크명: `background-location-task`

#### 4.5.2 설정
```typescript
{
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,        // 1초
    distanceInterval: 1,       // 1m
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
}
```

#### 4.5.3 Android Foreground Service
```typescript
foregroundService: {
    notificationTitle: 'Snowby',
    notificationBody: 'Tracking your ski/snowboard activity',
    notificationColor: '#3b82f6',
}
```

#### 4.5.4 권한
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `UIBackgroundModes: ['location', 'fetch']`

### 4.6 배터리 효율화

#### 4.6.1 장시간 정지 감지
- 30분 이상 움직임 없을 시 알림 발송
- "트래킹을 종료하시겠습니까?"

#### 4.6.2 화면 유지 옵션
- `expo-keep-awake` 사용
- 사용자 설정에 따라 활성화/비활성화

---

## 5. UI/UX 설계

### 5.1 메인 화면 (트래킹)

#### 5.1.1 레이아웃
```
┌─────────────────────────────┐
│  GPS ■■■■  37.4979, 127.0276│  <- TrackingStats
├─────────────────────────────┤
│  거리    수직이동    런         │
│  0.0km   0m         0       │
│  최고속도    시간               │
│  0.0km/h    0m              │
├─────────────────────────────┤
│                             │
│         [지도 영역]           │  <- MapView + AccuracyCircle
│                             │
├─────────────────────────────┤
│  📜      🚩/⏸️/▶️  🔳      🔍  │  <- TrackingControls
└─────────────────────────────┘
```

#### 5.1.2 컴포넌트 구조
```
app/index.tsx
├── TrackingStats (GPS 상태, 좌표, 통계)
├── MapView
│   ├── Camera
│   ├── ShapeSource + LineLayer (경로)
│   └── AccuracyCircle (현재 위치 + 정확도 원)
└── TrackingControls (제어 버튼)
```

### 5.2 컨트롤 버튼 상태

| 상태 | 버튼 구성 |
|------|----------|
| `stop` | 📜 History, 🚩 Start, 🔍 Search |
| `start` | 📜 History, ⏸️ Pause, 🔳 Stop, 🔍 Search |
| `pause` | 📜 History, ▶️ Resume, 🔳 Stop, 🔍 Search |

### 5.3 지도 시각화

#### 5.3.1 경로 표시
```typescript
lineColor: 'rgba(59, 130, 246, 0.5)'  // 파란색 반투명
lineWidth: 4
lineCap: 'round'
lineJoin: 'round'
```

#### 5.3.2 현재 위치 표시 (AccuracyCircle)
- **외부 원:** accuracy 반경, GPS 레벨 색상, 20% 투명도
- **중심 점:** 8px, GPS 레벨 색상, 흰색 테두리

---

## 6. 폴더 구조

```
snowby/
├── app/                          # 페이지 라우트
│   ├── index.tsx                 # 메인 (트래킹)
│   ├── history/index.tsx         # 기록
│   ├── rank/index.tsx            # 랭킹
│   ├── user/index.tsx            # 프로필
│   └── setting/index.tsx         # 설정
├── components/
│   ├── ui/                       # 기본 UI 컴포넌트
│   │   ├── button.tsx
│   │   ├── text.tsx
│   │   ├── icon.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   └── ...
│   ├── common/                   # 공통 컴포넌트
│   │   ├── navigator.tsx
│   │   └── theme-toggle.tsx
│   ├── tracking/                 # 트래킹 관련
│   │   ├── tracking-stats.tsx
│   │   ├── tracking-controls.tsx
│   │   ├── tracking-stat-item.tsx
│   │   ├── gps-signal.tsx
│   │   └── accuracy-circle.tsx
│   ├── history/                  # 기록 관련
│   │   ├── history-card.tsx
│   │   └── history-card-item.tsx
│   ├── user/                     # 유저 관련
│   │   ├── user-summary-card.tsx
│   │   ├── profile-edit-modal.tsx
│   │   └── login-screen.tsx
│   └── setting/                  # 설정 관련
│       ├── setting-section.tsx
│       ├── setting-row.tsx
│       └── setting-toggle-group.tsx
├── lib/
│   ├── store.ts                  # Zustand 전역 상태
│   ├── constant.ts               # 상수 정의
│   ├── units.ts                  # 단위 변환 유틸
│   ├── utils.ts                  # 기타 유틸
│   ├── i18n.ts                   # 다국어 설정
│   ├── hooks/
│   │   └── use-location-tracking.ts  # 위치 추적 훅
│   ├── services/
│   │   ├── auth.ts                   # 인증 서비스
│   │   └── background-location.ts    # 백그라운드 위치
│   └── langs/
│       ├── en.ts
│       ├── ko.ts
│       └── jp.ts
└── spec/
    └── prd.md                    # 본 문서
```

---

## 7. 코드 컨벤션

### 7.1 파일/폴더 네이밍
- 폴더: `kebab-case`
- 파일: `kebab-case.tsx`
- 컴포넌트: `PascalCase`

### 7.2 컴포넌트 스타일
```typescript
// Named export 사용
export const ComponentName: FC<Props> = ({ prop1, prop2 }) => {
    return (...)
}

// 페이지는 default export
const PageName = () => {
    return (...)
}
export default PageName
```

### 7.3 타입 정의
```typescript
// interface로 Props 정의
interface ComponentProps {
    prop1: string
    prop2: number
}

// FC 타입 사용
export const Component: FC<ComponentProps> = ({ prop1, prop2 }) => {}
```

### 7.4 상수 네이밍
```typescript
// UPPER_SNAKE_CASE
export const GPS_SIGNAL_LEVELS = { ... }
export const TRACKING_STATS_SETTINGS = { ... }
```

### 7.5 금지 사항
- `any`, `unknown` 타입 사용 금지
- 코드 내 주석 금지
- 반환 타입 명시 금지 (추론에 맡김)

---

## 8. 다국어 지원

### 8.1 지원 언어
- English (en)
- 한국어 (ko)
- 日本語 (jp)

### 8.2 번역 키 구조
```typescript
{
    tracking: {
        totalDistance: '거리',
        maxVertical: '수직 이동',
        totalRuns: '런',
        maxSpeed: '최고 속도',
        totalTime: '시간',
    }
}
```

---

## 9. 앱 설정 (app.config.ts)

### 9.1 iOS 권한
```typescript
ios: {
    infoPlist: {
        NSLocationWhenInUseUsageDescription: '...',
        NSLocationAlwaysAndWhenInUseUsageDescription: '...',
        NSPhotoLibraryUsageDescription: '...',
        UIBackgroundModes: ['location', 'fetch'],
    }
}
```

### 9.2 플러그인
```typescript
plugins: [
    'expo-router',
    'expo-localization',
    '@maplibre/maplibre-react-native',
    ['expo-location', { isBackgroundLocationEnabled: true }],
    ['expo-media-library', { isAccessMediaLocationEnabled: true }],
    'expo-notifications',
    'expo-sqlite',
    'expo-task-manager',
]
```

---

## 10. 향후 구현 예정

### 10.1 SQLite 스키마
- `sessions`: 트래킹 세션 정보
- `locations`: 위치 데이터 (실시간 저장)
- `runs`: 개별 활주 기록
- `photos`: 매핑된 사진 정보

### 10.2 자동 상태 감지 알고리즘
- 고도/속도 변화 기반 상태 전환 로직
- 활주 유효성 판단 로직

### 10.3 서버 동기화
- 1분 간격 서버 전송
- 오프라인 데이터 큐잉

### 10.4 랭킹 시스템
- 스키장별 랭킹
- 속도/거리/횟수 기준

---

## 11. 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2024-12-07 | 1.0.0 | 초기 문서 작성 |
| 2025-12-07 | 1.1.0 | 소셜 로그인 인증 추가 (Google, Apple) |
