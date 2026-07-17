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

### 트래킹 대수술 완료 (코드 수정 + typecheck/test 통과 — 실기기 GPS 검증은 사용자 몫)
- [x] 크래시 복구 resume 후 GPS 재기동 (use-tracking useEffect 로 trackingStatus=start && !isBackgroundActive 감지)
- [x] 익명 크래시 복구 게이트 (use-crash-recovery userId→effectiveUserId), initialize userId 변경 재검사 (refreshUnfinishedSession)
- [x] 동기화 프로토콜: 로컬 id=서버 id 통일, 서버 syncData 세션 upsert(sessionStart), stopTracking 서버 complete + markSessionSynced
- [x] mergeServerData 에코 방지(is_synced=1), finalSync 미전송 소진까지 반복, 익명 finalSync/start skip(isStarted)
- [x] use-tracking: altitude null 고도계산 제외, accuracy null→Infinity, GPS timestamp 사용, 배치 for-of 직렬, GPS 단일소스(watch 제거·background task), useCallback 전량 제거, console.log 제거
- [x] index.tsx: 카메라 최초 1회만, 폴리라인 다운샘플(500), 인라인 쿼리키→팩토리, useCallback 제거
- [x] tracking-stats: pause 시간 누적/차감 (accumulated + active 구간)

### 검증 남음 (실기기)
- 실제 GPS 트래킹 동작·백그라운드·크래시 복구·로그인 동기화는 `bun run ios/android` 로 실기기 확인 필요.
- 백엔드 마이그레이션(0005) 적용 전 기존 중복 데이터 정리.

## SUSPECTED (미조치 — docs/bug 기재)
정지 GPS 지터 거리 누적, feed 팔로우 동작, 복구 후 activityDetector 상태 불일치 등.
