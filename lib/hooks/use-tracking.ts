import { useCallback, useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { t } from '@/lib/i18n'
import { useTrackingStore } from '@/lib/tracking/tracking.store'
import { GPS_SIGNAL_CONFIG, RESTING_ALERT_THRESHOLD } from '@/lib/tracking/tracking.config'
import {
    startBackgroundLocationTracking,
    stopBackgroundLocationTracking,
    setLocationCallback,
} from '@/lib/services/background-location'
import type { GPSSignalLevel } from '@/lib/tracking/tracking.types'

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
    const {
        isInitialized,
        initialize,
        trackingStatus,
        trackingData,
        activityState,
        startTracking,
        pauseTracking,
        resumeTracking,
        stopTracking,
        processLocation,
    } = useTrackingStore()

    const [location, setLocation] = useState<LocationState | null>(null)
    const [gpsLevel, setGpsLevel] = useState<GPSSignalLevel>('none')
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [isBackgroundActive, setIsBackgroundActive] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const watchSubscription = useRef<Location.LocationSubscription | null>(null)
    const restingStartTime = useRef<number | null>(null)
    const restingAlertSent = useRef(false)

    useEffect(() => {
        const effectiveUserId = userId ?? 'anonymous'
        if (!isInitialized) {
            initialize(effectiveUserId)
        }
    }, [userId, isInitialized, initialize])

    const requestPermission = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
            setErrorMsg('Location permission denied')
            return false
        }
        setPermissionGranted(true)
        return true
    }, [])

    const trackingStatusRef = useRef(trackingStatus)
    trackingStatusRef.current = trackingStatus

    const processLocationUpdate = useCallback(
        async (newLocation: Location.LocationObject) => {
            const { latitude, longitude, accuracy, altitude, speed } = newLocation.coords

            setLocation({
                latitude,
                longitude,
                accuracy: accuracy ?? 0,
                altitude,
                speed,
            })

            setGpsLevel(getGpsLevelFromAccuracy(accuracy ?? 100))

            if (trackingStatusRef.current === 'start') {
                console.log(`[useTracking] Processing location: speed=${((speed ?? 0) * 3.6).toFixed(1)}km/h, accuracy=${accuracy?.toFixed(0)}m`)
                await processLocation(
                    latitude,
                    longitude,
                    altitude ?? 0,
                    speed ?? 0,
                    accuracy ?? 0,
                    Date.now()
                )
            }
        },
        [processLocation]
    )

    useEffect(() => {
        if (activityState === 'resting') {
            if (restingStartTime.current === null) {
                restingStartTime.current = Date.now()
                restingAlertSent.current = false
            } else if (
                !restingAlertSent.current &&
                Date.now() - restingStartTime.current > RESTING_ALERT_THRESHOLD
            ) {
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Snowby',
                        body: t('tracking.restingAlert'),
                        data: { action: 'stop_tracking' },
                    },
                    trigger: null,
                })
                restingAlertSent.current = true
            }
        } else {
            restingStartTime.current = null
            restingAlertSent.current = false
        }
    }, [activityState])

    const handleStart = useCallback(async () => {
        console.log('[Tracking] handleStart called')
        const effectiveUserId = userId ?? 'anonymous'

        const hasPermission = permissionGranted || (await requestPermission())
        if (!hasPermission) {
            console.log('[Tracking] permission not granted')
            return
        }
        console.log('[Tracking] permission granted')

        let startLocation = location
        if (!startLocation) {
            console.log('[Tracking] getting current position...')
            try {
                const currentPosition = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                })
                startLocation = {
                    latitude: currentPosition.coords.latitude,
                    longitude: currentPosition.coords.longitude,
                    accuracy: currentPosition.coords.accuracy ?? 0,
                    altitude: currentPosition.coords.altitude,
                    speed: currentPosition.coords.speed,
                }
                setLocation(startLocation)
                setGpsLevel(getGpsLevelFromAccuracy(startLocation.accuracy))
                console.log('[Tracking] got position:', startLocation.latitude, startLocation.longitude)
            } catch (error) {
                console.log('[Tracking] failed to get current position', error)
                return
            }
        }

        try {
            setLocationCallback((locations) => {
                locations.forEach(processLocationUpdate)
            })
            await startBackgroundLocationTracking()
            setIsBackgroundActive(true)
            console.log('[Tracking] background tracking started')
        } catch (error) {
            console.log('[Tracking] Background tracking not available:', error)
            setIsBackgroundActive(false)
        }

        try {
            console.log('[Tracking] starting tracking...')
            await startTracking(effectiveUserId, startLocation.latitude, startLocation.longitude)
            console.log('[Tracking] tracking started successfully')

            watchSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
                processLocationUpdate
            )
            console.log('[Tracking] watch position started')
        } catch (error) {
            console.error('[Tracking] Error starting tracking:', error)
        }
    }, [
        userId,
        permissionGranted,
        requestPermission,
        location,
        startTracking,
        processLocationUpdate,
    ])

    const handlePause = useCallback(() => {
        pauseTracking()
    }, [pauseTracking])

    const handleResume = useCallback(() => {
        resumeTracking()
    }, [resumeTracking])

    const handleStop = useCallback(async () => {
        if (watchSubscription.current) {
            watchSubscription.current.remove()
            watchSubscription.current = null
        }

        try {
            await stopBackgroundLocationTracking()
            setLocationCallback(null)
            setIsBackgroundActive(false)
        } catch (error) {
            console.log('Error stopping background tracking:', error)
        }

        await stopTracking()
    }, [stopTracking])

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null

        const initLocation = async () => {
            const hasPermission = await requestPermission()
            if (!hasPermission) return

            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
                (newLocation) => {
                    const { latitude, longitude, accuracy, altitude, speed } = newLocation.coords
                    setLocation({
                        latitude,
                        longitude,
                        accuracy: accuracy ?? 0,
                        altitude,
                        speed,
                    })
                    setGpsLevel(getGpsLevelFromAccuracy(accuracy ?? 100))
                }
            )
        }

        initLocation()

        return () => {
            locationSubscription?.remove()
        }
    }, [requestPermission])

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
