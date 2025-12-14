import { apiClient } from '@/entities/api-client'
import type { RankingItem, RankingType } from '@/lib/types'

interface RankingsByBoundsParams {
    bounds: { sw: [number, number]; ne: [number, number] } | null
    type: RankingType
}

export const fetchRankingsByBounds = (params: RankingsByBoundsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('type', params.type)
    if (params.bounds) {
        searchParams.set('swLng', params.bounds.sw[0].toString())
        searchParams.set('swLat', params.bounds.sw[1].toString())
        searchParams.set('neLng', params.bounds.ne[0].toString())
        searchParams.set('neLat', params.bounds.ne[1].toString())
    }
    return apiClient<RankingItem[]>(`/api/rankings?${searchParams.toString()}`)
}
