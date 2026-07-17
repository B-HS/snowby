export type TrackingStatus = 'start' | 'pause' | 'stop'

export type ActivityState = 'skiing' | 'lifting' | 'resting'

export type GPSSignalLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'none'

export type LocationPoint = {
    id: number
    sessionId: string
    latitude: number
    longitude: number
    altitude: number
    speed: number
    accuracy: number
    timestamp: number
    activityState: ActivityState
    segmentIndex: number
    isSynced: number
}

export type TrackingSession = {
    id: string
    userId: string
    startTime: number
    endTime: number | null
    startLatitude: number
    startLongitude: number
    totalDistance: number
    maxVertical: number
    totalRuns: number
    maxSpeed: number
    timeOnSlope: number
    isCompleted: number
    isSynced: number
    lastSyncedLocationId: number
    createdAt: number
}

export type RunData = {
    id: string
    sessionId: string
    startTime: number
    endTime: number
    startAltitude: number
    endAltitude: number
    distance: number
    verticalDrop: number
    maxSpeed: number
    avgSpeed: number
    duration: number
    isSynced: number
}

export type PhotoData = {
    id: number
    sessionId: string
    uri: string
    latitude: number | null
    longitude: number | null
    takenAt: number
}

export type TrackingData = {
    sessionId: string | null
    startTime: number | null
    startLatitude: number
    startLongitude: number
    currentLatitude: number
    currentLongitude: number
    currentAltitude: number
    currentSpeed: number
    totalDistance: number
    maxVertical: number
    totalRuns: number
    maxSpeed: number
    timeOnSlope: number
    activityState: ActivityState
    segments: [number, number][][]
}

export type SessionStats = {
    totalDistance: number
    maxVertical: number
    totalRuns: number
    maxSpeed: number
    timeOnSlope: number
}

export type CurrentRunData = {
    startTime: number
    startAltitude: number
    startLatitude: number
    startLongitude: number
    distance: number
    maxSpeed: number
    totalSpeed: number
    speedCount: number
}

export type SyncLocationInput = {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    accuracy: number
    timestamp: number
    activityState: ActivityState
    segmentIndex: number
    clientId: number
}

export type SyncRunInput = {
    id: string
    startTime: number
    endTime: number
    startAltitude: number
    endAltitude: number
    distance: number
    verticalDrop: number
    maxSpeed: number
    avgSpeed: number
    duration: number
}

export type SyncDataPayload = {
    sessionId: string
    locations: SyncLocationInput[]
    runs: SyncRunInput[]
    sessionStats: SessionStats
    sessionStart: {
        startTime: number
        startLatitude: number
        startLongitude: number
    }
    lastSyncedClientId: number
}

export type UnfinishedSessionInfo = {
    hasUnfinished: boolean
    session: TrackingSession | null
    locationCount: number
    lastLocation: LocationPoint | null
}

export type RecoveryOption = 'resume' | 'new' | 'delete'
