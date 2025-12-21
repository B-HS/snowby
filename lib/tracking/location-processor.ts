import { NOISE_FILTER_CONFIG } from './tracking.config'
import type { LocationPoint, ActivityState, SessionStats, CurrentRunData } from './tracking.types'
import * as queries from '@/lib/database/queries'
import { activityDetector } from './activity-detector'

type LocationUpdateCallback = (stats: SessionStats, activityState: ActivityState) => void
type RunCompleteCallback = (runData: {
    startTime: number
    endTime: number
    startAltitude: number
    endAltitude: number
    distance: number
    verticalDrop: number
    maxSpeed: number
    avgSpeed: number
    duration: number
}) => void

export class LocationProcessor {
    private sessionId: string | null = null
    private segmentIndex: number = 0
    private lastLocation: LocationPoint | null = null
    private totalDistance: number = 0
    private maxVertical: number = 0
    private totalRuns: number = 0
    private maxSpeed: number = 0
    private skiingStartTime: number | null = null
    private totalSkiingTime: number = 0
    private cumulativeVerticalDrop: number = 0
    private highestAltitude: number | null = null

    private locationUpdateCallback: LocationUpdateCallback | null = null
    private runCompleteCallback: RunCompleteCallback | null = null

    setSessionId = (sessionId: string) => {
        this.sessionId = sessionId
    }

    setSegmentIndex = (index: number) => {
        this.segmentIndex = index
    }

    getSegmentIndex = () => {
        return this.segmentIndex
    }

    incrementSegmentIndex = () => {
        this.segmentIndex++
    }

    setLocationUpdateCallback = (callback: LocationUpdateCallback) => {
        this.locationUpdateCallback = callback
    }

    setRunCompleteCallback = (callback: RunCompleteCallback) => {
        this.runCompleteCallback = callback
    }

    reset = () => {
        this.sessionId = null
        this.segmentIndex = 0
        this.lastLocation = null
        this.totalDistance = 0
        this.maxVertical = 0
        this.totalRuns = 1
        this.maxSpeed = 0
        this.skiingStartTime = null
        this.totalSkiingTime = 0
        this.cumulativeVerticalDrop = 0
        this.highestAltitude = null
        activityDetector.reset()
    }

    restoreState = (stats: SessionStats, lastLocation: LocationPoint | null) => {
        this.totalDistance = stats.totalDistance
        this.maxVertical = stats.maxVertical
        this.totalRuns = stats.totalRuns
        this.maxSpeed = stats.maxSpeed
        this.totalSkiingTime = stats.timeOnSlope
        this.lastLocation = lastLocation
        if (lastLocation) {
            this.highestAltitude = lastLocation.altitude
        }
    }

    processLocation = async (
        latitude: number,
        longitude: number,
        altitude: number,
        speed: number,
        accuracy: number,
        timestamp: number
    ): Promise<{ locationId: number; stats: SessionStats; activityState: ActivityState } | null> => {
        if (!this.sessionId) {
            console.log('[LocationProcessor] No sessionId, skipping')
            return null
        }

        console.log(`[LocationProcessor] Processing: speed=${(speed * 3.6).toFixed(1)}km/h, accuracy=${accuracy.toFixed(0)}m, alt=${altitude.toFixed(0)}m`)

        if (accuracy > NOISE_FILTER_CONFIG.minAccuracy) {
            console.log(`[LocationProcessor] Accuracy too low (${accuracy}m > ${NOISE_FILTER_CONFIG.minAccuracy}m), skipping`)
            return null
        }

        const activityState = activityDetector.processLocation({
            id: 0,
            sessionId: this.sessionId,
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            timestamp,
            activityState: activityDetector.getCurrentState(),
            segmentIndex: this.segmentIndex,
            isSynced: 0,
        })

        const locationId = await queries.saveLocation(
            this.sessionId,
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            timestamp,
            activityState,
            this.segmentIndex
        )

        if (this.lastLocation) {
            const distance = this.calculateDistance(
                this.lastLocation.latitude,
                this.lastLocation.longitude,
                latitude,
                longitude
            )

            this.totalDistance += distance

            activityDetector.addDistanceToCurrentRun(distance)
        }

        const speedKmh = speed * 3.6
        if (speedKmh > this.maxSpeed) {
            this.maxSpeed = speedKmh
        }

        if (this.highestAltitude === null || altitude > this.highestAltitude) {
            this.highestAltitude = altitude
        }

        const currentVerticalDrop = this.highestAltitude - altitude
        if (currentVerticalDrop > this.maxVertical) {
            this.maxVertical = currentVerticalDrop
        }

        if (activityState === 'skiing') {
            if (this.skiingStartTime === null) {
                this.skiingStartTime = timestamp
            }
        } else {
            if (this.skiingStartTime !== null) {
                this.totalSkiingTime += (timestamp - this.skiingStartTime) / 1000
                this.skiingStartTime = null
            }
        }

        this.lastLocation = {
            id: locationId,
            sessionId: this.sessionId,
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            timestamp,
            activityState,
            segmentIndex: this.segmentIndex,
            isSynced: 0,
        }

        const stats = this.getStats()

        if (this.locationUpdateCallback) {
            this.locationUpdateCallback(stats, activityState)
        }

        return { locationId, stats, activityState }
    }

    getStats = (): SessionStats => {
        let timeOnSlope = this.totalSkiingTime
        if (this.skiingStartTime !== null) {
            timeOnSlope += (Date.now() - this.skiingStartTime) / 1000
        }

        return {
            totalDistance: this.totalDistance,
            maxVertical: this.maxVertical,
            totalRuns: this.totalRuns,
            maxSpeed: this.maxSpeed,
            timeOnSlope: Math.floor(timeOnSlope),
        }
    }

    incrementRunCount = () => {
        this.totalRuns++
    }

    private calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371000
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLon = ((lon2 - lon1) * Math.PI) / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    setupRunCompleteHandler = () => {
        activityDetector.setRunCompleteCallback(async (runData: CurrentRunData) => {
            if (!this.sessionId) return

            const endTime = Date.now()
            const endLocation = this.lastLocation
            if (!endLocation) return

            const duration = (endTime - runData.startTime) / 1000
            const verticalDrop = runData.startAltitude - endLocation.altitude
            const avgSpeed =
                runData.speedCount > 0 ? runData.totalSpeed / runData.speedCount : 0

            await queries.saveRun(
                this.sessionId,
                runData.startTime,
                endTime,
                runData.startAltitude,
                endLocation.altitude,
                runData.distance,
                verticalDrop,
                runData.maxSpeed,
                avgSpeed,
                duration
            )

            this.totalRuns++

            if (this.runCompleteCallback) {
                this.runCompleteCallback({
                    startTime: runData.startTime,
                    endTime,
                    startAltitude: runData.startAltitude,
                    endAltitude: endLocation.altitude,
                    distance: runData.distance,
                    verticalDrop,
                    maxSpeed: runData.maxSpeed,
                    avgSpeed,
                    duration,
                })
            }
        })
    }
}

export const locationProcessor = new LocationProcessor()
