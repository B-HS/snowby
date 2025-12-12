import { apiClient } from '@/entities/api-client'
import type { Country, RankingItem, RankingParams, Resort } from '@/lib/types'

export const fetchCountries = () => apiClient<Country[]>('/api/rankings/countries')

export const fetchResorts = (countryCode: string) =>
    apiClient<Resort[]>(`/api/rankings/resorts/${countryCode}`)

export const fetchRankings = (params: RankingParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('type', params.type)
    if (params.countryCode) searchParams.set('countryCode', params.countryCode)
    if (params.resortId) searchParams.set('resortId', params.resortId)
    return apiClient<RankingItem[]>(`/api/rankings?${searchParams.toString()}`)
}
