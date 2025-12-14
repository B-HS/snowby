export const GPS_SIGNAL_CONFIG = {
    excellent: { maxAccuracy: 5, bars: 4, color: '#22c55e' },
    good: { maxAccuracy: 10, bars: 3, color: '#84cc16' },
    fair: { maxAccuracy: 20, bars: 2, color: '#eab308' },
    poor: { maxAccuracy: 50, bars: 1, color: '#f97316' },
    none: { maxAccuracy: Infinity, bars: 0, color: '#ef4444' },
} as const

export const DETECTION_CONFIG = {
    skiing: {
        minSpeed: 5,
        minAltitudeDrop: 5,
    },
    lifting: {
        minSpeed: 2,
        maxSpeed: 15,
        minAltitudeGain: 5,
    },
    resting: {
        maxSpeed: 1,
        maxAltitudeChange: 2,
    },
} as const

export const VALID_RUN_CONFIG = {
    minDistance: 100,
    minVerticalDrop: 20,
    minDuration: 10,
} as const

export const NOISE_FILTER_CONFIG = {
    minAccuracy: 50,
    speedSmoothingWindow: 3,
    altitudeSmoothingWindow: 5,
    stateChangeDelay: 3,
} as const

export const LOCATION_CONFIG = {
    timeInterval: 1000,
    distanceInterval: 1,
} as const

export const SYNC_CONFIG = {
    interval: 60000,
    batchSize: 100,
    retryDelay: 5000,
    maxRetries: 3,
} as const

export const RESTING_ALERT_THRESHOLD = 30 * 60 * 1000

export const BACKGROUND_TASK_NAME = 'snowby-location-tracking'
