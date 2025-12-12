import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/lib/store'
import { fetchSettings, updateSettings } from './settings.api'
import type { UpdateSettingsInput } from '@/lib/types'

export const settingsKeys = {
    all: () => ['settings'] as const,
}

export const useSettings = () => {
    const { setLocale, setTheme, setTemperatureUnit, setMeasurementUnit, setNotification } = useAppStore()

    return useQuery({
        queryKey: settingsKeys.all(),
        queryFn: async () => {
            const settings = await fetchSettings()
            setLocale(settings.locale)
            setTheme(settings.theme)
            setTemperatureUnit(settings.temperatureUnit)
            setMeasurementUnit(settings.measurementUnit)
            setNotification('feed', settings.notifications.feed)
            setNotification('workout', settings.notifications.workout)
            setNotification('goal', settings.notifications.goal)
            return settings
        },
    })
}

export const useUpdateSettings = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
        onSuccess: (data) => {
            queryClient.setQueryData(settingsKeys.all(), data)
        },
    })
}
