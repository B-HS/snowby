import { getDatabase } from './db'
import type { TrackingSession, LocationPoint, RunData, PhotoData, SessionStats, ActivityState } from '@/lib/tracking/tracking.types'

const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const createSession = async (userId: string, startTime: number, startLatitude: number, startLongitude: number): Promise<TrackingSession> => {
    const db = await getDatabase()
    const id = generateId()

    await db.runAsync(
        `INSERT INTO sessions (id, user_id, start_time, start_latitude, start_longitude, total_runs)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [id, userId, startTime, startLatitude, startLongitude],
    )

    const session = await getSession(id)
    return session!
}

export const getSession = async (id: string): Promise<TrackingSession | null> => {
    const db = await getDatabase()
    const result = await db.getFirstAsync<{
        id: string
        user_id: string
        start_time: number
        end_time: number | null
        start_latitude: number
        start_longitude: number
        total_distance: number
        max_vertical: number
        total_runs: number
        max_speed: number
        time_on_slope: number
        is_completed: number
        is_synced: number
        last_synced_location_id: number
        created_at: number
    }>(`SELECT * FROM sessions WHERE id = ?`, [id])

    if (!result) return null

    return {
        id: result.id,
        userId: result.user_id,
        startTime: result.start_time,
        endTime: result.end_time,
        startLatitude: result.start_latitude,
        startLongitude: result.start_longitude,
        totalDistance: result.total_distance,
        maxVertical: result.max_vertical,
        totalRuns: result.total_runs,
        maxSpeed: result.max_speed,
        timeOnSlope: result.time_on_slope,
        isCompleted: result.is_completed,
        isSynced: result.is_synced,
        lastSyncedLocationId: result.last_synced_location_id,
        createdAt: result.created_at,
    }
}

export const getUnfinishedSession = async (userId: string): Promise<TrackingSession | null> => {
    const db = await getDatabase()
    const result = await db.getFirstAsync<{
        id: string
        user_id: string
        start_time: number
        end_time: number | null
        start_latitude: number
        start_longitude: number
        total_distance: number
        max_vertical: number
        total_runs: number
        max_speed: number
        time_on_slope: number
        is_completed: number
        is_synced: number
        last_synced_location_id: number
        created_at: number
    }>(`SELECT * FROM sessions WHERE user_id = ? AND is_completed = 0 ORDER BY start_time DESC LIMIT 1`, [userId])

    if (!result) return null

    return {
        id: result.id,
        userId: result.user_id,
        startTime: result.start_time,
        endTime: result.end_time,
        startLatitude: result.start_latitude,
        startLongitude: result.start_longitude,
        totalDistance: result.total_distance,
        maxVertical: result.max_vertical,
        totalRuns: result.total_runs,
        maxSpeed: result.max_speed,
        timeOnSlope: result.time_on_slope,
        isCompleted: result.is_completed,
        isSynced: result.is_synced,
        lastSyncedLocationId: result.last_synced_location_id,
        createdAt: result.created_at,
    }
}

export const updateSessionStats = async (sessionId: string, stats: SessionStats) => {
    const db = await getDatabase()
    await db.runAsync(
        `UPDATE sessions SET
         total_distance = ?, max_vertical = ?, total_runs = ?,
         max_speed = ?, time_on_slope = ?
         WHERE id = ?`,
        [stats.totalDistance, stats.maxVertical, stats.totalRuns, stats.maxSpeed, stats.timeOnSlope, sessionId],
    )
}

export const completeSession = async (sessionId: string, endTime: number) => {
    const db = await getDatabase()
    await db.runAsync(`UPDATE sessions SET end_time = ?, is_completed = 1 WHERE id = ?`, [endTime, sessionId])
}

export const markSessionSynced = async (sessionId: string) => {
    const db = await getDatabase()
    await db.runAsync(`UPDATE sessions SET is_synced = 1 WHERE id = ?`, [sessionId])
}

export const updateLastSyncedLocationId = async (sessionId: string, locationId: number) => {
    const db = await getDatabase()
    await db.runAsync(`UPDATE sessions SET last_synced_location_id = ? WHERE id = ?`, [locationId, sessionId])
}

export const deleteSessionData = async (sessionId: string) => {
    const db = await getDatabase()
    await db.runAsync(`DELETE FROM photos WHERE session_id = ?`, [sessionId])
    await db.runAsync(`DELETE FROM runs WHERE session_id = ?`, [sessionId])
    await db.runAsync(`DELETE FROM locations WHERE session_id = ?`, [sessionId])
    await db.runAsync(`DELETE FROM sessions WHERE id = ?`, [sessionId])
}

export const saveLocation = async (
    sessionId: string,
    latitude: number,
    longitude: number,
    altitude: number,
    speed: number,
    accuracy: number,
    timestamp: number,
    activityState: ActivityState,
    segmentIndex: number = 0,
): Promise<number> => {
    const db = await getDatabase()
    const result = await db.runAsync(
        `INSERT INTO locations
         (session_id, latitude, longitude, altitude, speed, accuracy, timestamp, activity_state, segment_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, latitude, longitude, altitude, speed, accuracy, timestamp, activityState, segmentIndex],
    )
    return result.lastInsertRowId
}

