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
