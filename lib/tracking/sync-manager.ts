import * as Network from 'expo-network'
import { SYNC_CONFIG } from './tracking.config'
import * as queries from '@/lib/database/queries'
import { getAuthCookie } from '@/lib/services/auth'
import type { SyncDataPayload } from './tracking.types'

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || ''

type SyncStatusCallback = (syncing: boolean, error: string | null) => void

export class SyncManager {
    private sessionId: string | null = null
    private syncInterval: ReturnType<typeof setInterval> | null = null
    private syncPromise: Promise<boolean> | null = null
    private retryCount: number = 0
    private lastSyncedLocationId: number = 0
    private statusCallback: SyncStatusCallback | null = null
    private isStarted: boolean = false

    setSessionId = (sessionId: string) => {
        this.sessionId = sessionId
    }

    setStatusCallback = (callback: SyncStatusCallback) => {
        this.statusCallback = callback
    }

    setLastSyncedLocationId = (id: number) => {
        this.lastSyncedLocationId = id
    }

    start = () => {
        this.isStarted = true
        if (this.syncInterval) return

        this.syncInterval = setInterval(() => {
            this.sync()
        }, SYNC_CONFIG.interval)

        this.sync()
    }

    stop = () => {
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
            this.syncInterval = null
        }
    }

    syncNow = async (): Promise<boolean> => {
        return this.sync()
    }

    private sync = async (): Promise<boolean> => {
        if (!this.sessionId) return false

        if (this.syncPromise) {
            return this.syncPromise
        }

        this.syncPromise = this.executeSync()

        try {
            return await this.syncPromise
        } finally {
            this.syncPromise = null
        }
    }

    private executeSync = async (): Promise<boolean> => {
        const networkState = await Network.getNetworkStateAsync()
        if (!networkState.isConnected || !networkState.isInternetReachable) {
            return false
        }

        if (this.statusCallback) {
            this.statusCallback(true, null)
        }

        try {
            const session = await queries.getSession(this.sessionId!)
            if (!session) {
                throw new Error('Session not found')
            }

            const unsyncedLocations = await queries.getUnsyncedLocations(this.sessionId!, this.lastSyncedLocationId, SYNC_CONFIG.batchSize)

            const unsyncedRuns = await queries.getUnsyncedRuns(this.sessionId!)

            if (unsyncedLocations.length === 0 && unsyncedRuns.length === 0) {
                if (this.statusCallback) {
                    this.statusCallback(false, null)
                }
                return true
            }

            const payload: SyncDataPayload = {
                sessionId: this.sessionId!,
                locations: unsyncedLocations.map((loc) => ({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    altitude: loc.altitude,
                    speed: loc.speed,
                    accuracy: loc.accuracy,
                    timestamp: loc.timestamp,
                    activityState: loc.activityState,
                    segmentIndex: loc.segmentIndex,
                    clientId: loc.id,
                })),
                runs: unsyncedRuns.map((run) => ({
                    id: run.id,
                    startTime: run.startTime,
                    endTime: run.endTime,
                    startAltitude: run.startAltitude,
                    endAltitude: run.endAltitude,
                    distance: run.distance,
                    verticalDrop: run.verticalDrop,
                    maxSpeed: run.maxSpeed,
                    avgSpeed: run.avgSpeed,
                    duration: run.duration,
                })),
                sessionStats: {
                    totalDistance: session.totalDistance,
                    maxVertical: session.maxVertical,
                    totalRuns: session.totalRuns,
                    maxSpeed: session.maxSpeed,
                    timeOnSlope: session.timeOnSlope,
                },
                sessionStart: {
                    startTime: session.startTime,
                    startLatitude: session.startLatitude,
                    startLongitude: session.startLongitude,
                },
                lastSyncedClientId: this.lastSyncedLocationId,
            }

            const cookie = getAuthCookie()
            const response = await fetch(`${API_URL}/api/tracking/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie,
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`)
            }

            const result = await response.json()

            if (unsyncedLocations.length > 0) {
                const locationIds = unsyncedLocations.map((l) => l.id)
                await queries.markLocationsSynced(locationIds)
                this.lastSyncedLocationId = locationIds[locationIds.length - 1]
                await queries.updateLastSyncedLocationId(this.sessionId!, this.lastSyncedLocationId)
            }

            if (unsyncedRuns.length > 0) {
                const runIds = unsyncedRuns.map((r) => r.id)
                await queries.markRunsSynced(runIds)
            }

            this.retryCount = 0

            if (this.statusCallback) {
                this.statusCallback(false, null)
            }

            if (result.serverLocations && result.serverLocations.length > 0) {
                await this.mergeServerData(result.serverLocations, result.serverRuns)
            }

            return true
        } catch (error) {
            this.retryCount++

            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            if (this.statusCallback) {
                this.statusCallback(false, errorMessage)
            }

            if (this.retryCount < SYNC_CONFIG.maxRetries) {
                setTimeout(() => this.sync(), SYNC_CONFIG.retryDelay)
            }

            return false
        }
    }

    private mergeServerData = async (
        serverLocations: Array<{
            clientId: number | null
            latitude: number
            longitude: number
            altitude: number
            speed: number
            accuracy: number
            timestamp: string
            activityState: string
            segmentIndex: number
        }>,
        serverRuns: Array<{
            id: string
            startTime: string
            endTime: string
            startAltitude: number
            endAltitude: number
            distance: number
            verticalDrop: number
            maxSpeed: number
            avgSpeed: number
            duration: number
        }>,
    ) => {
        if (!this.sessionId) return

        for (const loc of serverLocations) {
            if (loc.clientId === null) {
                await queries.saveLocation(
                    this.sessionId,
                    loc.latitude,
                    loc.longitude,
                    loc.altitude,
                    loc.speed,
                    loc.accuracy,
                    new Date(loc.timestamp).getTime(),
                    loc.activityState as 'skiing' | 'lifting' | 'resting',
                    loc.segmentIndex ?? 0,
                    1,
                )
            }
        }

        const existingRuns = await queries.getRuns(this.sessionId)
        const existingRunIds = new Set(existingRuns.map((r) => r.id))

        for (const run of serverRuns) {
            if (!existingRunIds.has(run.id)) {
                await queries.saveRun(
                    this.sessionId,
                    new Date(run.startTime).getTime(),
                    new Date(run.endTime).getTime(),
                    run.startAltitude,
                    run.endAltitude,
                    run.distance,
                    run.verticalDrop,
                    run.maxSpeed,
                    run.avgSpeed,
                    run.duration,
                )
            }
        }
    }

    finalSync = async (): Promise<boolean> => {
        this.stop()

        if (!this.isStarted || !this.sessionId) return true

        for (let attempt = 0; attempt < SYNC_CONFIG.finalSyncMaxAttempts; attempt++) {
            const [remainingLocations, remainingRuns] = await Promise.all([
                queries.getUnsyncedLocations(this.sessionId, this.lastSyncedLocationId, 1),
                queries.getUnsyncedRuns(this.sessionId),
            ])

            if (remainingLocations.length === 0 && remainingRuns.length === 0) return true

            const success = await this.sync()
            if (!success) await new Promise((resolve) => setTimeout(resolve, SYNC_CONFIG.retryDelay))
        }

        const stillRemaining = await queries.getUnsyncedLocations(this.sessionId, this.lastSyncedLocationId, 1)
        return stillRemaining.length === 0
    }

    syncCompletedSession = async (session: {
        id: string
        userId: string
        startTime: number
        startLatitude: number
        startLongitude: number
        totalDistance: number
        maxVertical: number
        totalRuns: number
        maxSpeed: number
        timeOnSlope: number
    }): Promise<boolean> => {
        const networkState = await Network.getNetworkStateAsync()
        if (!networkState.isConnected || !networkState.isInternetReachable) {
            throw new Error('No network connection')
        }

        const cookie = getAuthCookie()
        if (!cookie) {
            throw new Error('Not authenticated')
        }

        const locations = await queries.getLocations(session.id)
        const runs = await queries.getRuns(session.id)

        const payload: SyncDataPayload = {
            sessionId: session.id,
            locations: locations.map((loc) => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                altitude: loc.altitude,
                speed: loc.speed,
                accuracy: loc.accuracy,
                timestamp: loc.timestamp,
                activityState: loc.activityState,
                segmentIndex: loc.segmentIndex,
                clientId: loc.id,
            })),
            runs: runs.map((run) => ({
                id: run.id,
                startTime: run.startTime,
                endTime: run.endTime,
                startAltitude: run.startAltitude,
                endAltitude: run.endAltitude,
                distance: run.distance,
                verticalDrop: run.verticalDrop,
                maxSpeed: run.maxSpeed,
                avgSpeed: run.avgSpeed,
                duration: run.duration,
            })),
            sessionStats: {
                totalDistance: session.totalDistance,
                maxVertical: session.maxVertical,
                totalRuns: session.totalRuns,
                maxSpeed: session.maxSpeed,
                timeOnSlope: session.timeOnSlope,
            },
            sessionStart: {
                startTime: session.startTime,
                startLatitude: session.startLatitude,
                startLongitude: session.startLongitude,
            },
            lastSyncedClientId: 0,
        }

        const syncResponse = await fetch(`${API_URL}/api/tracking/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie,
            },
            credentials: 'include',
            body: JSON.stringify(payload),
        })

        if (!syncResponse.ok) {
            throw new Error(`Sync failed: ${syncResponse.status}`)
        }

        await this.completeServerSession(session.id)

        if (locations.length > 0) {
            await queries.markLocationsSynced(locations.map((l) => l.id))
        }
        if (runs.length > 0) {
            await queries.markRunsSynced(runs.map((r) => r.id))
        }

        return true
    }

    completeServerSession = async (sessionId: string): Promise<boolean> => {
        const cookie = getAuthCookie()
        if (!cookie) {
            throw new Error('Not authenticated')
        }

        const response = await fetch(`${API_URL}/api/tracking/sessions/${sessionId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie,
            },
            credentials: 'include',
        })

        if (!response.ok) {
            throw new Error(`Failed to complete session: ${response.status}`)
        }

        return true
    }

    reset = () => {
        this.stop()
        this.sessionId = null
        this.syncPromise = null
        this.retryCount = 0
        this.lastSyncedLocationId = 0
        this.isStarted = false
    }
}

export const syncManager = new SyncManager()
