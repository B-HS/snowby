import { ActivityDetector } from '@/lib/tracking/activity-detector'
import { LocationProcessor } from '@/lib/tracking/location-processor'
import { SyncManager } from '@/lib/tracking/sync-manager'
import { initializeDatabase } from '@/lib/database/db'
import * as queries from '@/lib/database/queries'
import type { ActivityState, LocationPoint, SessionStats } from '@/lib/tracking/tracking.types'

type SimulatedLocation = {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    accuracy: number
    timestamp: number
}

type SimulationScenario = {
    name: string
    description: string
    locations: SimulatedLocation[]
    expectedResults: {
        finalState: ActivityState
        minRuns: number
        maxRuns: number
        minDistance: number
        maxDistance: number
    }
}

export const generateSkiingScenario = (): SimulatedLocation[] => {
    const locations: SimulatedLocation[] = []
    const startTime = Date.now()
    let currentAltitude = 2000
    let currentLat = 36.0
    let currentLng = 128.0

    for (let i = 0; i < 30; i++) {
        locations.push({
            latitude: currentLat,
            longitude: currentLng,
            altitude: currentAltitude,
            speed: 0.5,
            accuracy: 5,
            timestamp: startTime + i * 1000,
        })
    }

    for (let i = 0; i < 60; i++) {
        currentAltitude -= 5
        currentLat += 0.0001
        currentLng += 0.00005
        locations.push({
            latitude: currentLat,
            longitude: currentLng,
            altitude: currentAltitude,
            speed: 8 + Math.random() * 4,
            accuracy: 5,
            timestamp: startTime + 30000 + i * 1000,
        })
    }

    for (let i = 0; i < 180; i++) {
        currentAltitude += 2.5
        currentLat += 0.00002
        locations.push({
            latitude: currentLat,
            longitude: currentLng,
            altitude: currentAltitude,
            speed: 2 + Math.random() * 1,
            accuracy: 5,
            timestamp: startTime + 90000 + i * 1000,
        })
    }

    for (let i = 0; i < 60; i++) {
        currentAltitude -= 5
        currentLat += 0.0001
        currentLng -= 0.00005
        locations.push({
            latitude: currentLat,
            longitude: currentLng,
            altitude: currentAltitude,
            speed: 10 + Math.random() * 5,
            accuracy: 5,
            timestamp: startTime + 270000 + i * 1000,
        })
    }

    return locations
}

export const generateLiftScenario = (): SimulatedLocation[] => {
    const locations: SimulatedLocation[] = []
    const startTime = Date.now()
    let currentAltitude = 1500
    let currentLat = 36.0
    let currentLng = 128.0

    for (let i = 0; i < 180; i++) {
        currentAltitude += 3
        currentLat += 0.00003
        locations.push({
            latitude: currentLat,
            longitude: currentLng,
            altitude: currentAltitude,
            speed: 3 + Math.random() * 0.5,
            accuracy: 5,
            timestamp: startTime + i * 1000,
        })
    }

    return locations
}

export const generateRestingScenario = (): SimulatedLocation[] => {
    const locations: SimulatedLocation[] = []
    const startTime = Date.now()
    const baseAltitude = 1800
    const baseLat = 36.0
    const baseLng = 128.0

    for (let i = 0; i < 120; i++) {
        locations.push({
            latitude: baseLat + (Math.random() - 0.5) * 0.00001,
            longitude: baseLng + (Math.random() - 0.5) * 0.00001,
            altitude: baseAltitude + (Math.random() - 0.5) * 1,
            speed: Math.random() * 0.5,
            accuracy: 5,
            timestamp: startTime + i * 1000,
        })
    }

    return locations
}

type SimulationBounds = {
    sw: [number, number]
    ne: [number, number]
}

const DEFAULT_BOUNDS: SimulationBounds = {
    sw: [127.2797, 37.3286],
    ne: [127.2990, 37.3404],
}

