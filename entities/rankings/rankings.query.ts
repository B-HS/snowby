import type { RankingParams } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { fetchCountries, fetchRankings, fetchResorts } from './rankings.api'

export const rankingKeys = {
    countries: () => ['ranking', 'countries'] as const,
    resorts: (countryCode: string) => ['ranking', 'resorts', countryCode] as const,
    list: (params: RankingParams) => ['ranking', 'list', params] as const,
}

export const useCountries = () =>
    useQuery({
        queryKey: rankingKeys.countries(),
        queryFn: fetchCountries,
        staleTime: 1000 * 60 * 60 * 24,
    })

export const useResorts = (countryCode: string) =>
    useQuery({
        queryKey: rankingKeys.resorts(countryCode),
        queryFn: () => fetchResorts(countryCode),
        enabled: !!countryCode,
        staleTime: 1000 * 60 * 60,
    })

export const useRankings = (params: RankingParams) =>
    useQuery({
        queryKey: rankingKeys.list(params),
        queryFn: () => fetchRankings(params),
    })
