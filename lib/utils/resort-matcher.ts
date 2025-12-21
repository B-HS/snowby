import { useAppStore } from '@/lib/store'
import type { MatchedResort, Resort } from '@/lib/types'

const UNKNOWN_RESORT: MatchedResort = {
    id: 'unknown',
    name: 'Unknown',
    nameEn: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
}

const getResorts = (): Resort[] => {
    return useAppStore.getState().resortsData.resorts
}

const isPointInBounds = (
    lat: number,
    lng: number,
    bounds: Resort['bounds']
): boolean => {
    const [swLng, swLat] = bounds.sw
    const [neLng, neLat] = bounds.ne
    return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng
}

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLat = lat2 - lat1
    const dLng = lng2 - lng1
    return Math.sqrt(dLat * dLat + dLng * dLng)
}

export const findResortByCoordinate = (lat: number, lng: number): MatchedResort => {
    const resorts = getResorts()

    const matchedResorts = resorts.filter(
        (resort) => resort.status === 'active' && isPointInBounds(lat, lng, resort.bounds)
    )

    if (matchedResorts.length === 0) {
        return UNKNOWN_RESORT
    }

    if (matchedResorts.length === 1) {
        const resort = matchedResorts[0]
        return {
            id: resort.id,
            name: resort.name,
            nameEn: resort.nameEn,
            region: resort.region,
            country: resort.country,
        }
    }

    const closest = matchedResorts.reduce((prev, curr) => {
        const prevDist = calculateDistance(lat, lng, prev.center[1], prev.center[0])
        const currDist = calculateDistance(lat, lng, curr.center[1], curr.center[0])
        return currDist < prevDist ? curr : prev
    })

    return {
        id: closest.id,
        name: closest.name,
        nameEn: closest.nameEn,
        region: closest.region,
        country: closest.country,
    }
}

export const findNearestResort = (lat: number, lng: number, maxDistanceKm: number = 50): MatchedResort | null => {
    const resorts = getResorts()

    const KM_PER_DEGREE = 111

    let nearest: Resort | null = null
    let minDistance = Infinity

    for (const resort of resorts) {
        if (resort.status !== 'active') continue

        const [centerLng, centerLat] = resort.center
        const distance = calculateDistance(lat, lng, centerLat, centerLng) * KM_PER_DEGREE

        if (distance < minDistance) {
            minDistance = distance
            nearest = resort
        }
    }

    if (!nearest || minDistance > maxDistanceKm) {
        return null
    }

    return {
        id: nearest.id,
        name: nearest.name,
        nameEn: nearest.nameEn,
        region: nearest.region,
        country: nearest.country,
    }
}

export const getResortById = (id: string): MatchedResort | null => {
    const resorts = getResorts()
    const resort = resorts.find((r) => r.id === id)

    if (!resort) return null

    return {
        id: resort.id,
        name: resort.name,
        nameEn: resort.nameEn,
        region: resort.region,
        country: resort.country,
    }
}

export const getResortWithBoundsById = (id: string): (MatchedResort & { bounds: Resort['bounds'] }) | null => {
    const resorts = getResorts()
    const resort = resorts.find((r) => r.id === id)

    if (!resort) return null

    return {
        id: resort.id,
        name: resort.name,
        nameEn: resort.nameEn,
        region: resort.region,
        country: resort.country,
        bounds: resort.bounds,
    }
}

export const getAllResorts = (): MatchedResort[] => {
    const resorts = getResorts()
    return resorts
        .filter((r) => r.status === 'active')
        .map((r) => ({
            id: r.id,
            name: r.name,
            nameEn: r.nameEn,
            region: r.region,
            country: r.country,
        }))
}

export const getAllResortsWithBounds = (): (MatchedResort & { bounds: Resort['bounds'] })[] => {
    const resorts = getResorts()
    return resorts
        .filter((r) => r.status === 'active')
        .map((r) => ({
            id: r.id,
            name: r.name,
            nameEn: r.nameEn,
            region: r.region,
            country: r.country,
            bounds: r.bounds,
        }))
}

export const getResortsByRegion = (region: string): MatchedResort[] => {
    const resorts = getResorts()
    return resorts
        .filter((r) => r.status === 'active' && r.region === region)
        .map((r) => ({
            id: r.id,
            name: r.name,
            nameEn: r.nameEn,
            region: r.region,
            country: r.country,
        }))
}

export const getResortsWithBoundsByRegion = (region: string): (MatchedResort & { bounds: Resort['bounds'] })[] => {
    const resorts = getResorts()
    return resorts
        .filter((r) => r.status === 'active' && r.region === region)
        .map((r) => ({
            id: r.id,
            name: r.name,
            nameEn: r.nameEn,
            region: r.region,
            country: r.country,
            bounds: r.bounds,
        }))
}

export const getUniqueRegions = (): string[] => {
    const resorts = getResorts()
    const regions = new Set(resorts.filter((r) => r.status === 'active').map((r) => r.region))
    return Array.from(regions).sort()
}

export const calculateZoomFromBounds = (
    bounds: { sw: [number, number]; ne: [number, number] },
    mapWidth: number = 400,
    mapHeight: number = 300
): number => {
    const [swLng, swLat] = bounds.sw
    const [neLng, neLat] = bounds.ne

    const lngDiff = Math.abs(neLng - swLng)

    const WORLD_DIM = { height: 256, width: 256 }
    const ZOOM_MAX = 18

    const latRad = (lat: number) => {
        const sin = Math.sin((lat * Math.PI) / 180)
        const radX2 = Math.log((1 + sin) / (1 - sin)) / 2
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2
    }

    const zoom = (mapPx: number, worldPx: number, fraction: number) => {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2)
    }

    const latFraction = (latRad(neLat) - latRad(swLat)) / Math.PI
    const lngFraction = lngDiff / 360

    const latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction)
    const lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction)

    return Math.min(latZoom, lngZoom, ZOOM_MAX)
}

export const getCameraPositionForResort = (
    lat: number,
    lng: number,
    mapWidth: number = 400,
    mapHeight: number = 300
): { coordinates: { latitude: number; longitude: number }; zoom: number } => {
    const resort = findResortByCoordinate(lat, lng)

    if (resort.id === 'unknown') {
        return {
            coordinates: { latitude: lat, longitude: lng },
            zoom: 14,
        }
    }

    const resorts = getResorts()
    const fullResort = resorts.find((r) => r.id === resort.id)

    if (!fullResort) {
        return {
            coordinates: { latitude: lat, longitude: lng },
            zoom: 14,
        }
    }

    const [swLng, swLat] = fullResort.bounds.sw
    const [neLng, neLat] = fullResort.bounds.ne

    const centerLat = (swLat + neLat) / 2
    const centerLng = (swLng + neLng) / 2

    const zoom = calculateZoomFromBounds(fullResort.bounds, mapWidth, mapHeight)

    return {
        coordinates: { latitude: centerLat, longitude: centerLng },
        zoom: Math.min(zoom + 0.5, 16),
    }
}
