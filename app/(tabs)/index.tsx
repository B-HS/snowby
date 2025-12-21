import { RecoveryModal } from '@/components/tracking/recovery-modal'
import { TrackingControls } from '@/components/tracking/tracking-controls'
import { TrackingStats } from '@/components/tracking/tracking-stats'
import { MapView, MapViewRef } from '@/components/map/map-view'
import { userKeys } from '@/entities/users/users.query'
import { useCrashRecovery } from '@/lib/hooks/use-crash-recovery'
import { useTracking } from '@/lib/hooks/use-tracking'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { GPS_SIGNAL_LEVELS } from '@/lib/constant'
import { getCameraPositionForResort } from '@/lib/utils/resort-matcher'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'expo-router'
import { useCallback, useEffect, useRef } from 'react'
import { View } from 'react-native'

const SAMPLE_SEGMENTS: [number, number][][] = [
    [
        [127.0276, 37.4979],
        [127.028, 37.4985],
        [127.0285, 37.499],
        [127.029, 37.4988],
        [127.0295, 37.4992],
        [127.03, 37.4998],
    ],
]

const DEFAULT_CAMERA = {
    coordinates: {
        latitude: 37.4979,
        longitude: 127.0276,
    },
    zoom: 14,
}

const Home = () => {
    const { t } = useTranslation()
    const mapRef = useRef<MapViewRef>(null)
    const queryClient = useQueryClient()
    const { user } = useAppStore()
    const userId = user?.id ?? null

    const { location, gpsLevel, trackingStatus, trackingData, activityState, handleStart, handlePause, handleResume, handleStop } =
        useTracking(userId)

    const { showRecoveryModal, unfinishedSession, handleRecovery, dismissRecovery } = useCrashRecovery(userId)

    useEffect(() => {
        if (location && mapRef.current) {
            mapRef.current.setCameraPosition(
                getCameraPositionForResort(location.latitude, location.longitude)
            )
        }
    }, [location])

    const invalidateTrackingData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['activities'] })
        queryClient.invalidateQueries({ queryKey: ['ranking'] })
        if (userId) {
            queryClient.invalidateQueries({ queryKey: userKeys.summary(userId) })
        }
    }, [queryClient, userId])

    const handleStopWithRefetch = useCallback(async () => {
        await handleStop()
        invalidateTrackingData()
    }, [handleStop, invalidateTrackingData])

    const segments = trackingData.segments.length > 0 ? trackingData.segments : SAMPLE_SEGMENTS
    const validSegments = segments.filter((seg) => seg.length >= 2)

    const polylinePoints = validSegments.flatMap((segment) =>
        segment.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
    )

    const cameraPosition = location
        ? getCameraPositionForResort(location.latitude, location.longitude)
        : DEFAULT_CAMERA

    const polylines = polylinePoints.length >= 2
        ? [{ points: polylinePoints, color: 'rgba(59, 130, 246, 0.8)', width: 4 }]
        : []

    const gpsColor = GPS_SIGNAL_LEVELS[gpsLevel].color
    const circles = location
        ? [{
              center: { latitude: location.latitude, longitude: location.longitude },
              radius: location.accuracy,
              fillColor: `${gpsColor}33`,
              strokeColor: gpsColor,
              strokeWidth: 1,
          }]
        : []

    const markers = location
        ? [{ coordinates: { latitude: location.latitude, longitude: location.longitude }, id: 'current-location' }]
        : []

    return (
        <View className='flex-1 pt-2'>
            <TrackingStats gpsLevel={gpsLevel} trackingStatus={trackingStatus} trackingData={trackingData} activityState={activityState} currentLocation={location} />

            <View className='h-1/2'>
                {__DEV__ && (
                    <View className='flex-row justify-end items-center px-4 py-2'>
                        <Link href='/test' className='text-xs text-blue-500'>
                            {t('test.title')}
                        </Link>
                    </View>
                )}
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    cameraPosition={cameraPosition}
                    polylines={polylines}
                    circles={circles}
                    markers={markers}
                />
            </View>

            <TrackingControls
                trackingStatus={trackingStatus}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStopWithRefetch}
            />

            <RecoveryModal visible={showRecoveryModal} sessionInfo={unfinishedSession} onSelect={handleRecovery} onDismiss={dismissRecovery} />
        </View>
    )
}

export default Home