export const getLocations = async (sessionId: string): Promise<LocationPoint[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: number
        session_id: string
        latitude: number
        longitude: number
        altitude: number
        speed: number
        accuracy: number
        timestamp: number
        activity_state: string
        segment_index: number
        is_synced: number
    }>(`SELECT * FROM locations WHERE session_id = ? ORDER BY timestamp ASC`, [sessionId])

    return results.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        latitude: r.latitude,
        longitude: r.longitude,
        altitude: r.altitude,
        speed: r.speed,
        accuracy: r.accuracy,
        timestamp: r.timestamp,
        activityState: r.activity_state as ActivityState,
        segmentIndex: r.segment_index ?? 0,
        isSynced: r.is_synced,
    }))
}

export const getLocationsGroupedBySegment = async (sessionId: string): Promise<[number, number][][]> => {
    const locations = await getLocations(sessionId)
    const segmentMap = new Map<number, [number, number][]>()

    for (const loc of locations) {
        const segIdx = loc.segmentIndex
        if (!segmentMap.has(segIdx)) {
            segmentMap.set(segIdx, [])
        }
        segmentMap.get(segIdx)!.push([loc.longitude, loc.latitude])
    }

    const maxSegment = Math.max(...Array.from(segmentMap.keys()), -1)
    const segments: [number, number][][] = []

    for (let i = 0; i <= maxSegment; i++) {
        segments.push(segmentMap.get(i) ?? [])
    }

    return segments
}

export const getUnsyncedLocations = async (sessionId: string, afterId: number, limit: number = 100): Promise<LocationPoint[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: number
        session_id: string
        latitude: number
        longitude: number
        altitude: number
        speed: number
        accuracy: number
        timestamp: number
        activity_state: string
        segment_index: number
        is_synced: number
    }>(
        `SELECT * FROM locations
         WHERE session_id = ? AND id > ? AND is_synced = 0
         ORDER BY timestamp ASC
         LIMIT ?`,
        [sessionId, afterId, limit],
    )

    return results.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        latitude: r.latitude,
        longitude: r.longitude,
        altitude: r.altitude,
        speed: r.speed,
        accuracy: r.accuracy,
        timestamp: r.timestamp,
        activityState: r.activity_state as ActivityState,
        segmentIndex: r.segment_index ?? 0,
        isSynced: r.is_synced,
    }))
}

export const markLocationsSynced = async (ids: number[]) => {
    if (ids.length === 0) return
    const db = await getDatabase()
    const placeholders = ids.map(() => '?').join(',')
    await db.runAsync(`UPDATE locations SET is_synced = 1 WHERE id IN (${placeholders})`, ids)
}

