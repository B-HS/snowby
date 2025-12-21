import { create } from 'zustand'
import type {
    TrackingStatus,
    ActivityState,
    TrackingData,
    SessionStats,
    TrackingSession,
    UnfinishedSessionInfo,
    RecoveryOption,
} from './tracking.types'
import * as queries from '@/lib/database/queries'
import { initializeDatabase } from '@/lib/database/db'
import { locationProcessor } from './location-processor'
import { syncManager } from './sync-manager'
import { activityDetector } from './activity-detector'

type TrackingStore = {
    isInitialized: boolean
    trackingStatus: TrackingStatus
    trackingData: TrackingData
    activityState: ActivityState
    sessionId: string | null
    unfinishedSession: UnfinishedSessionInfo | null
    isSyncing: boolean
    syncError: string | null

    initialize: (userId: string) => Promise<void>
    startTracking: (userId: string, latitude: number, longitude: number) => Promise<string>
    pauseTracking: () => void
    resumeTracking: () => void
    stopTracking: () => Promise<void>
    processLocation: (
        latitude: number,
        longitude: number,
        altitude: number,
        speed: number,
        accuracy: number,
        timestamp: number
    ) => Promise<void>
    updateStats: (stats: SessionStats) => void
    setActivityState: (state: ActivityState) => void
    checkUnfinishedSession: (userId: string) => Promise<UnfinishedSessionInfo>
    handleRecoveryOption: (option: RecoveryOption, userId: string) => Promise<void>
    migrateAndSyncOnLogin: (userId: string) => Promise<number>
    reset: () => void
}

const initialTrackingData: TrackingData = {
    sessionId: null,
    startTime: null,
    startLatitude: 0,
    startLongitude: 0,
    currentLatitude: 0,
    currentLongitude: 0,
    currentAltitude: 0,
    currentSpeed: 0,
    totalDistance: 0,
    maxVertical: 0,
    totalRuns: 0,
    maxSpeed: 0,
    timeOnSlope: 0,
    activityState: 'resting',
    segments: [],
}

