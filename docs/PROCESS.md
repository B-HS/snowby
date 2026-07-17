# PROCESS

## 기준 문서
- 글로벌 컨벤션: `~/.claude/convention/*.md` (common · frontend · fsd · query · ai-process)
- 연동 프로젝트: `../snowby-backend` — **두 프로젝트는 항상 같이 업데이트한다** (사용자 지시, 2026-07-17)
- 프로젝트 구조: `docs/memory/project-structure.md`

## 작업: 의존성 최신화 + 프로젝트 파악 + docs 작성 (2026-07-17) — 완료

- [x] a. snowby 의존성 전체 최신화 — Expo SDK 54 → 57 (`docs/history/2026-07-17-dependency-upgrade.md`)
- [x] b. snowby-backend 의존성 전체 최신화
- [x] c. 두 프로젝트 typecheck 통과 (`bun run typecheck`)
- [x] d. snowby 프로젝트 구조 파악 및 docs 작성 (`docs/memory/project-structure.md` · `docs/acknowledge/2026-07-17-dependency-upgrade-decisions.md`)
- [x] e. snowby-backend 프로젝트 구조 파악 및 docs 작성 (backend `docs/memory/project-structure.md`)

## 미착수 후보 (사용자 결정 필요)

- [ ] 실기기/시뮬레이터 실행 검증 (`bun run ios`/`android`) — SDK 3단계 메이저 업그레이드 후 미수행
- [ ] useCallback/useMemo 잔존 11개 파일 정리 (React Compiler 활성화됨)
- [ ] 프론트 구조 이슈 정리 — dead code(`use-location-tracking.ts`), 레거시 트래킹 필드, GPS 상수 중복, 인라인 쿼리 키
- [ ] 백엔드 컨벤션 리팩토링 — compose/ServiceDb/Zod DTO/에러 중앙화/응답 헬퍼/getEnv (범위 합의 필요)