export const getLocationCount = async (sessionId: string): Promise<number> => {
    const db = await getDatabase()
    const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM locations WHERE session_id = ?`, [sessionId])
    return result?.count ?? 0
}

export const getLastLocation = async (sessionId: string): Promise<LocationPoint | null> => {
    const db = await getDatabase()
    const result = await db.getFirstAsync<{
        id: number
        session_id: string
        latitude: number
        longitude: number
        altitude: number
        speed: number
        accuracy: number
        timestamp: number
        activity_state: string
        segment_index: number
        is_synced: number
    }>(`SELECT * FROM locations WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1`, [sessionId])

    if (!result) return null

    return {
        id: result.id,
        sessionId: result.session_id,
        latitude: result.latitude,
        longitude: result.longitude,
        altitude: result.altitude,
        speed: result.speed,
        accuracy: result.accuracy,
        timestamp: result.timestamp,
        activityState: result.activity_state as ActivityState,
        segmentIndex: result.segment_index ?? 0,
        isSynced: result.is_synced,
    }
}

export const getRecentLocations = async (sessionId: string, count: number): Promise<LocationPoint[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: number
        session_id: string
        latitude: number
        longitude: number
        altitude: number
        speed: number
        accuracy: number
        timestamp: number
        activity_state: string
        segment_index: number
        is_synced: number
    }>(`SELECT * FROM locations WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?`, [sessionId, count])

    return results
        .map((r) => ({
            id: r.id,
            sessionId: r.session_id,
            latitude: r.latitude,
            longitude: r.longitude,
            altitude: r.altitude,
            speed: r.speed,
            accuracy: r.accuracy,
            timestamp: r.timestamp,
            activityState: r.activity_state as ActivityState,
            segmentIndex: r.segment_index ?? 0,
            isSynced: r.is_synced,
        }))
        .reverse()
}

export const getMaxSegmentIndex = async (sessionId: string): Promise<number> => {
    const db = await getDatabase()
    const result = await db.getFirstAsync<{ max_segment: number | null }>(
        `SELECT MAX(segment_index) as max_segment FROM locations WHERE session_id = ?`,
        [sessionId],
    )
    return result?.max_segment ?? 0
}

export const saveRun = async (
    sessionId: string,
    startTime: number,
    endTime: number,
    startAltitude: number,
    endAltitude: number,
    distance: number,
    verticalDrop: number,
    maxSpeed: number,
    avgSpeed: number,
    duration: number,
): Promise<string> => {
    const db = await getDatabase()
    const id = generateId()

    await db.runAsync(
        `INSERT INTO runs
         (id, session_id, start_time, end_time, start_altitude, end_altitude,
          distance, vertical_drop, max_speed, avg_speed, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, sessionId, startTime, endTime, startAltitude, endAltitude, distance, verticalDrop, maxSpeed, avgSpeed, duration],
    )

    return id
}

export const getRuns = async (sessionId: string): Promise<RunData[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: string
        session_id: string
        start_time: number
        end_time: number
        start_altitude: number
        end_altitude: number
        distance: number
        vertical_drop: number
        max_speed: number
        avg_speed: number
        duration: number
        is_synced: number
    }>(`SELECT * FROM runs WHERE session_id = ? ORDER BY start_time ASC`, [sessionId])

    return results.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        startTime: r.start_time,
        endTime: r.end_time,
        startAltitude: r.start_altitude,
        endAltitude: r.end_altitude,
        distance: r.distance,
        verticalDrop: r.vertical_drop,
        maxSpeed: r.max_speed,
        avgSpeed: r.avg_speed,
        duration: r.duration,
        isSynced: r.is_synced,
    }))
}

export const getUnsyncedRuns = async (sessionId: string): Promise<RunData[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: string
        session_id: string
        start_time: number
        end_time: number
        start_altitude: number
        end_altitude: number
        distance: number
        vertical_drop: number
        max_speed: number
        avg_speed: number
        duration: number
        is_synced: number
    }>(`SELECT * FROM runs WHERE session_id = ? AND is_synced = 0 ORDER BY start_time ASC`, [sessionId])

    return results.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        startTime: r.start_time,
        endTime: r.end_time,
        startAltitude: r.start_altitude,
        endAltitude: r.end_altitude,
        distance: r.distance,
        verticalDrop: r.vertical_drop,
        maxSpeed: r.max_speed,
        avgSpeed: r.avg_speed,
        duration: r.duration,
        isSynced: r.is_synced,
    }))
}

