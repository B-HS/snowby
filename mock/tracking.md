# Snowby 메인 트래킹 기능 상세 기획서

## 1. 개요

스키/스노보드 활동을 실시간으로 추적하고 기록하는 핵심 기능입니다.

### 1.1 핵심 요구사항
- GPS 기반 실시간 위치 추적
- 자동 상태 감지 (활강/리프트/정지)
- 백그라운드 추적 지원
- 로컬 SQLite 저장 (크래시 복구)
- 서버 동기화
- 갤러리 사진 자동 매핑

---

## 2. 데이터 모델

### 2.1 TrackingStatus (사용자 제어 상태)
```typescript
type TrackingStatus = 'start' | 'pause' | 'stop'
```

| 상태 | 설명 | UI |
|------|------|-----|
| `stop` | 트래킹 대기 | 🚩 Start 버튼 |
| `start` | 트래킹 진행 중 | ⏸️ Pause + 🔳 Stop |
| `pause` | 일시정지 | ▶️ Resume + 🔳 Stop |

### 2.2 ActivityState (자동 감지 상태)
```typescript
type ActivityState = 'skiing' | 'lifting' | 'resting'
```

| 상태 | 감지 조건 | 동작 |
|------|----------|------|
| `skiing` | 고도 하강 > 5m + 속도 > 5km/h | 활주 거리/속도 기록 |
| `lifting` | 고도 상승 > 5m + 속도 2~15km/h | 활주 기록 중단 |
| `resting` | 속도 < 1km/h + 고도 변화 < 2m | 대기 시간 기록 |

### 2.3 TrackingData (실시간 데이터)
```typescript
type TrackingData = {
    sessionId: string              // 세션 고유 ID
    startTime: number              // 시작 타임스탬프
    startLatitude: number          // 시작 위도
    startLongitude: number         // 시작 경도
    currentLatitude: number        // 현재 위도
    currentLongitude: number       // 현재 경도
    currentAltitude: number        // 현재 고도 (m)
    currentSpeed: number           // 현재 속도 (km/h)
    totalDistance: number          // 총 이동 거리 (m)
    maxVertical: number            // 최대 수직 하강 (m)
    totalRuns: number              // 총 활주 횟수
    maxSpeed: number               // 최고 속도 (km/h)
    timeOnSlope: number            // 슬로프 시간 (초)
    activityState: ActivityState   // 현재 자동 감지 상태
    locations: LocationPoint[]     // 경로 배열
}

type LocationPoint = {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    timestamp: number
    accuracy: number
}
```

### 2.4 RunData (개별 활주 기록)
```typescript
type RunData = {
    id: string
    sessionId: string
    startTime: number
    endTime: number
    startAltitude: number
    endAltitude: number
    distance: number              // 활주 거리 (m)
    verticalDrop: number          // 고도 하강 (m)
    maxSpeed: number              // 최고 속도 (km/h)
    avgSpeed: number              // 평균 속도 (km/h)
    duration: number              // 소요 시간 (초)
}
```

### 2.5 GPS Signal Level
```typescript
type GPSSignalLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'none'

const GPS_SIGNAL_CONFIG = {
    excellent: { maxAccuracy: 5,   bars: 4, color: '#22c55e' },
    good:      { maxAccuracy: 10,  bars: 3, color: '#84cc16' },
    fair:      { maxAccuracy: 20,  bars: 2, color: '#eab308' },
    poor:      { maxAccuracy: 50,  bars: 1, color: '#f97316' },
    none:      { maxAccuracy: Infinity, bars: 0, color: '#ef4444' },
}
```

---

## 3. SQLite 스키마

### 3.1 sessions 테이블
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    start_latitude REAL NOT NULL,
    start_longitude REAL NOT NULL,
    total_distance REAL DEFAULT 0,
    max_vertical REAL DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    max_speed REAL DEFAULT 0,
    time_on_slope INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    is_synced INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### 3.2 locations 테이블
```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    altitude REAL NOT NULL,
    speed REAL NOT NULL,
    accuracy REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    activity_state TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_locations_session ON locations(session_id);
CREATE INDEX idx_locations_timestamp ON locations(timestamp);
```

