# 프론트 트래킹 감사 및 수정 (2026-07-18)

프로젝트 점검에서 발견한 트래킹 파이프라인 결함. 대상: lib/tracking/·lib/hooks/·app/(tabs)/·entities/.

## 수정 완료 (검증: typecheck + bun:test)

| 위치 | 증상 | 수정 |
|------|------|------|
| location-processor `reset`, tracking.store `startTracking`, queries `createSession` | totalRuns off-by-one (시작 시 1) | 0 에서 시작, run 완료 시에만 증가 |
| location-processor + tracking.store `pauseTracking` | pause 중 timeOnSlope 계속 증가 | `pauseSkiing()` 로 skiing 구간 flush 후 skiingStartTime=null |
| location-processor `calculateDistance` | 인라인 haversine (테스트 불가) | `lib/tracking/geo.ts` `calculateDistanceMeters` 로 분리 + 단위 테스트 |
| entities/activities `useFeed` | queryKey 에 page/limit 없어 페이지네이션 캐시 충돌 | key 에 page/limit 포함, `feedAll()` prefix 추가 |
| entities/social follow/unfollow | isFollowing·팔로워/팔로잉 무효화 누락 | onSuccess(_, userId) 로 isFollowing + `['social']` prefix 무효화 |
| entities/users updateProfile | profile/summary 무효화 누락 | `['user','profile']`·`['user','summary']` 무효화 추가 |
| lib/hooks/use-location-tracking.ts | 미참조 dead code | 삭제 |
| tracking.config `BACKGROUND_TASK_NAME` | 실제 태스크명과 다른 미사용 상수 | 삭제 |

## 남은 대수술 (서버 프로토콜 결정 + 실기기 GPS 검증 필요 — 미착수)

아래는 상호의존적이고, 검증이 실기기에서만 가능하며, 일부는 서버 동기화 프로토콜 변경을 동반한다. 임의로 밀어붙이면 트래킹이 마비될 수 있어 별도 집중 작업으로 진행한다.

### 상태 머신 / 크래시 복구
1. **resume 후 GPS 파이프라인 미재기동** — `handleRecoveryOption('resume')` 이 store 상태만 복원하고 `startBackgroundLocationTracking`+`setLocationCallback`+watch 구독을 재수립하지 않음. 훅 레벨(use-tracking)에서 복구 흐름을 처리해야 함.
2. **익명 크래시 복구 불능** — `use-crash-recovery` 가 userId 로 게이트(`if (!userId) return`)하나 세션은 'anonymous' 로 저장. `effectiveUserId = userId ?? 'anonymous'` 로 일치.
3. **initialize 레이스** — userId 변경 시 `checkUnfinishedSession` 재실행 필요.

### 동기화 (서버 프로토콜 변경 동반)
4. **라이브 sync 시 서버 세션 미생성** — 클라가 `/api/tracking/sync` 에 로컬 세션 id 를 보내지만 서버 syncData 는 세션이 없으면 throw. → 서버 syncData 를 "세션 없으면 생성(upsert)" 로 바꾸고 로컬 id=서버 id 로 통일하는 게 근본. `stopTracking` 시 서버 `/complete` 호출 추가.
5. **mergeServerData 에코** — 서버 유래 위치(clientId=null)를 is_synced=0 으로 저장해 다음 배치에서 재업로드. 서버 유래는 is_synced=1 로 저장.
6. **syncCompletedSession 중복 세션** — complete 실패 시 재시도마다 새 서버 세션 생성. 로컬에 serverSessionId(=로컬 id로 통일 시 불필요) 저장해 멱등화.
7. **라이브 세션 markSessionSynced 미호출** — 정상 완료 후에도 is_synced=0 유지 → 이후 마이그레이션 스캔이 중복 업로드. 완료 시 markSessionSynced, 로그인 시 스캔을 migratedCount 와 무관하게.
8. **오프라인 stop 유실 / finalSync 3회·300포인트 한계** — 미전송 0 될 때까지 배치 반복.
9. **익명 finalSync 인증실패 3회 / resume 시 익명 syncManager.start** — syncManager 미시작 시 finalSync skip, 익명이면 start 안 함.

### 계산 / null (use-tracking)
10. **altitude ?? 0** → maxVertical 폭증. null 이면 고도 계산 제외.
11. **accuracy ?? 0** → 저품질 포인트가 필터 통과. null 이면 skip/Infinity.
12. **Date.now() 대신 GPS timestamp** 사용.
13. **배치 병렬 처리 레이스** — `locations.forEach(processLocationUpdate)` → `for...of await` 직렬.
14. **포그라운드 이중 소스** — watchPositionAsync + background task 동시 등록으로 위치 2배. 단일 소스로 일원화.
15. use-tracking 의 useCallback 다수 — React Compiler 위임(위 재작성과 함께 제거).

### UI / 성능
16. **tracking-stats pause 시간 미차감** — 재개 시 타이머 점프. pausedDuration 누적·차감.
17. **index.tsx 폴리라인 매 fix 전체 재구성 + 매 fix 카메라 강제 이동** — 증분/다운샘플, 사용자 조작 중 카메라 리셋 방지. 인라인 쿼리 키(`['activities']`,`['ranking']`)도 key 팩토리로.
18. **매 fix sessions UPDATE** — 5~10초 스로틀.

### SUSPECTED
- 정지 GPS 지터 거리 누적(최소 이동 게이트 부재), 복구 후 activityDetector 상태 불일치.
