import { apiClient } from '@/entities/api-client'
import type { UpdateSettingsInput, UserSettings } from '@/lib/types'

export const fetchSettings = () => apiClient<UserSettings>('/api/settings')

export const updateSettings = (settings: UpdateSettingsInput) =>
    apiClient<UserSettings>('/api/settings', {
        method: 'PATCH',
        body: settings as Record<string, unknown>,
    })
