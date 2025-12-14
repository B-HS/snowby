import { AccuracyCircle } from '@/components/tracking/accuracy-circle'
import { RecoveryModal } from '@/components/tracking/recovery-modal'
import { TrackingControls } from '@/components/tracking/tracking-controls'
import { TrackingStats } from '@/components/tracking/tracking-stats'
import { Text } from '@/components/ui/text'
import { userKeys } from '@/entities/users/users.query'
import { useCrashRecovery } from '@/lib/hooks/use-crash-recovery'
import { useTracking } from '@/lib/hooks/use-tracking'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { Camera, CameraRef, LineLayer, MapView, ShapeSource } from '@maplibre/maplibre-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
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

const MAP_STYLES = {
    openfreemap: 'https://tiles.openfreemap.org/styles/liberty',
    fallback: 'https://demotiles.maplibre.org/style.json',
}

const Home = () => {
    const { t } = useTranslation()
    const cameraRef = useRef<CameraRef>(null)
    const queryClient = useQueryClient()
    const { user } = useAppStore()
    const userId = user?.id ?? null

    const { location, gpsLevel, trackingStatus, trackingData, activityState, handleStart, handlePause, handleResume, handleStop } =
        useTracking(userId)

    const { showRecoveryModal, unfinishedSession, handleRecovery, dismissRecovery } = useCrashRecovery(userId)

    const [scale] = useState(14)
    const [mapStyle, setMapStyle] = useState(MAP_STYLES.openfreemap)

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

    const handleMapLoadError = useCallback(() => {
        if (mapStyle === MAP_STYLES.openfreemap) {
            setMapStyle(MAP_STYLES.fallback)
        }
    }, [mapStyle])

    const segments = trackingData.segments.length > 0 ? trackingData.segments : SAMPLE_SEGMENTS
    const validSegments = segments.filter((seg) => seg.length >= 2)

    const routeGeoJSON: GeoJSON.Feature<GeoJSON.MultiLineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'MultiLineString',
            coordinates:
                validSegments.length > 0
                    ? validSegments
                    : [
                          [
                              [127.0276, 37.4979],
                              [127.028, 37.4985],
                          ],
                      ],
        },
    }

    const lastSegment = segments[segments.length - 1]
    const lastPoint = lastSegment?.[lastSegment.length - 1]

    const centerCoordinate = location ? [location.longitude, location.latitude] : lastPoint ? lastPoint : [127.0276, 37.4979]

    return (
        <View className='flex-1 pt-2'>
            <TrackingStats gpsLevel={gpsLevel} trackingStatus={trackingStatus} trackingData={trackingData} activityState={activityState} />

            <View className='h-1/2'>
                {__DEV__ && (
                    <View className='flex-row justify-between px-4 py-1'>
                        <Text className='text-xs text-gray-500'>
                            {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : '--'}
                        </Text>
                        <Text className='text-xs text-gray-500'>{location ? `${((location.speed ?? 0) * 3.6).toFixed(1)}km/h` : '--'}</Text>
                        <Text className='text-xs text-gray-500'>{location ? `${(location.altitude ?? 0).toFixed(0)}m` : '--'}</Text>
                        <Link href='/test' className='text-xs text-blue-500'>
                            {t('test.title')}
                        </Link>
                    </View>
                )}
                <MapView
                    style={{ flex: 1 }}
                    mapStyle={mapStyle}
                    logoEnabled={false}
                    attributionEnabled={false}
                    onDidFailLoadingMap={handleMapLoadError}>
                    <Camera
                        ref={cameraRef}
                        centerCoordinate={centerCoordinate as [number, number]}
                        zoomLevel={scale}
                        animationMode='easeTo'
                        animationDuration={500}
                    />
                    {validSegments.length > 0 && (
                        <ShapeSource id='route-source' shape={routeGeoJSON} lineMetrics>
                            <LineLayer
                                id='route-layer'
                                style={{
                                    lineColor: 'rgba(59, 130, 246, 0.8)',
                                    lineWidth: 4,
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                }}
                            />
                        </ShapeSource>
                    )}
                    {location && (
                        <AccuracyCircle
                            latitude={location.latitude}
                            longitude={location.longitude}
                            accuracy={location.accuracy}
                            gpsLevel={gpsLevel}
                        />
                    )}
                </MapView>
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
