import type { HistoryFilter, HistoryItem } from '@/lib/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchActivityDetail, fetchFeed, fetchSelfHistory, fetchUserHistory, saveActivity } from './activities.api'

export const activityKeys = {
    feed: (filter: HistoryFilter) => ['activities', 'feed', filter] as const,
    selfHistory: () => ['activities', 'selfHistory'] as const,
    userHistory: (userId: string) => ['activities', 'userHistory', userId] as const,
    detail: (activityId: string) => ['activities', 'detail', activityId] as const,
}

export const useFeed = (filter: HistoryFilter, page: number = 1, limit: number = 20) =>
    useQuery({
        queryKey: activityKeys.feed(filter),
        queryFn: () => fetchFeed({ filter, page, limit }),
    })

export const useSelfHistory = () =>
    useQuery({
        queryKey: activityKeys.selfHistory(),
        queryFn: fetchSelfHistory,
    })

export const useUserHistory = (userId: string) =>
    useQuery({
        queryKey: activityKeys.userHistory(userId),
        queryFn: () => fetchUserHistory(userId),
        enabled: !!userId,
    })

export const useSaveActivity = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (activity: Omit<HistoryItem, 'id' | 'createdAt'>) => saveActivity(activity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] })
        },
    })
}

export const useActivityDetail = (activityId: string) =>
    useQuery({
        queryKey: activityKeys.detail(activityId),
        queryFn: () => fetchActivityDetail(activityId),
        enabled: !!activityId,
    })
