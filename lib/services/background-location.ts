import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'

export const BACKGROUND_LOCATION_TASK = 'background-location-task'

type LocationCallback = (locations: Location.LocationObject[]) => void

let locationCallback: LocationCallback | null = null

export const setLocationCallback = (callback: LocationCallback | null) => {
    locationCallback = callback
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Background location error:', error)
        return
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] }
        if (locationCallback && locations.length > 0) {
            locationCallback(locations)
        }
    }
})

export const startBackgroundLocationTracking = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync()
    if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted')
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync()
    if (backgroundStatus !== 'granted') {
        throw new Error('Background location permission not granted')
    }

    const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)
    if (!isTaskDefined) {
        throw new Error('Background location task is not defined')
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    if (hasStarted) {
        return
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
        foregroundService: {
            notificationTitle: 'Snowby',
            notificationBody: 'Tracking your ski/snowboard activity',
            notificationColor: '#3b82f6',
        },
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
    })
}

export const stopBackgroundLocationTracking = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    }
}

export const isBackgroundLocationTrackingActive = async () => {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
}
