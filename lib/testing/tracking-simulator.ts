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

export const generateFullDayScenario = (): SimulatedLocation[] => {
    const locations: SimulatedLocation[] = []
    const startTime = Date.now()
    let currentTime = startTime
    let currentAltitude = 1500
    let currentLat = 36.0
    let currentLng = 128.0

    const addLift = (duration: number) => {
        for (let i = 0; i < duration; i++) {
            currentAltitude += 4
            currentLat += 0.00002
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
        for (let i = 0; i < duration; i++) {
            currentAltitude -= altDrop
            currentLat += 0.0001
            currentLng += (Math.random() - 0.5) * 0.00005
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
    addSkiRun(45, 12, 350)
    addLift(100)
    addSkiRun(60, 15, 400)
    addResting(30)
    addLift(80)
    addSkiRun(50, 18, 320)
    addLift(95)
    addSkiRun(55, 14, 380)
    addResting(20)
    addLift(85)
    addSkiRun(40, 20, 340)

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
    private results: {
        states: ActivityState[]
        runs: number
        locations: LocationPoint[]
        stats: SessionStats | null
    }

    constructor() {
        this.activityDetector = new ActivityDetector()
        this.locationProcessor = new LocationProcessor()
        this.results = {
            states: [],
            runs: 0,
            locations: [],
            stats: null,
        }
    }

    async initialize(userId: string): Promise<string> {
        await initializeDatabase()

        const startTime = Date.now()
        const session = await queries.createSession(userId, startTime, 36.0, 128.0)

        this.locationProcessor.reset()
        this.locationProcessor.setSessionId(session.id)
        this.locationProcessor.setupRunCompleteHandler()

        return session.id
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
