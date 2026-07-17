# 의존성 최신화 결정 사항 (2026-07-17)

## 결정

1. **tailwindcss 3.4.x 유지** — nativewind 4.2.6(최신 안정)이 Tailwind v3 만 지원 (`nativewind/dist/metro/tailwind/index.js` 에서 v4 면 명시적 throw). nativewind 5 는 preview 단계라 도입하지 않음. nativewind 5 정식 릴리스 시 tailwind v4 동반 업그레이드.
2. **typescript 버전 이원화** — snowby 는 `~6.0.3` (Expo SDK 57 의 `expo install --fix` 지정 버전, TS 7 은 Expo config 로더 `@expo/require-utils` 와 비호환). snowby-backend 는 `^7.0.2` (최신, 문제 없음).
3. **React Compiler 활성화** — `app.config.ts` `experiments.reactCompiler: true`. SDK 54+ 는 babel 자동 구성이라 추가 플러그인 불필요. 컨벤션 frontend §4 (useCallback/useMemo 금지)의 전제.
4. **tsconfig `baseUrl` 제거** — TS 6 에서 deprecated, TS 7 에서 삭제. paths 를 `./` 상대 형태로 변경.
5. **`@types/node` 명시적 devDep + `types: ["node"]`** — TS 6 에서 hoisted @types 자동 포함이 동작하지 않아 `scripts/` 의 node API 타입이 깨졌음. 명시적으로 고정.
6. **두 프로젝트 동시 업데이트 원칙** — snowby 와 ../snowby-backend 는 모든 작업에서 한 세트로 취급 (사용자 지시).

## SDK 57 breaking 대응 기록

- `android.edgeToEdgeEnabled`, `newArchEnabled` 삭제 — SDK 57 부터 상시 기본값이라 키 자체가 제거됨.
- top-level `splash` → `expo-splash-screen` 플러그인 설정으로 이동.
- FlatList `getItemLayout` 첫 인자 타입이 `ArrayLike<T> | null | undefined` 로 변경.
- `Appearance.getColorScheme()` 반환에 `'unspecified'` 추가 — `'dark'` 비교 후 나머지는 `'light'` 처리.
- side-effect CSS import 에 TS2882 발생 — `nativewind-env.d.ts` 에 `declare module '*.css'` 추가.
