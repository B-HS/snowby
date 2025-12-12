import { apiClient } from '@/entities/api-client'
import type { AlarmItem } from '@/lib/types'

export const fetchAlarms = () => apiClient<AlarmItem[]>('/api/alarms')

export const markAsRead = (alarmId: string) =>
    apiClient<AlarmItem>(`/api/alarms/${alarmId}/read`, {
        method: 'PATCH',
    })

export const markAllAsRead = () =>
    apiClient<{ success: boolean }>('/api/alarms/read-all', {
        method: 'PATCH',
    })

export const getUnreadCount = () => apiClient<{ count: number }>('/api/alarms/unread-count')
