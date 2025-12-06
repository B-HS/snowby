import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { i18n } from './i18n'

type Locale = 'en' | 'ko' | 'jp'
type Theme = 'light' | 'dark' | 'system'
type TemperatureUnit = 'celsius' | 'fahrenheit'
type MeasurementUnit = 'metric' | 'imperial'
type TrackingStatus = 'start' | 'pause' | 'stop'

type NotificationSettings = {
    feed: boolean
    workout: boolean
    goal: boolean
}

type User = {
    id: string
    email: string
    name: string
    image: string | null
} | null

type TrackingData = {
    startTime: number | null
    startLatitude: number
    startLongitude: number
    currentLatitude: number
    currentLongitude: number
    totalDistance: number
    maxVertical: number
    totalRuns: number
    maxSpeed: number
    locations: [number, number][]
}

type AppState = {
    user: User
    isAuthenticated: boolean
    locale: Locale
    theme: Theme
    temperatureUnit: TemperatureUnit
    measurementUnit: MeasurementUnit
    notifications: NotificationSettings
    trackingStatus: TrackingStatus
    trackingData: TrackingData
    setUser: (user: User) => void
    logout: () => void
    setLocale: (locale: Locale) => void
    setTheme: (theme: Theme) => void
    setTemperatureUnit: (unit: TemperatureUnit) => void
    setMeasurementUnit: (unit: MeasurementUnit) => void
    setNotification: <K extends keyof NotificationSettings>(
        key: K,
        value: NotificationSettings[K]
    ) => void
    setTrackingStatus: (status: TrackingStatus) => void
    updateTrackingData: (data: Partial<TrackingData>) => void
    resetTrackingData: () => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            locale: (i18n.locale as Locale) || 'en',
            theme: 'system',
            temperatureUnit: 'celsius',
            measurementUnit: 'metric',
            notifications: {
                feed: true,
                workout: true,
                goal: true,
            },
            trackingStatus: 'stop',
            trackingData: {
                startTime: null,
                startLatitude: 0,
                startLongitude: 0,
                currentLatitude: 0,
                currentLongitude: 0,
                totalDistance: 0,
                maxVertical: 0,
                totalRuns: 0,
                maxSpeed: 0,
                locations: [],
            },
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            logout: () => set({ user: null, isAuthenticated: false }),
            setLocale: (locale) => {
                i18n.locale = locale
                set({ locale })
            },
            setTheme: (theme) => set({ theme }),
            setTemperatureUnit: (temperatureUnit) => set({ temperatureUnit }),
            setMeasurementUnit: (measurementUnit) => set({ measurementUnit }),
            setNotification: (key, value) =>
                set((state) => ({
                    notifications: { ...state.notifications, [key]: value },
                })),
            setTrackingStatus: (trackingStatus) => set({ trackingStatus }),
            updateTrackingData: (data) =>
                set((state) => ({
                    trackingData: { ...state.trackingData, ...data },
                })),
            resetTrackingData: () =>
                set({
                    trackingData: {
                        startTime: null,
                        startLatitude: 0,
                        startLongitude: 0,
                        currentLatitude: 0,
                        currentLongitude: 0,
                        totalDistance: 0,
                        maxVertical: 0,
                        totalRuns: 0,
                        maxSpeed: 0,
                        locations: [],
                    },
                }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                if (state?.locale) {
                    i18n.locale = state.locale
                }
                if (state?.theme) {
                    const colorScheme =
                        state.theme === 'system' ? Appearance.getColorScheme() ?? 'light' : state.theme
                    Appearance.setColorScheme(colorScheme)
                }
            },
        }
    )
)