export const generateFullDayScenario = (bounds: SimulationBounds = DEFAULT_BOUNDS): SimulatedLocation[] => {
    const locations: SimulatedLocation[] = []
    const startTime = Date.now()
    let currentTime = startTime

    const centerLat = (bounds.sw[1] + bounds.ne[1]) / 2
    const centerLng = (bounds.sw[0] + bounds.ne[0]) / 2
    const latRange = bounds.ne[1] - bounds.sw[1]
    const lngRange = bounds.ne[0] - bounds.sw[0]

    let currentAltitude = 800
    let currentLat = centerLat - latRange * 0.3
    let currentLng = centerLng

    const clampToBounds = () => {
        currentLat = Math.max(bounds.sw[1], Math.min(bounds.ne[1], currentLat))
        currentLng = Math.max(bounds.sw[0], Math.min(bounds.ne[0], currentLng))
    }

    const addLift = (duration: number) => {
        const latStep = (latRange * 0.12) / duration
        for (let i = 0; i < duration; i++) {
            currentAltitude += 3
            currentLat += latStep
            currentLng += (Math.random() - 0.5) * 0.0001
            clampToBounds()
            locations.push({
                latitude: currentLat,
                longitude: currentLng,
                altitude: currentAltitude,
                speed: 2.5 + Math.random() * 0.5,
                accuracy: 5,
                timestamp: currentTime,
            })
            currentTime += 1000
        }
    }

    const addSkiRun = (duration: number, avgSpeed: number, verticalDrop: number) => {
        const altDrop = verticalDrop / duration
        const latStep = -(latRange * 0.12) / duration
        for (let i = 0; i < duration; i++) {
            currentAltitude -= altDrop
            currentLat += latStep
            currentLng += (Math.random() - 0.5) * (lngRange * 0.02)
            clampToBounds()
            locations.push({
                latitude: currentLat,
                longitude: currentLng,
                altitude: currentAltitude,
                speed: avgSpeed + (Math.random() - 0.5) * 3,
                accuracy: 5,
                timestamp: currentTime,
            })
            currentTime += 1000
        }
    }

    const addResting = (duration: number) => {
        for (let i = 0; i < duration; i++) {
            locations.push({
                latitude: currentLat + (Math.random() - 0.5) * 0.00001,
                longitude: currentLng + (Math.random() - 0.5) * 0.00001,
                altitude: currentAltitude,
                speed: Math.random() * 0.3,
                accuracy: 5,
                timestamp: currentTime,
            })
            currentTime += 1000
        }
    }

    addLift(90)
    addSkiRun(45, 12, 270)

    addLift(90)
    addSkiRun(50, 15, 270)

    addResting(20)

    addLift(85)
    addSkiRun(45, 18, 255)

    addLift(90)
    addSkiRun(50, 14, 270)

    addLift(85)
    addSkiRun(40, 20, 255)

    return locations
}

export const generateNoiseScenario = (): SimulatedLocation[] => {
    const locations: SimulatedLocation[] = []
    const startTime = Date.now()
    let currentAltitude = 2000
    let currentLat = 36.0
    let currentLng = 128.0

    for (let i = 0; i < 100; i++) {
        const isNoisy = i % 5 === 0
        locations.push({
            latitude: currentLat + (isNoisy ? 0.001 : 0),
            longitude: currentLng,
            altitude: currentAltitude + (isNoisy ? 100 : 0),
            speed: isNoisy ? 50 : 0.5,
            accuracy: isNoisy ? 100 : 5,
            timestamp: startTime + i * 1000,
        })
    }

    return locations
}

export const generateOfflineSyncScenario = (): SimulatedLocation[] => {
    const locations: SimulatedLocation[] = []
    const startTime = Date.now()
    let currentAltitude = 2000
    let currentLat = 36.0
    let currentLng = 128.0

    for (let i = 0; i < 300; i++) {
        currentAltitude -= 2
        currentLat += 0.0001
        currentLng += 0.00005

        locations.push({
            latitude: currentLat,
            longitude: currentLng,
            altitude: currentAltitude,
            speed: 7 + Math.random() * 3,
            accuracy: 5,
            timestamp: startTime + i * 1000,
        })
    }

    return locations
}

export class TrackingSimulator {
    private activityDetector: ActivityDetector
    private locationProcessor: LocationProcessor
    private syncManager: SyncManager
    private sessionId: string | null = null
    private userId: string | null = null
    private startLat: number = 37.3345
    private startLng: number = 127.28935
    private results: {
        states: ActivityState[]
        runs: number
        locations: LocationPoint[]
        stats: SessionStats | null
    }

    constructor() {
        this.activityDetector = new ActivityDetector()
        this.locationProcessor = new LocationProcessor()
        this.syncManager = new SyncManager()
        this.results = {
            states: [],
            runs: 0,
            locations: [],
            stats: null,
        }
    }

    async initialize(userId: string, startLat: number = 37.3345, startLng: number = 127.28935): Promise<string> {
        await initializeDatabase()

        this.userId = userId
        this.startLat = startLat
        this.startLng = startLng

        const startTime = Date.now()
        const session = await queries.createSession(userId, startTime, startLat, startLng)

        this.sessionId = session.id
        this.locationProcessor.reset()
        this.locationProcessor.setSessionId(session.id)
        this.locationProcessor.setupRunCompleteHandler()

        this.syncManager.reset()
        this.syncManager.setSessionId(session.id)

        return session.id
    }

