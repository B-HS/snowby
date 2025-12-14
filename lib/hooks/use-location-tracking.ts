import { GPS_SIGNAL_LEVELS } from '@/lib/constant'
import {
    setLocationCallback,
    startBackgroundLocationTracking,
    stopBackgroundLocationTracking,
} from '@/lib/services/background-location'
import { useAppStore } from '@/lib/store'
import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'

type GpsLevel = keyof typeof GPS_SIGNAL_LEVELS

interface LocationState {
    latitude: number
    longitude: number
    accuracy: number
    altitude: number | null
    speed: number | null
}

export const getGpsLevelFromAccuracy = (accuracy: number): GpsLevel => {
    if (accuracy < 5) return 'excellent'
    if (accuracy < 10) return 'good'
    if (accuracy < 20) return 'fair'
    if (accuracy < 50) return 'poor'
    return 'none'
}

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export const useLocationTracking = () => {
    const { trackingStatus, updateTrackingData } = useAppStore()
    const [location, setLocation] = useState<LocationState | null>(null)
    const [gpsLevel, setGpsLevel] = useState<GpsLevel>('none')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [isBackgroundActive, setIsBackgroundActive] = useState(false)

    const watchSubscription = useRef<Location.LocationSubscription | null>(null)
    const lastAltitude = useRef<number | null>(null)
    const totalVertical = useRef(0)

    const processLocationUpdate = useCallback(
        (newLocation: Location.LocationObject) => {
            const { latitude, longitude, accuracy, altitude, speed } = newLocation.coords

            setLocation({
                latitude,
                longitude,
                accuracy: accuracy ?? 0,
                altitude,
                speed,
            })

            setGpsLevel(getGpsLevelFromAccuracy(accuracy ?? 100))

            const currentTrackingStatus = useAppStore.getState().trackingStatus
            const currentTrackingData = useAppStore.getState().trackingData

            if (currentTrackingStatus === 'start') {
                const currentLocations = currentTrackingData.locations
                const newLocations: [number, number][] = [...currentLocations, [longitude, latitude]]

                let newDistance = currentTrackingData.totalDistance
                if (currentLocations.length > 0) {
                    const lastLoc = currentLocations[currentLocations.length - 1]
                    newDistance += calculateDistance(lastLoc[1], lastLoc[0], latitude, longitude)
                }

                if (altitude !== null && lastAltitude.current !== null) {
                    const verticalChange = altitude - lastAltitude.current
                    if (verticalChange < 0) {
                        totalVertical.current += Math.abs(verticalChange)
                    }
                }
                lastAltitude.current = altitude

                const newMaxSpeed = Math.max(currentTrackingData.maxSpeed, (speed ?? 0) * 3.6)

                updateTrackingData({
                    currentLatitude: latitude,
                    currentLongitude: longitude,
                    locations: newLocations,
                    totalDistance: newDistance,
                    maxVertical: totalVertical.current,
                    maxSpeed: newMaxSpeed,
                    ...(currentLocations.length === 0 && {
                        startLatitude: latitude,
                        startLongitude: longitude,
                    }),
                })
            }
        },
        [updateTrackingData]
    )

    const requestPermission = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
            setErrorMsg('Location permission denied')
            return false
        }
        setPermissionGranted(true)
        return true
    }, [])

    const startTracking = useCallback(async () => {
        const hasPermission = permissionGranted || (await requestPermission())
        if (!hasPermission) return

        const currentTrackingData = useAppStore.getState().trackingData
        if (!currentTrackingData.startTime) {
            updateTrackingData({ startTime: Date.now() })
        }
        lastAltitude.current = null
        totalVertical.current = 0

        try {
            setLocationCallback((locations) => {
                locations.forEach(processLocationUpdate)
            })
            await startBackgroundLocationTracking()
            setIsBackgroundActive(true)
        } catch (error) {
            console.log('Background tracking not available, using foreground only:', error)
            setIsBackgroundActive(false)
        }

        watchSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 1,
            },
            processLocationUpdate
        )
    }, [permissionGranted, requestPermission, processLocationUpdate])

    const stopTracking = useCallback(async () => {
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
    }, [])

    useEffect(() => {
        if (trackingStatus === 'start') {
            startTracking()
        } else if (trackingStatus === 'pause') {
            stopTracking()
        } else if (trackingStatus === 'stop') {
            stopTracking()
        }

        return () => {
            stopTracking()
        }
    }, [trackingStatus, startTracking, stopTracking])

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
        location,
        gpsLevel,
        errorMsg,
        permissionGranted,
        isBackgroundActive,
        requestPermission,
    }
}
