# PROCESS

## 기준 문서
- 글로벌 컨벤션: `~/.claude/convention/*.md` (common · frontend · fsd · query · ai-process)
- 연동 프로젝트: `../snowby-backend` — **두 프로젝트는 항상 같이 업데이트한다** (사용자 지시, 2026-07-17)
- 프로젝트 구조: `docs/memory/project-structure.md`
- 트래킹 감사: `docs/bug/2026-07-18-tracking-audit.md`

## 작업: 점검 기반 버그수정 (2026-07-18)

### 완료 (검증: typecheck + bun:test 통과)
- [x] 의존성 최신화 (Expo SDK 54→57) + 커밋/푸시 (2026-07-17)
- [x] useCallback/useMemo 정리 9파일 (React Compiler 위임)
- [x] 쿼리 버그 3건 (feed 페이지네이션 캐시 키, social 무효화, updateProfile 무효화)
- [x] location-processor: totalRuns off-by-one, pause 시간 flush, haversine 분리(geo.ts + 테스트)
- [x] dead code 삭제(use-location-tracking.ts), 미사용 상수 삭제(BACKGROUND_TASK_NAME)
- [x] test 스크립트 추가, tsconfig 에서 테스트 파일 제외

### 남은 트래킹 대수술 (서버 프로토콜 결정 + 실기기 GPS 검증 필요)
`docs/bug/2026-07-18-tracking-audit.md` 의 "남은 대수술" 18항목. 상호의존적이라 별도 집중 작업.
- [ ] 크래시 복구 resume GPS 재기동, 익명 복구 게이트, initialize 레이스
- [ ] 동기화 프로토콜 재설계 (라이브 sync 서버 세션 upsert — 백엔드 동반) + mergeServerData 에코 + 멱등성 + finalSync 반복
- [ ] use-tracking null/timestamp/배치직렬화/GPS 단일소스 + useCallback 제거
- [ ] index.tsx 성능(폴리라인/카메라/인라인 키), tracking-stats pause 시간

## 커밋 대기
- 이번 버그수정분(프론트/백엔드) 미커밋 — 사용자 커밋 지시 대기
