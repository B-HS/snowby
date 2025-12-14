import type { RankingType } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { fetchRankingsByBounds } from './rankings.api'

interface RankingsByBoundsParams {
    bounds: { sw: [number, number]; ne: [number, number] } | null
    type: RankingType
}

export const rankingKeys = {
    byBounds: (params: RankingsByBoundsParams) => ['ranking', 'byBounds', params] as const,
}

export const useRankingsByBounds = (params: RankingsByBoundsParams) =>
    useQuery({
        queryKey: rankingKeys.byBounds(params),
        queryFn: () => fetchRankingsByBounds(params),
    })