export const useTrackingStore = create<TrackingStore>((set, get) => ({
    isInitialized: false,
    trackingStatus: 'stop',
    trackingData: initialTrackingData,
    activityState: 'resting',
    sessionId: null,
    unfinishedSession: null,
    isSyncing: false,
    syncError: null,

    initialize: async (userId: string) => {
        console.log('[TrackingStore] initializing...')
        await initializeDatabase()
        console.log('[TrackingStore] database initialized')

        locationProcessor.setLocationUpdateCallback((stats, activityState) => {
            get().updateStats(stats)
            get().setActivityState(activityState)
        })

        locationProcessor.setupRunCompleteHandler()

        syncManager.setStatusCallback((syncing, error) => {
            set({ isSyncing: syncing, syncError: error })
        })

        const unfinished = await get().checkUnfinishedSession(userId)
        set({ isInitialized: true, unfinishedSession: unfinished.hasUnfinished ? unfinished : null })
        console.log('[TrackingStore] initialized, hasUnfinished:', unfinished.hasUnfinished)
    },

    startTracking: async (userId: string, latitude: number, longitude: number) => {
        console.log('[TrackingStore] startTracking called:', userId, latitude, longitude)
        const startTime = Date.now()
        const isAnonymous = userId === 'anonymous'

        try {
            const session = await queries.createSession(userId, startTime, latitude, longitude)
            console.log('[TrackingStore] session created:', session.id)

            locationProcessor.reset()
            locationProcessor.setSessionId(session.id)

            syncManager.reset()
            syncManager.setSessionId(session.id)

            if (!isAnonymous) {
                syncManager.start()
                console.log('[TrackingStore] sync manager started (logged in user)')
            } else {
                console.log('[TrackingStore] sync manager NOT started (anonymous user)')
            }

            set({
                trackingStatus: 'start',
                sessionId: session.id,
                trackingData: {
                    ...initialTrackingData,
                    sessionId: session.id,
                    startTime,
                    startLatitude: latitude,
                    startLongitude: longitude,
                    currentLatitude: latitude,
                    currentLongitude: longitude,
                    totalRuns: 1,
                    segments: [[]],
                },
                activityState: 'resting',
            })
            console.log('[TrackingStore] tracking started, status set to start')

            return session.id
        } catch (error) {
            console.error('[TrackingStore] Error creating session:', error)
            throw error
        }
    },

    pauseTracking: () => {
        set({ trackingStatus: 'pause' })
    },

    resumeTracking: () => {
        locationProcessor.incrementSegmentIndex()
        set((state) => ({
            trackingStatus: 'start',
            trackingData: {
                ...state.trackingData,
                segments: [...state.trackingData.segments, []],
            },
        }))
    },

    stopTracking: async () => {
        const { sessionId } = get()
        if (!sessionId) return

        await syncManager.finalSync()

        const endTime = Date.now()
        await queries.completeSession(sessionId, endTime)

        locationProcessor.reset()
        syncManager.reset()

        set({
            trackingStatus: 'stop',
            sessionId: null,
            trackingData: initialTrackingData,
            activityState: 'resting',
        })
    },

    processLocation: async (
        latitude: number,
        longitude: number,
        altitude: number,
        speed: number,
        accuracy: number,
        timestamp: number
    ) => {
        const { trackingStatus, sessionId } = get()
        if (trackingStatus !== 'start' || !sessionId) return

        const result = await locationProcessor.processLocation(
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            timestamp
        )

        if (result) {
            const { stats, activityState } = result

            await queries.updateSessionStats(sessionId, stats)

            set((state) => {
                const lastSegmentIndex = state.trackingData.segments.length - 1
                const segments = state.trackingData.segments.map((segment, index) =>
                    index === lastSegmentIndex
                        ? [...segment, [longitude, latitude] as [number, number]]
                        : segment
                )
                return {
                    trackingData: {
                        ...state.trackingData,
                        currentLatitude: latitude,
                        currentLongitude: longitude,
                        currentAltitude: altitude,
                        currentSpeed: speed * 3.6,
                        totalDistance: stats.totalDistance,
                        maxVertical: stats.maxVertical,
                        totalRuns: stats.totalRuns,
                        maxSpeed: stats.maxSpeed,
                        timeOnSlope: stats.timeOnSlope,
                        activityState,
                        segments,
                    },
                    activityState,
                }
            })
        }
    },

    updateStats: (stats: SessionStats) => {
        set((state) => ({
            trackingData: {
                ...state.trackingData,
                totalDistance: stats.totalDistance,
                maxVertical: stats.maxVertical,
                totalRuns: stats.totalRuns,
                maxSpeed: stats.maxSpeed,
                timeOnSlope: stats.timeOnSlope,
            },
        }))
    },

    setActivityState: (state: ActivityState) => {
        set({ activityState: state })
    },

    checkUnfinishedSession: async (userId: string) => {
        const session = await queries.getUnfinishedSession(userId)

        if (!session) {
            return {
                hasUnfinished: false,
                session: null,
                locationCount: 0,
                lastLocation: null,
            }
        }

        const locationCount = await queries.getLocationCount(session.id)
        const lastLocation = await queries.getLastLocation(session.id)

        return {
            hasUnfinished: true,
            session,
            locationCount,
            lastLocation,
        }
    },

    handleRecoveryOption: async (option: RecoveryOption, _userId: string) => {
        const { unfinishedSession } = get()
        if (!unfinishedSession?.session) return

        const session = unfinishedSession.session

        switch (option) {
            case 'resume':
                locationProcessor.reset()
                locationProcessor.setSessionId(session.id)

                const stats: SessionStats = {
                    totalDistance: session.totalDistance,
                    maxVertical: session.maxVertical,
                    totalRuns: session.totalRuns,
                    maxSpeed: session.maxSpeed,
                    timeOnSlope: session.timeOnSlope,
                }
                locationProcessor.restoreState(stats, unfinishedSession.lastLocation)

                const maxSegmentIdx = await queries.getMaxSegmentIndex(session.id)
                locationProcessor.setSegmentIndex(maxSegmentIdx + 1)

                syncManager.reset()
                syncManager.setSessionId(session.id)
                syncManager.setLastSyncedLocationId(session.lastSyncedLocationId)
                syncManager.start()

                const existingSegments = await queries.getLocationsGroupedBySegment(session.id)
                existingSegments.push([])

                set({
                    trackingStatus: 'start',
                    sessionId: session.id,
                    trackingData: {
                        sessionId: session.id,
                        startTime: session.startTime,
                        startLatitude: session.startLatitude,
                        startLongitude: session.startLongitude,
                        currentLatitude: unfinishedSession.lastLocation?.latitude ?? session.startLatitude,
                        currentLongitude: unfinishedSession.lastLocation?.longitude ?? session.startLongitude,
                        currentAltitude: unfinishedSession.lastLocation?.altitude ?? 0,
                        currentSpeed: 0,
                        totalDistance: session.totalDistance,
                        maxVertical: session.maxVertical,
                        totalRuns: session.totalRuns,
                        maxSpeed: session.maxSpeed,
                        timeOnSlope: session.timeOnSlope,
                        activityState: (unfinishedSession.lastLocation?.activityState as ActivityState) ?? 'resting',
                        segments: existingSegments,
                    },
                    activityState: (unfinishedSession.lastLocation?.activityState as ActivityState) ?? 'resting',
                    unfinishedSession: null,
                })
                break

            case 'new':
                await queries.completeSession(session.id, Date.now())
                set({ unfinishedSession: null })
                break

            case 'delete':
                await queries.deleteSessionData(session.id)
                set({ unfinishedSession: null })
                break
        }
    },

    migrateAndSyncOnLogin: async (userId: string) => {
        console.log('[TrackingStore] migrateAndSyncOnLogin called for:', userId)

        const migratedCount = await queries.migrateAnonymousSessions(userId)
        console.log('[TrackingStore] migrated sessions:', migratedCount)

        if (migratedCount > 0) {
            const unsyncedSessions = await queries.getUnsyncedSessions(userId)
            console.log('[TrackingStore] unsynced sessions to sync:', unsyncedSessions.length)

            for (const session of unsyncedSessions) {
                if (session.isCompleted) {
                    try {
                        await syncManager.syncCompletedSession(session)
                        await queries.markSessionSynced(session.id)
                        console.log('[TrackingStore] synced completed session:', session.id)
                    } catch (error) {
                        console.error('[TrackingStore] failed to sync session:', session.id, error)
                    }
                }
            }
        }

        return migratedCount
    },

    reset: () => {
        locationProcessor.reset()
        syncManager.reset()
        activityDetector.reset()

        set({
            trackingStatus: 'stop',
            trackingData: initialTrackingData,
            activityState: 'resting',
            sessionId: null,
            unfinishedSession: null,
            isSyncing: false,
            syncError: null,
        })
    },
}))