### 3.3 runs 테이블
```sql
CREATE TABLE runs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    start_altitude REAL NOT NULL,
    end_altitude REAL NOT NULL,
    distance REAL NOT NULL,
    vertical_drop REAL NOT NULL,
    max_speed REAL NOT NULL,
    avg_speed REAL NOT NULL,
    duration INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_runs_session ON runs(session_id);
```

### 3.4 photos 테이블
```sql
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    uri TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    taken_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

## 4. 자동 상태 감지 알고리즘

### 4.1 상태 전환 로직

```typescript
const DETECTION_CONFIG = {
    skiing: {
        minSpeed: 5,           // km/h
        minAltitudeDrop: 5,    // m (최근 10초간)
    },
    lifting: {
        minSpeed: 2,           // km/h
        maxSpeed: 15,          // km/h
        minAltitudeGain: 5,    // m (최근 10초간)
    },
    resting: {
        maxSpeed: 1,           // km/h
        maxAltitudeChange: 2,  // m (최근 10초간)
    },
}
```

### 4.2 상태 전환 다이어그램

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌─────────┐    altitude↓ + speed>5    ┌─────────┐        │
│ RESTING │ ─────────────────────────▶│ SKIING  │────────┤
└─────────┘                           └─────────┘        │
     ▲                                     │             │
     │                                     │             │
     │ speed<1                   altitude↑ + speed<15    │
     │                                     │             │
     │                                     ▼             │
     │                               ┌─────────┐         │
     └───────────────────────────────│ LIFTING │─────────┘
               speed<1               └─────────┘
```

### 4.3 활주 횟수 카운트 조건

활강 → (리프트 또는 정지) 전환 시 유효한 활주로 카운트:
- 최소 거리: 100m 이상
- 최소 고도 하강: 20m 이상
- 최소 시간: 10초 이상

```typescript
const VALID_RUN_CONFIG = {
    minDistance: 100,      // m
    minVerticalDrop: 20,   // m
    minDuration: 10,       // 초
}
```

### 4.4 노이즈 필터링

```typescript
const NOISE_FILTER_CONFIG = {
    minAccuracy: 50,           // accuracy > 50m 데이터 무시
    speedSmoothingWindow: 3,   // 최근 3개 데이터 평균
    altitudeSmoothingWindow: 5, // 최근 5개 데이터 평균
    stateChangeDelay: 3,       // 상태 전환 전 3초 유지 필요
}
```

---

## 5. 위치 추적 구현

### 5.1 위치 추적 설정

```typescript
const LOCATION_CONFIG = {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,           // 1초
    distanceInterval: 1,          // 1m
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
}
```

### 5.2 백그라운드 태스크

```typescript
const BACKGROUND_TASK_NAME = 'snowby-location-tracking'

TaskManager.defineTask(BACKGROUND_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Background location error:', error)
        return
    }

    const { locations } = data as { locations: Location.LocationObject[] }

    for (const location of locations) {
        await processLocation(location)
    }
})
```

### 5.3 Android Foreground Service

```typescript
const FOREGROUND_SERVICE_CONFIG = {
    notificationTitle: 'Snowby',
    notificationBody: '스키/스노보드 활동을 추적 중입니다',
    notificationColor: '#3b82f6',
}
```

---

## 6. 데이터 저장 전략

### 6.1 실시간 저장 (SQLite)

위치 데이터 수신 즉시 로컬 SQLite에 저장:

```typescript
const saveLocation = async (location: LocationPoint) => {
    await db.runAsync(
        `INSERT INTO locations
         (session_id, latitude, longitude, altitude, speed, accuracy, timestamp, activity_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, location.latitude, location.longitude,
         location.altitude, location.speed, location.accuracy,
         location.timestamp, currentActivityState]
    )
}
```

### 6.2 세션 통계 업데이트

5초마다 또는 상태 변경 시 세션 통계 업데이트:

```typescript
const updateSessionStats = async (stats: SessionStats) => {
    await db.runAsync(
        `UPDATE sessions SET
         total_distance = ?, max_vertical = ?, total_runs = ?,
         max_speed = ?, time_on_slope = ?
         WHERE id = ?`,
        [stats.totalDistance, stats.maxVertical, stats.totalRuns,
         stats.maxSpeed, stats.timeOnSlope, sessionId]
    )
}
```

### 6.3 서버 동기화 (1분 간격)

```typescript
const SYNC_INTERVAL = 60000 // 1분

