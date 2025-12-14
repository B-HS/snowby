import { DETECTION_CONFIG, NOISE_FILTER_CONFIG, VALID_RUN_CONFIG } from './tracking.config'
import type { ActivityState, LocationPoint, CurrentRunData } from './tracking.types'

type StateChangeCallback = (newState: ActivityState, prevState: ActivityState) => void
type RunCompleteCallback = (runData: CurrentRunData) => void

export class ActivityDetector {
    private currentState: ActivityState = 'resting'
    private pendingState: ActivityState | null = null
    private pendingStateStartTime: number = 0
    private stateChangeCallback: StateChangeCallback | null = null
    private runCompleteCallback: RunCompleteCallback | null = null

    private recentAltitudes: number[] = []
    private recentSpeeds: number[] = []

    private currentRun: CurrentRunData | null = null
    private lastAltitude: number | null = null

    setStateChangeCallback(callback: StateChangeCallback) {
        this.stateChangeCallback = callback
    }

    setRunCompleteCallback(callback: RunCompleteCallback) {
        this.runCompleteCallback = callback
    }

    getCurrentState(): ActivityState {
        return this.currentState
    }

    getCurrentRun(): CurrentRunData | null {
        return this.currentRun
    }

    reset() {
        this.currentState = 'resting'
        this.pendingState = null
        this.pendingStateStartTime = 0
        this.recentAltitudes = []
        this.recentSpeeds = []
        this.currentRun = null
        this.lastAltitude = null
    }

    processLocation(location: LocationPoint): ActivityState {
        const { altitude, speed, timestamp } = location
        const speedKmh = speed * 3.6

        this.updateSmoothingBuffers(altitude, speedKmh)

        const smoothedSpeed = this.getSmoothedSpeed()
        const altitudeChange = this.getAltitudeChange()

        const detectedState = this.detectState(smoothedSpeed, altitudeChange)

        if (detectedState !== this.currentState) {
            if (this.pendingState !== detectedState) {
                this.pendingState = detectedState
                this.pendingStateStartTime = timestamp
                console.log(`[ActivityDetector] New pending state: ${detectedState} (current: ${this.currentState})`)
            } else {
                const elapsed = (timestamp - this.pendingStateStartTime) / 1000
                console.log(`[ActivityDetector] Pending ${detectedState} for ${elapsed.toFixed(1)}s (need ${NOISE_FILTER_CONFIG.stateChangeDelay}s)`)
                if (elapsed >= NOISE_FILTER_CONFIG.stateChangeDelay) {
                    console.log(`[ActivityDetector] Transitioning: ${this.currentState} -> ${detectedState}`)
                    this.transitionState(detectedState, location)
                }
            }
        } else {
            this.pendingState = null
            this.pendingStateStartTime = 0
        }

        if (this.currentState === 'skiing' && this.currentRun) {
            this.updateCurrentRun(location)
        }

        this.lastAltitude = altitude

        return this.currentState
    }

    private updateSmoothingBuffers(altitude: number, speedKmh: number) {
        this.recentAltitudes.push(altitude)
        if (this.recentAltitudes.length > NOISE_FILTER_CONFIG.altitudeSmoothingWindow) {
            this.recentAltitudes.shift()
        }

        this.recentSpeeds.push(speedKmh)
        if (this.recentSpeeds.length > NOISE_FILTER_CONFIG.speedSmoothingWindow) {
            this.recentSpeeds.shift()
        }
    }

    private getSmoothedSpeed(): number {
        if (this.recentSpeeds.length === 0) return 0
        return this.recentSpeeds.reduce((a, b) => a + b, 0) / this.recentSpeeds.length
    }

    private getAltitudeChange(): number {
        if (this.recentAltitudes.length < 2) return 0
        return this.recentAltitudes[this.recentAltitudes.length - 1] - this.recentAltitudes[0]
    }

    private detectState(speed: number, altitudeChange: number): ActivityState {
        console.log(`[ActivityDetector] speed: ${speed.toFixed(1)}km/h, altChange: ${altitudeChange.toFixed(1)}m`)

        if (
            altitudeChange < -DETECTION_CONFIG.skiing.minAltitudeDrop &&
            speed > DETECTION_CONFIG.skiing.minSpeed
        ) {
            return 'skiing'
        }

        if (speed > DETECTION_CONFIG.skiing.minSpeed * 3) {
            return 'skiing'
        }

        if (
            altitudeChange > DETECTION_CONFIG.lifting.minAltitudeGain &&
            speed >= DETECTION_CONFIG.lifting.minSpeed &&
            speed <= DETECTION_CONFIG.lifting.maxSpeed
        ) {
            return 'lifting'
        }

        if (speed < DETECTION_CONFIG.resting.maxSpeed) {
            return 'resting'
        }

        if (speed >= DETECTION_CONFIG.lifting.minSpeed && speed <= DETECTION_CONFIG.lifting.maxSpeed) {
            return 'lifting'
        }

        return this.currentState
    }

    private transitionState(newState: ActivityState, location: LocationPoint) {
        const prevState = this.currentState

        if (prevState === 'skiing' && (newState === 'lifting' || newState === 'resting')) {
            this.completeRun(location)
        }

        if (newState === 'skiing' && prevState !== 'skiing') {
            this.startRun(location)
        }

        this.currentState = newState
        this.pendingState = null
        this.pendingStateStartTime = 0

        if (this.stateChangeCallback) {
            this.stateChangeCallback(newState, prevState)
        }
    }

    private startRun(location: LocationPoint) {
        this.currentRun = {
            startTime: location.timestamp,
            startAltitude: location.altitude,
            startLatitude: location.latitude,
            startLongitude: location.longitude,
            distance: 0,
            maxSpeed: location.speed * 3.6,
            totalSpeed: location.speed * 3.6,
            speedCount: 1,
        }
    }

    private updateCurrentRun(location: LocationPoint) {
        if (!this.currentRun) return

        const speedKmh = location.speed * 3.6
        this.currentRun.maxSpeed = Math.max(this.currentRun.maxSpeed, speedKmh)
        this.currentRun.totalSpeed += speedKmh
        this.currentRun.speedCount++
    }

    addDistanceToCurrentRun(distance: number) {
        if (this.currentRun) {
            this.currentRun.distance += distance
        }
    }

    private completeRun(location: LocationPoint) {
        if (!this.currentRun) return

        const duration = (location.timestamp - this.currentRun.startTime) / 1000
        const verticalDrop = this.currentRun.startAltitude - location.altitude

        const isValidRun =
            this.currentRun.distance >= VALID_RUN_CONFIG.minDistance &&
            verticalDrop >= VALID_RUN_CONFIG.minVerticalDrop &&
            duration >= VALID_RUN_CONFIG.minDuration

        if (isValidRun && this.runCompleteCallback) {
            this.runCompleteCallback(this.currentRun)
        }

        this.currentRun = null
    }
}

export const activityDetector = new ActivityDetector()