    async completeSession(): Promise<void> {
        if (!this.sessionId) return

        const stats = this.getStats()
        await queries.updateSessionStats(this.sessionId, stats)
        await queries.completeSession(this.sessionId, Date.now())

        const session = await queries.getSession(this.sessionId)
        if (session) {
            try {
                await this.syncManager.syncCompletedSession({
                    id: session.id,
                    userId: session.userId,
                    startTime: session.startTime,
                    startLatitude: session.startLatitude,
                    startLongitude: session.startLongitude,
                    totalDistance: session.totalDistance,
                    maxVertical: session.maxVertical,
                    totalRuns: session.totalRuns,
                    maxSpeed: session.maxSpeed,
                    timeOnSlope: session.timeOnSlope,
                })
                await queries.markSessionSynced(this.sessionId)
                console.log('[TrackingSimulator] Session synced to server:', this.sessionId)
            } catch (error) {
                console.log('[TrackingSimulator] Failed to sync session (will retry on login):', error)
            }
        }
    }

    getSessionId(): string | null {
        return this.sessionId
    }

    async processLocation(loc: SimulatedLocation): Promise<{
        activityState: ActivityState
        stats: SessionStats
    } | null> {
        const result = await this.locationProcessor.processLocation(
            loc.latitude,
            loc.longitude,
            loc.altitude,
            loc.speed,
            loc.accuracy,
            loc.timestamp
        )

        if (result) {
            return {
                activityState: result.activityState,
                stats: result.stats,
            }
        }
        return null
    }

    getStats(): SessionStats {
        return this.locationProcessor.getStats()
    }

    async runSimulation(locations: SimulatedLocation[]): Promise<{
        states: ActivityState[]
        finalState: ActivityState
        runCount: number
        stats: SessionStats
    }> {
        const states: ActivityState[] = []

        for (const loc of locations) {
            const result = await this.processLocation(loc)
            if (result) {
                states.push(result.activityState)
            }
        }

        const stats = this.getStats()

        return {
            states,
            finalState: states[states.length - 1] || 'resting',
            runCount: stats.totalRuns,
            stats,
        }
    }

    async testActivityDetection(): Promise<{
        skiingDetected: boolean
        liftingDetected: boolean
        restingDetected: boolean
    }> {
        const skiingLocations = generateSkiingScenario()
        const liftLocations = generateLiftScenario()
        const restingLocations = generateRestingScenario()

        const skiingResult = await this.runSimulation(skiingLocations)
        const liftResult = await this.runSimulation(liftLocations)
        const restingResult = await this.runSimulation(restingLocations)

        return {
            skiingDetected: skiingResult.states.includes('skiing'),
            liftingDetected: liftResult.states.includes('lifting'),
            restingDetected: restingResult.states.includes('resting'),
        }
    }

    async testNoiseFiltering(): Promise<boolean> {
        const noisyLocations = generateNoiseScenario()
        const result = await this.runSimulation(noisyLocations)

        const hasValidStats =
            result.stats.totalDistance < 10000 &&
            result.stats.maxSpeed < 100 &&
            result.stats.maxVertical < 500

        return hasValidStats
    }

    async testRunCounting(): Promise<{ runCount: number; expectedMinRuns: number }> {
        const skiingLocations = generateSkiingScenario()
        const result = await this.runSimulation(skiingLocations)

        return {
            runCount: result.runCount,
            expectedMinRuns: 1,
        }
    }

    reset() {
        this.activityDetector.reset()
        this.locationProcessor.reset()
        this.syncManager.reset()
        this.sessionId = null
        this.userId = null
        this.results = {
            states: [],
            runs: 0,
            locations: [],
            stats: null,
        }
    }
}

export const runAllTests = async (userId: string): Promise<{
    activityDetection: { passed: boolean; details: string }
    noiseFiltering: { passed: boolean; details: string }
    runCounting: { passed: boolean; details: string }
}> => {
    const simulator = new TrackingSimulator()
    await simulator.initialize(userId)

    const activityResult = await simulator.testActivityDetection()
    simulator.reset()
    await simulator.initialize(userId)

    const noiseResult = await simulator.testNoiseFiltering()
    simulator.reset()
    await simulator.initialize(userId)

    const runResult = await simulator.testRunCounting()

    return {
        activityDetection: {
            passed:
                activityResult.skiingDetected &&
                activityResult.liftingDetected &&
                activityResult.restingDetected,
            details: `Skiing: ${activityResult.skiingDetected}, Lifting: ${activityResult.liftingDetected}, Resting: ${activityResult.restingDetected}`,
        },
        noiseFiltering: {
            passed: noiseResult,
            details: noiseResult ? 'Noise filtered correctly' : 'Noise filtering failed',
        },
        runCounting: {
            passed: runResult.runCount >= runResult.expectedMinRuns,
            details: `Runs counted: ${runResult.runCount}, Expected min: ${runResult.expectedMinRuns}`,
        },
    }
}