const syncToServer = async () => {
    const unsyncedLocations = await db.getAllAsync(
        `SELECT * FROM locations
         WHERE session_id = ? AND id > ?
         ORDER BY timestamp ASC
         LIMIT 100`,
        [sessionId, lastSyncedLocationId]
    )

    if (unsyncedLocations.length > 0) {
        await api.post('/api/tracking/sync', {
            sessionId,
            locations: unsyncedLocations,
        })

        lastSyncedLocationId = unsyncedLocations[unsyncedLocations.length - 1].id
    }
}
```

---

## 7. 크래시 복구

### 7.1 복구 가능 조건 감지

앱 시작 시 미완료 세션 확인:

```typescript
const checkUnfinishedSession = async () => {
    const session = await db.getFirstAsync(
        `SELECT * FROM sessions
         WHERE user_id = ? AND is_completed = 0
         ORDER BY start_time DESC
         LIMIT 1`,
        [userId]
    )

    if (session) {
        return {
            hasUnfinished: true,
            session,
            locationCount: await getLocationCount(session.id),
            lastLocation: await getLastLocation(session.id),
        }
    }

    return { hasUnfinished: false }
}
```

### 7.2 복구 옵션 UI

```
┌─────────────────────────────────────┐
│  이전 기록이 있습니다                  │
│                                     │
│  시작: 2024-01-15 10:30             │
│  거리: 5.2km | 런: 8회               │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ 이어서   │ │ 새로    │ │ 삭제    ││
│  │ 기록    │ │ 시작    │ │         ││
│  └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

### 7.3 복구 처리

```typescript
const handleRecoveryOption = async (option: 'resume' | 'new' | 'delete') => {
    switch (option) {
        case 'resume':
            await resumeSession(unfinishedSession.id)
            break
        case 'new':
            await markSessionCompleted(unfinishedSession.id)
            await startNewSession()
            break
        case 'delete':
            await deleteSession(unfinishedSession.id)
            break
    }
}
```

---

## 8. 트래킹 종료 처리

### 8.1 종료 시 처리 흐름

```
Stop 버튼 클릭
       │
       ▼
┌─────────────────┐
│ 백그라운드 태스크 │
│ 중지            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 최종 통계 계산   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 갤러리 사진 검색 │
│ (선택적)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 서버 최종 동기화 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 결과 화면 표시   │
└─────────────────┘
```

### 8.2 결과 데이터 생성

```typescript
type SessionResult = {
    sessionId: string
    startTime: number
    endTime: number
    duration: number              // 총 시간 (초)
    timeOnSlope: number           // 슬로프 시간 (초)
    totalDistance: number         // 총 거리 (m)
    maxVertical: number           // 최대 수직 하강 (m)
    totalRuns: number             // 총 활주 횟수
    maxSpeed: number              // 최고 속도 (km/h)
    avgSpeed: number              // 평균 속도 (km/h)
    runs: RunData[]               // 개별 활주 기록
    photos: PhotoData[]           // 매핑된 사진
    locationLatitude: number      // 대표 위치 (시작점)
    locationLongitude: number
}
```

### 8.3 Activity 생성 및 서버 전송

```typescript
const createActivity = async (result: SessionResult) => {
    const activity: CreateActivityInput = {
        locationLatitude: result.locationLatitude,
        locationLongitude: result.locationLongitude,
        type: 'snowboard', // 또는 'ski' (사용자 설정)
        totalDistance: result.totalDistance,
        vertical: result.maxVertical,
        maxSpeed: result.maxSpeed,
        timeOnSlope: result.timeOnSlope,
        runs: result.totalRuns,
        isPublic: true,
    }

    await api.post('/api/activities', activity)
}
```

