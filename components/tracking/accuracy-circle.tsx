import { GPS_SIGNAL_LEVELS } from '@/lib/constant'
import { CircleLayer, FillLayer, ShapeSource } from '@maplibre/maplibre-react-native'
import { FC } from 'react'

type GpsLevel = keyof typeof GPS_SIGNAL_LEVELS

interface AccuracyCircleProps {
    latitude: number
    longitude: number
    accuracy: number
    gpsLevel: GpsLevel
}

const createCirclePolygon = (longitude: number, latitude: number, radiusInMeters: number): GeoJSON.Feature<GeoJSON.Polygon> => {
    const points = 64
    const coords: [number, number][] = []

    const metersPerDegreeLat = 111320
    const metersPerDegreeLon = 111320 * Math.cos((latitude * Math.PI) / 180)

    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI
        const dx = (radiusInMeters * Math.cos(angle)) / metersPerDegreeLon
        const dy = (radiusInMeters * Math.sin(angle)) / metersPerDegreeLat
        coords.push([longitude + dx, latitude + dy])
    }

    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [coords],
        },
    }
}

const createPointGeoJSON = (longitude: number, latitude: number): GeoJSON.Feature<GeoJSON.Point> => {
    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
        },
    }
}

export const AccuracyCircle: FC<AccuracyCircleProps> = ({ latitude, longitude, accuracy, gpsLevel }) => {
    if (latitude === 0 && longitude === 0) return null

    const circlePolygon = createCirclePolygon(longitude, latitude, accuracy)
    const centerPoint = createPointGeoJSON(longitude, latitude)
    const color = GPS_SIGNAL_LEVELS[gpsLevel].color

    return (
        <>
            <ShapeSource id='accuracy-polygon-source' shape={circlePolygon}>
                <FillLayer
                    id='accuracy-fill-layer'
                    style={{
                        fillColor: color,
                        fillOpacity: 0.2,
                    }}
                />
            </ShapeSource>
            <ShapeSource id='accuracy-center-source' shape={centerPoint}>
                <CircleLayer
                    id='accuracy-center-layer'
                    style={{
                        circleRadius: 8,
                        circleColor: color,
                        circleOpacity: 1,
                        circleStrokeColor: '#ffffff',
                        circleStrokeWidth: 1,
                    }}
                />
            </ShapeSource>
        </>
    )
}
