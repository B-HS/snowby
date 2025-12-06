import { AccuracyCircle } from '@/components/tracking/accuracy-circle'
import { TrackingControls } from '@/components/tracking/tracking-controls'
import { TrackingStats } from '@/components/tracking/tracking-stats'
import { useLocationTracking } from '@/lib/hooks/use-location-tracking'
import { useAppStore } from '@/lib/store'
import { Camera, CameraRef, LineLayer, MapView, ShapeSource } from '@maplibre/maplibre-react-native'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { View } from 'react-native'

const SAMPLE_LOCATIONS: [number, number][] = [
    [127.0276, 37.4979],
    [127.028, 37.4985],
    [127.0285, 37.499],
    [127.029, 37.4988],
    [127.0295, 37.4992],
    [127.03, 37.4998],
]

const Home = () => {
    const router = useRouter()
    const cameraRef = useRef<CameraRef>(null)
    const { trackingData } = useAppStore()
    const { location, gpsLevel } = useLocationTracking()
    const [scale] = useState(15)

    const locations = trackingData.locations.length > 0 ? trackingData.locations : SAMPLE_LOCATIONS

    const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: locations,
        },
    }

    const centerCoordinate = location
        ? [location.longitude, location.latitude]
        : locations.length > 0
          ? locations[Math.floor(locations.length / 2)]
          : [127.0276, 37.4979]

    const handleHistoryPress = () => {
        router.push('/history')
    }

    const handleSearchPress = () => {
        router.push('/rank')
    }

    return (
        <View className='flex-1'>
            <TrackingStats gpsLevel={gpsLevel} />
            <View className='h-1/2'>
                <MapView style={{ flex: 1 }} mapStyle='https://tiles.openfreemap.org/styles/liberty' logoEnabled={false} attributionEnabled={false}>
                    <Camera ref={cameraRef} centerCoordinate={centerCoordinate} zoomLevel={scale} animationMode='easeTo' animationDuration={300} />
                    {locations.length >= 2 && (
                        <ShapeSource id='route-source' shape={routeGeoJSON} lineMetrics>
                            <LineLayer
                                id='route-layer'
                                style={{
                                    lineColor: 'rgba(59, 130, 246, 0.5)',
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
            <TrackingControls onHistoryPress={handleHistoryPress} onSearchPress={handleSearchPress} />
        </View>
    )
}

export default Home
