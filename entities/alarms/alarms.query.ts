import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAlarms, getUnreadCount, markAllAsRead, markAsRead } from './alarms.api'

export const alarmKeys = {
    list: () => ['alarms', 'list'] as const,
    unreadCount: () => ['alarms', 'unreadCount'] as const,
}

export const useAlarms = () =>
    useQuery({
        queryKey: alarmKeys.list(),
        queryFn: fetchAlarms,
    })

export const useUnreadCount = () =>
    useQuery({
        queryKey: alarmKeys.unreadCount(),
        queryFn: getUnreadCount,
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 60,
    })

export const useMarkAsRead = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alarmKeys.list() })
            queryClient.invalidateQueries({ queryKey: alarmKeys.unreadCount() })
        },
    })
}

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alarmKeys.list() })
            queryClient.invalidateQueries({ queryKey: alarmKeys.unreadCount() })
        },
    })
}