export const markRunsSynced = async (ids: string[]) => {
    if (ids.length === 0) return
    const db = await getDatabase()
    const placeholders = ids.map(() => '?').join(',')
    await db.runAsync(`UPDATE runs SET is_synced = 1 WHERE id IN (${placeholders})`, ids)
}

export const savePhoto = async (sessionId: string, uri: string, takenAt: number, latitude?: number, longitude?: number): Promise<number> => {
    const db = await getDatabase()
    const result = await db.runAsync(
        `INSERT INTO photos (session_id, uri, latitude, longitude, taken_at)
         VALUES (?, ?, ?, ?, ?)`,
        [sessionId, uri, latitude ?? null, longitude ?? null, takenAt],
    )
    return result.lastInsertRowId
}

export const getPhotos = async (sessionId: string): Promise<PhotoData[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: number
        session_id: string
        uri: string
        latitude: number | null
        longitude: number | null
        taken_at: number
    }>(`SELECT * FROM photos WHERE session_id = ? ORDER BY taken_at ASC`, [sessionId])

    return results.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        uri: r.uri,
        latitude: r.latitude,
        longitude: r.longitude,
        takenAt: r.taken_at,
    }))
}

export const getCompletedSessions = async (userId: string): Promise<TrackingSession[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: string
        user_id: string
        start_time: number
        end_time: number | null
        start_latitude: number
        start_longitude: number
        total_distance: number
        max_vertical: number
        total_runs: number
        max_speed: number
        time_on_slope: number
        is_completed: number
        is_synced: number
        last_synced_location_id: number
        created_at: number
    }>(`SELECT * FROM sessions WHERE user_id = ? AND is_completed = 1 ORDER BY start_time DESC`, [userId])

    return results.map((r) => ({
        id: r.id,
        userId: r.user_id,
        startTime: r.start_time,
        endTime: r.end_time,
        startLatitude: r.start_latitude,
        startLongitude: r.start_longitude,
        totalDistance: r.total_distance,
        maxVertical: r.max_vertical,
        totalRuns: r.total_runs,
        maxSpeed: r.max_speed,
        timeOnSlope: r.time_on_slope,
        isCompleted: r.is_completed,
        isSynced: r.is_synced,
        lastSyncedLocationId: r.last_synced_location_id,
        createdAt: r.created_at,
    }))
}

export const migrateAnonymousSessions = async (newUserId: string): Promise<number> => {
    const db = await getDatabase()
    const result = await db.runAsync(`UPDATE sessions SET user_id = ? WHERE user_id = 'anonymous'`, [newUserId])
    return result.changes
}

export const getUnsyncedSessions = async (userId: string): Promise<TrackingSession[]> => {
    const db = await getDatabase()
    const results = await db.getAllAsync<{
        id: string
        user_id: string
        start_time: number
        end_time: number | null
        start_latitude: number
        start_longitude: number
        total_distance: number
        max_vertical: number
        total_runs: number
        max_speed: number
        time_on_slope: number
        is_completed: number
        is_synced: number
        last_synced_location_id: number
        created_at: number
    }>(`SELECT * FROM sessions WHERE user_id = ? AND is_synced = 0 ORDER BY start_time ASC`, [userId])

    return results.map((r) => ({
        id: r.id,
        userId: r.user_id,
        startTime: r.start_time,
        endTime: r.end_time,
        startLatitude: r.start_latitude,
        startLongitude: r.start_longitude,
        totalDistance: r.total_distance,
        maxVertical: r.max_vertical,
        totalRuns: r.total_runs,
        maxSpeed: r.max_speed,
        timeOnSlope: r.time_on_slope,
        isCompleted: r.is_completed,
        isSynced: r.is_synced,
        lastSyncedLocationId: r.last_synced_location_id,
        createdAt: r.created_at,
    }))
}
