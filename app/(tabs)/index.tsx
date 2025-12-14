import { AccuracyCircle } from '@/components/tracking/accuracy-circle'
import { TrackingControls } from '@/components/tracking/tracking-controls'
import { TrackingStats } from '@/components/tracking/tracking-stats'
import { Text } from '@/components/ui/text'
import { useLocationTracking } from '@/lib/hooks/use-location-tracking'
import { useAppStore } from '@/lib/store'
import { Camera, CameraRef, LineLayer, MapView, ShapeSource } from '@maplibre/maplibre-react-native'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { View } from 'react-native'

const SAMPLE_LOCATIONS: [number, number][] = [
    [127.0276, 37.4979],
    [127.028, 37.4985],
    [127.0285, 37.499],
    [127.029, 37.4988],
    [127.0295, 37.4992],
    [127.03, 37.4998],
]

const MAP_STYLES = {
    openfreemap: 'https://tiles.openfreemap.org/styles/liberty',
    fallback: 'https://demotiles.maplibre.org/style.json',
}

const Home = () => {
    const router = useRouter()
    const cameraRef = useRef<CameraRef>(null)
    const { trackingData } = useAppStore()
    const { location, gpsLevel } = useLocationTracking()
    const [scale] = useState(5)
    const [mapStyle, setMapStyle] = useState(MAP_STYLES.openfreemap)

    const handleMapLoadError = useCallback(() => {
        if (mapStyle === MAP_STYLES.openfreemap) {
            setMapStyle(MAP_STYLES.fallback)
        }
    }, [mapStyle])

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
        <View className='flex-1 pt-2'>
            <TrackingStats gpsLevel={gpsLevel} />
            <View className='h-1/2'>
                <View>
                    <Text>{location?.latitude}</Text>
                    <Text>{location?.longitude}</Text>
                </View>
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
