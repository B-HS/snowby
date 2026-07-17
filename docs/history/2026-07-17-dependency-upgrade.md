# 2026-07-17 의존성 전체 최신화 (Expo SDK 54 → 57)

## 변경

- `bun update --latest` + `bunx expo install --fix`: expo 54→57(통합 버저닝으로 expo-* 전부 57.x), react-native 0.81.5→0.86.0, react 19.1.0→19.2.3, reanimated 4.5.0, @tanstack/react-query 5.101.2, zustand 5.0.14, better-auth 1.6.23, nativewind 4.2.6 등
- tailwindcss 는 3.4.18 유지, typescript 는 ~6.0.3 — 사유는 `docs/acknowledge/2026-07-17-dependency-upgrade-decisions.md`
- `@types/node` devDep 추가 + tsconfig `types: ["node"]`, `baseUrl` 제거
- app.config.ts: `edgeToEdgeEnabled`·`newArchEnabled` 제거, `splash` → expo-splash-screen 플러그인 이동, `experiments.reactCompiler: true` 활성화
- SDK 57 타입 대응: FlatList `getItemLayout` `ArrayLike` 시그니처(searchable-select), `Appearance.getColorScheme()` 'unspecified' 분기(setting), `declare module '*.css'`(nativewind-env.d.ts)
- 수정 파일 2곳(searchable-select, setting)의 useCallback/useMemo 제거 (React Compiler 위임)
- `typecheck` 스크립트 추가

## 검증

- `bun run typecheck` 통과, `bunx expo install --check` "Dependencies are up to date", `bunx expo config` 정상 로드, 변경 파일 prettier 통과
- 실기기/시뮬레이터 실행 검증은 미수행 — SDK 3단계 메이저 업그레이드이므로 `bun run ios` 또는 `bun run android` 로 실행 확인 필요

## 남은 일 (별도 작업)

- useCallback/useMemo 잔존 11개 파일 정리
- `docs/memory/project-structure.md` 의 "알려진 구조 이슈" 항목들 (dead code, GPS 상수 중복, 인라인 쿼리 키 등)
