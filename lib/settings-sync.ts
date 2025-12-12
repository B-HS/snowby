import { useUpdateSettings } from '@/entities/settings/settings.query'
import { useAppStore } from '@/lib/store'
import type { Locale, MeasurementUnit, NotificationSettings, TemperatureUnit, Theme } from '@/lib/types'

export const useSettingsSync = () => {
    const { mutate: syncToServer } = useUpdateSettings()
    const { setLocale, setTheme, setTemperatureUnit, setMeasurementUnit, setNotification } = useAppStore()

    const setLocaleWithSync = (locale: Locale) => {
        setLocale(locale)
        syncToServer({ locale })
    }

    const setThemeWithSync = (theme: Theme) => {
        setTheme(theme)
        syncToServer({ theme })
    }

    const setTemperatureUnitWithSync = (temperatureUnit: TemperatureUnit) => {
        setTemperatureUnit(temperatureUnit)
        syncToServer({ temperatureUnit })
    }

    const setMeasurementUnitWithSync = (measurementUnit: MeasurementUnit) => {
        setMeasurementUnit(measurementUnit)
        syncToServer({ measurementUnit })
    }

    const setNotificationWithSync = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
        setNotification(key, value)
        syncToServer({ notifications: { [key]: value } })
    }

    return {
        setLocaleWithSync,
        setThemeWithSync,
        setTemperatureUnitWithSync,
        setMeasurementUnitWithSync,
        setNotificationWithSync,
    }
}
