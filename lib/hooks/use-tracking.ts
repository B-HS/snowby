import { useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { t } from '@/lib/i18n'
import { useTrackingStore } from '@/lib/tracking/tracking.store'
import { GPS_SIGNAL_CONFIG, RESTING_ALERT_THRESHOLD } from '@/lib/tracking/tracking.config'
import { startBackgroundLocationTracking, stopBackgroundLocationTracking, setLocationCallback } from '@/lib/services/background-location'
import type { GPSSignalLevel } from '@/lib/tracking/tracking.types'

const PREVIEW_TIME_INTERVAL_MS = 2000
const PREVIEW_DISTANCE_INTERVAL_M = 5
const WORST_ACCURACY_METERS = 100

export const getGpsLevelFromAccuracy = (accuracy: number): GPSSignalLevel => {
    if (accuracy < GPS_SIGNAL_CONFIG.excellent.maxAccuracy) return 'excellent'
    if (accuracy < GPS_SIGNAL_CONFIG.good.maxAccuracy) return 'good'
    if (accuracy < GPS_SIGNAL_CONFIG.fair.maxAccuracy) return 'fair'
    if (accuracy < GPS_SIGNAL_CONFIG.poor.maxAccuracy) return 'poor'
    return 'none'
}

type LocationState = {
    latitude: number
    longitude: number
    accuracy: number
    altitude: number | null
    speed: number | null
}

export const useTracking = (userId: string | null) => {
    const watchSubscription = useRef<Location.LocationSubscription | null>(null)
    const previewSubscription = useRef<Location.LocationSubscription | null>(null)
    const restingStartTime = useRef<number | null>(null)
    const restingAlertSent = useRef(false)
    const isMounted = useRef(true)
    const trackingStatusRef = useRef<ReturnType<typeof useTrackingStore.getState>['trackingStatus']>('stop')
    const prevUserIdRef = useRef(userId)

    const [location, setLocation] = useState<LocationState | null>(null)
    const [gpsLevel, setGpsLevel] = useState<GPSSignalLevel>('none')
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [isBackgroundActive, setIsBackgroundActive] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const {
        isInitialized,
        initialize,
        refreshUnfinishedSession,
        trackingStatus,
        trackingData,
        activityState,
        startTracking,
        pauseTracking,
        resumeTracking,
        stopTracking,
        processLocation,
    } = useTrackingStore()

    trackingStatusRef.current = trackingStatus

    const requestPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
            setErrorMsg('Location permission denied')
            return false
        }
        setPermissionGranted(true)
        return true
    }

    const applyLocationToState = (coords: Location.LocationObjectCoords) => {
        if (!isMounted.current) return
        setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? 0,
            altitude: coords.altitude,
            speed: coords.speed,
        })
        setGpsLevel(getGpsLevelFromAccuracy(coords.accuracy ?? WORST_ACCURACY_METERS))
    }

    const processLocationUpdate = async (newLocation: Location.LocationObject) => {
        applyLocationToState(newLocation.coords)
        if (trackingStatusRef.current !== 'start') return

        const { latitude, longitude, accuracy, altitude, speed } = newLocation.coords
        await processLocation(latitude, longitude, altitude, speed ?? 0, accuracy ?? Infinity, newLocation.timestamp)
    }

    const processLocationBatch = async (locations: Location.LocationObject[]) => {
        for (const loc of locations) {
            await processLocationUpdate(loc)
        }
    }

    const updateLocationPreview = (newLocation: Location.LocationObject) => {
        applyLocationToState(newLocation.coords)
    }

    const startGpsPipeline = async () => {
        try {
            if (previewSubscription.current) {
                previewSubscription.current.remove()
                previewSubscription.current = null
            }
            setLocationCallback((locations) => {
                processLocationBatch(locations)
            })
            await startBackgroundLocationTracking()
            setIsBackgroundActive(true)
        } catch (error) {
            setIsBackgroundActive(false)
        }
    }

    const handleStart = async () => {
        const effectiveUserId = userId ?? 'anonymous'

        const hasPermission = permissionGranted || (await requestPermission())
        if (!hasPermission) return

        let startLocation = location
        if (!startLocation) {
            try {
                const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation })
                startLocation = {
                    latitude: currentPosition.coords.latitude,
                    longitude: currentPosition.coords.longitude,
                    accuracy: currentPosition.coords.accuracy ?? 0,
                    altitude: currentPosition.coords.altitude,
                    speed: currentPosition.coords.speed,
                }
                applyLocationToState(currentPosition.coords)
            } catch (error) {
                setErrorMsg('Failed to get current position')
                return
            }
        }

        await startTracking(effectiveUserId, startLocation.latitude, startLocation.longitude)
        await startGpsPipeline()
    }

    const handlePause = () => pauseTracking()

    const handleResume = () => resumeTracking()

    const handleStop = async () => {
        if (watchSubscription.current) {
            watchSubscription.current.remove()
            watchSubscription.current = null
        }

        try {
            await stopBackgroundLocationTracking()
            setLocationCallback(null)
            setIsBackgroundActive(false)
        } catch (error) {
            setErrorMsg('Failed to stop background tracking')
        }

        await stopTracking()

        if (isMounted.current && permissionGranted) {
            previewSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: PREVIEW_TIME_INTERVAL_MS,
                    distanceInterval: PREVIEW_DISTANCE_INTERVAL_M,
                },
                updateLocationPreview,
            )
        }
    }

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    useEffect(() => {
        const effectiveUserId = userId ?? 'anonymous'
        if (!isInitialized) {
            initialize(effectiveUserId)
        } else if (prevUserIdRef.current !== userId) {
            refreshUnfinishedSession(effectiveUserId)
        }
        prevUserIdRef.current = userId
    }, [userId, isInitialized, initialize, refreshUnfinishedSession])

    useEffect(() => {
        if (trackingStatus === 'start' && !isBackgroundActive && permissionGranted) {
            startGpsPipeline()
        }
    }, [trackingStatus, isBackgroundActive, permissionGranted])

    useEffect(() => {
        if (activityState === 'resting') {
            if (restingStartTime.current === null) {
                restingStartTime.current = Date.now()
                restingAlertSent.current = false
            } else if (!restingAlertSent.current && Date.now() - restingStartTime.current > RESTING_ALERT_THRESHOLD) {
                Notifications.scheduleNotificationAsync({
                    content: { title: 'Snowby', body: t('tracking.restingAlert'), data: { action: 'stop_tracking' } },
                    trigger: null,
                })
                restingAlertSent.current = true
            }
        } else {
            restingStartTime.current = null
            restingAlertSent.current = false
        }
    }, [activityState])

    useEffect(() => {
        let cancelled = false

        const initLocation = async () => {
            const hasPermission = await requestPermission()
            if (!hasPermission || cancelled) return

            if (trackingStatusRef.current !== 'start') {
                previewSubscription.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: PREVIEW_TIME_INTERVAL_MS,
                        distanceInterval: PREVIEW_DISTANCE_INTERVAL_M,
                    },
                    updateLocationPreview,
                )
            }
        }

        initLocation()

        return () => {
            cancelled = true
            previewSubscription.current?.remove()
            previewSubscription.current = null
        }
    }, [])

    return {
        isInitialized,
        location,
        gpsLevel,
        permissionGranted,
        isBackgroundActive,
        errorMsg,
        trackingStatus,
        trackingData,
        activityState,
        handleStart,
        handlePause,
        handleResume,
        handleStop,
    }
}
