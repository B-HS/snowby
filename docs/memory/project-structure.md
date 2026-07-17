# Snowby 프로젝트 구조 (2026-07-17 기준)

Expo SDK 57 / React Native 0.86 / React 19.2 기반 스키·스노보드 트래킹 앱.
Metro 번들러, bun 패키지매니저, NativeWind(Tailwind v3) 스타일, `@rn-primitives/*` + shadcn 스타일 UI.
백엔드는 `../snowby-backend` (Bun + Hono) — 항상 같이 업데이트한다.

## 디렉토리

| 폴더 | 역할 |
|------|------|
| `app/` | expo-router 파일 기반 라우팅 (FSD 의 pages 에 해당) |
| `components/` | 도메인별 하위폴더(history/map/rank/setting/tracking/user) + 공용 ui/, common/ |
| `entities/` | 도메인별 서버 통신 계층 — `*.api.ts`(fetch) + `*.query.ts`(TanStack Query 훅) 쌍, 공용 `api-client.ts` |
| `lib/` | 공유 코어 — store, i18n, 테마, `database/`(SQLite), `tracking/`(트래킹 엔진), hooks/, services/, testing/ |
| `scripts/` | `extract-ski-resorts.ts` (스키장 데이터 추출, Bun 실행) |

Path alias: `@/*` → 루트.

## 라우팅

- `app/_layout.tsx` — 루트 Stack. QueryClientProvider + ThemeProvider + PortalHost. 스플래시, 세션→store 동기화, 로그인 시 익명 세션 마이그레이션(`migrateAndSyncOnLogin`).
- `app/(tabs)/_layout.tsx` — 탭 6개. 로그인 여부에 따라 `href` 토글 (local-histories 는 비로그인 전용, history 는 로그인 전용).
- 탭: `index`(홈·지도 트래킹) · `local-histories`(SQLite 세션 목록) · `history`(서버 피드·팔로우) · `rank`(리조트별 랭킹) · `user`(프로필) · `setting`(언어·테마·단위)
- 스택: `alarm/`(알림 목록), `test/`(트래킹 시뮬레이터 — 개발용)
- `typedRoutes` + `reactCompiler` experiments 활성.

## 상태 관리

- `lib/store.ts` `useAppStore` — zustand + persist(AsyncStorage). user·인증·locale·theme·단위·팔로잉/숨김·리조트 데이터.
- `lib/tracking/tracking.store.ts` `useTrackingStore` — persist 없음. 트래킹 상태 머신(start/pause/resume/stop), SQLite 연동, 크래시 복구, 익명→로그인 마이그레이션.
- TanStack Query — `lib/query-client.ts` (staleTime 30s, gcTime 30m, retry 1). 도메인별 key 팩토리(`activityKeys`, `rankingKeys` 등)를 각 `*.query.ts` 에 co-locate.

## 백엔드 연동

- `entities/api-client.ts` `apiClient<T>` — better-auth 쿠키 헤더 + `credentials: 'include'`.
- Base URL: `process.env.EXPO_PUBLIC_BACKEND_URL` (기본 `http://localhost:3000`).
- 인증: `lib/services/auth.ts` — better-auth `createAuthClient` + `expoClient` 플러그인 (expo-secure-store, scheme `snowby`), Google/Apple 소셜 로그인.

## 로컬 데이터 · 위치 트래킹

- expo-sqlite (`lib/database/`) — `sessions`/`locations`/`runs`/`photos` 테이블, `is_synced` 플래그로 서버 동기화 추적, `MIGRATIONS` 배열.
- expo-location + expo-task-manager — `lib/services/background-location.ts` 백그라운드 태스크, `lib/tracking/` 엔진(location-processor 노이즈 필터 · activity-detector skiing/lifting/resting 판정 · sync-manager 배치 동기화 · tracking.config 임계값 상수).
- iOS `UIBackgroundModes: ['location', 'fetch']`.

## i18n

`lib/i18n.ts` — i18n-js + expo-localization. 지원 언어 en/ko/jp (`lib/langs/`, 3개 파일 키 동일 유지 필요).

## 알려진 구조 이슈 (2026-07-17)

1. 부분적 FSD — features/widgets/shared 레이어 없음. 공유 코드는 `lib/`, UI 는 `components/` 로 대체.
2. `lib/store.ts` 에 레거시 트래킹 필드(`trackingStatus`/`trackingData`) 잔존 — 실제 트래킹은 `tracking.store.ts` 담당.
3. `lib/hooks/use-location-tracking.ts` 는 어디서도 import 되지 않는 dead code.
4. GPS 상수 이중 정의 — `lib/constant.ts` `GPS_SIGNAL_LEVELS` vs `lib/tracking/tracking.config.ts` `GPS_SIGNAL_CONFIG`.
5. `app/(tabs)/index.tsx` 에 인라인 쿼리 키(`['activities']`, `['ranking']`) — key 팩토리 미사용 (query.md 위반).
6. `app/test/` + `lib/testing/` 가 프로덕션 라우트에 포함.
7. useCallback/useMemo 가 11개 파일에 잔존 (React Compiler 활성화됨 — 정리 대상).
8. 앱 아이콘·스플래시 이미지 미설정(주석 처리), expo-notifications 플러그인 비활성(개인 계정 Push 불가).
