import { apiClient } from '@/entities/api-client'
import type { FetchFeedParams, FetchFeedResponse, HistoryItem } from '@/lib/types'

export const fetchFeed = (params: FetchFeedParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('filter', params.filter)
    searchParams.set('page', params.page.toString())
    searchParams.set('limit', params.limit.toString())
    return apiClient<FetchFeedResponse>(`/api/activities/feed?${searchParams.toString()}`)
}

export const fetchSelfHistory = () => apiClient<HistoryItem[]>('/api/activities/history')

export const fetchUserHistory = (userId: string) =>
    apiClient<HistoryItem[]>(`/api/activities/history/${userId}`)

export const saveActivity = (activity: Omit<HistoryItem, 'id' | 'createdAt'>) =>
    apiClient<HistoryItem>('/api/activities', {
        method: 'POST',
        body: activity as Record<string, unknown>,
    })