---

## 9. 갤러리 사진 매핑

### 9.1 사진 검색

```typescript
const findPhotosInTimeRange = async (startTime: number, endTime: number) => {
    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') return []

    const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        createdAfter: startTime,
        createdBefore: endTime,
        sortBy: ['creationTime'],
    })

    return assets.assets
}
```

### 9.2 위치 매칭

```typescript
const matchPhotosToRoute = async (photos: Asset[], locations: LocationPoint[]) => {
    const matchedPhotos: PhotoData[] = []

    for (const photo of photos) {
        const photoInfo = await MediaLibrary.getAssetInfoAsync(photo)

        if (photoInfo.location) {
            // 사진에 위치 정보가 있는 경우
            matchedPhotos.push({
                uri: photo.uri,
                latitude: photoInfo.location.latitude,
                longitude: photoInfo.location.longitude,
                takenAt: photo.creationTime,
            })
        } else {
            // 위치 정보가 없으면 시간 기반으로 경로에서 추정
            const estimatedLocation = findNearestLocation(
                locations,
                photo.creationTime
            )
            if (estimatedLocation) {
                matchedPhotos.push({
                    uri: photo.uri,
                    latitude: estimatedLocation.latitude,
                    longitude: estimatedLocation.longitude,
                    takenAt: photo.creationTime,
                })
            }
        }
    }

    return matchedPhotos
}
```

---

## 10. 30분 정지 알림

### 10.1 정지 시간 추적

```typescript
let restingStartTime: number | null = null

const onActivityStateChange = (newState: ActivityState) => {
    if (newState === 'resting') {
        restingStartTime = Date.now()
    } else {
        restingStartTime = null
    }
}
```

### 10.2 알림 발송

```typescript
const RESTING_ALERT_THRESHOLD = 30 * 60 * 1000 // 30분

const checkRestingAlert = () => {
    if (restingStartTime && Date.now() - restingStartTime > RESTING_ALERT_THRESHOLD) {
        Notifications.scheduleNotificationAsync({
            content: {
                title: 'Snowby',
                body: '30분 이상 정지 중입니다. 트래킹을 종료하시겠습니까?',
                data: { action: 'stop_tracking' },
            },
            trigger: null,
        })

        restingStartTime = null // 중복 알림 방지
    }
}
```

---

## 11. 파일 구조

```
lib/
├── tracking/
│   ├── tracking.store.ts         # 트래킹 상태 관리
│   ├── tracking.types.ts         # 타입 정의
│   ├── tracking.config.ts        # 설정값
│   ├── tracking.utils.ts         # 유틸 함수
│   ├── activity-detector.ts      # 자동 상태 감지
│   ├── location-processor.ts     # 위치 데이터 처리
│   └── sync-manager.ts           # 서버 동기화
├── database/
│   ├── schema.ts                 # SQLite 스키마
│   ├── migrations.ts             # 마이그레이션
│   └── queries.ts                # 쿼리 함수
├── services/
│   ├── background-location.ts    # 백그라운드 위치
│   └── photo-mapper.ts           # 갤러리 사진 매핑
└── hooks/
    ├── use-tracking.ts           # 트래킹 훅
    └── use-crash-recovery.ts     # 크래시 복구 훅
```

---

## 12. 구현 순서

### Phase 1: 기본 트래킹
1. SQLite 스키마 설정
2. 위치 추적 기본 구현
3. 실시간 저장 구현
4. UI 연동

### Phase 2: 자동 감지
5. 자동 상태 감지 알고리즘
6. 활주 횟수 카운트
7. 노이즈 필터링

### Phase 3: 백그라운드 & 복구
8. 백그라운드 태스크 구현
9. 크래시 복구 구현
10. 30분 정지 알림

### Phase 4: 마무리
11. 서버 동기화 (1분 간격)
12. 갤러리 사진 매핑
13. 결과 화면 및 Activity 생성

---

## 13. 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2024-12-13 | 1.0.0 | 초기 문서 작성 |
