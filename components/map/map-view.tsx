import { AppleMaps, GoogleMaps } from 'expo-maps'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Platform, StyleProp, ViewStyle } from 'react-native'

type Coordinates = {
    latitude: number
    longitude: number
}

type CameraPosition = {
    coordinates: Coordinates
    zoom?: number
}

type PolylineData = {
    points: Coordinates[]
    color?: string
    width?: number
}

type CircleData = {
    center: Coordinates
    radius: number
    fillColor?: string
    strokeColor?: string
    strokeWidth?: number
}

type MarkerData = {
    coordinates: Coordinates
    id?: string
    title?: string
}

interface MapViewProps {
    style?: StyleProp<ViewStyle>
    cameraPosition?: CameraPosition
    mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain'
    polylines?: PolylineData[]
    circles?: CircleData[]
    markers?: MarkerData[]
}

interface MapViewRef {
    setCameraPosition: (position: CameraPosition) => void
}

type AppleMapViewRef = React.ElementRef<typeof AppleMaps.View>
type GoogleMapViewRef = React.ElementRef<typeof GoogleMaps.View>

export const MapView = forwardRef<MapViewRef, MapViewProps>(
    ({ style, cameraPosition, polylines = [], circles = [], markers = [] }, ref) => {
        const appleMapRef = useRef<AppleMapViewRef>(null)
        const googleMapRef = useRef<GoogleMapViewRef>(null)

        useImperativeHandle(ref, () => ({
            setCameraPosition: (position: CameraPosition) => {
                if (Platform.OS === 'ios' && appleMapRef.current) {
                    appleMapRef.current.setCameraPosition(position)
                } else if (googleMapRef.current) {
                    googleMapRef.current.setCameraPosition(position)
                }
            },
        }))

        const applePolylines = polylines.map((p, i) => ({
            coordinates: p.points,
            color: p.color || '#3b82f6',
            width: p.width || 4,
            id: `polyline-${i}`,
        }))

        const googlePolylines = polylines.map((p, i) => ({
            coordinates: p.points,
            color: p.color || '#3b82f6',
            width: p.width || 4,
            id: `polyline-${i}`,
        }))

        const appleCircles = circles.map((c, i) => ({
            center: c.center,
            radius: c.radius,
            color: c.fillColor,
            lineColor: c.strokeColor,
            lineWidth: c.strokeWidth || 1,
            id: `circle-${i}`,
        }))

        const googleCircles = circles.map((c, i) => ({
            center: c.center,
            radius: c.radius,
            color: c.fillColor,
            lineColor: c.strokeColor,
            lineWidth: c.strokeWidth || 1,
            id: `circle-${i}`,
        }))

        const appleMarkers = markers.map((m, i) => ({
            coordinates: m.coordinates,
            id: m.id || `marker-${i}`,
            title: m.title,
        }))

        const googleMarkers = markers.map((m, i) => ({
            coordinates: m.coordinates,
            id: m.id || `marker-${i}`,
            title: m.title,
        }))

        if (Platform.OS === 'ios') {
            return (
                <AppleMaps.View
                    ref={appleMapRef}
                    style={style}
                    cameraPosition={cameraPosition}
                    polylines={applePolylines}
                    circles={appleCircles}
                    markers={appleMarkers}
                />
            )
        }

        return (
            <GoogleMaps.View
                ref={googleMapRef}
                style={style}
                cameraPosition={cameraPosition}
                polylines={googlePolylines}
                circles={googleCircles}
                markers={googleMarkers}
            />
        )
    }
)

export type { CameraPosition, PolylineData, CircleData, MarkerData, MapViewRef }
