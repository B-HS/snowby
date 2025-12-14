import '@/global.css'

import { fetchResorts } from '@/entities/resorts/resorts.api'
import { queryClient } from '@/lib/query-client'
import { useSession } from '@/lib/services/auth'
import { useAppStore } from '@/lib/store'
import { useTrackingStore } from '@/lib/tracking/tracking.store'
import { NAV_THEME } from '@/lib/theme'
import { Logger } from '@maplibre/maplibre-react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { useCallback, useEffect, useRef } from 'react'

Logger.setLogCallback((log) => {
    if (log.message.includes('Failed to load tile') || log.message.includes('timed out')) {
        return true
    }
    return !__DEV__
})

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
    const { colorScheme } = useColorScheme()
    const hasHydrated = useAppStore((state) => state._hasHydrated)
    const setUser = useAppStore((state) => state.setUser)
    const user = useAppStore((state) => state.user)
    const resortsData = useAppStore((state) => state.resortsData)
    const setResortsData = useAppStore((state) => state.setResortsData)
    const migrateAndSyncOnLogin = useTrackingStore((state) => state.migrateAndSyncOnLogin)
    const { data: session } = useSession()
    const previousUserId = useRef<string | null>(null)

    const loadResorts = useCallback(async () => {
        try {
            const data = await fetchResorts()
            if (data.version !== resortsData.version) {
                console.log('[RootLayout] Updating resorts data:', data.version)
                setResortsData(data)
            }
        } catch (error) {
            console.warn('[RootLayout] Failed to fetch resorts:', error)
        }
    }, [resortsData.version, setResortsData])

    useEffect(() => {
        if (hasHydrated) {
            SplashScreen.hideAsync()
            loadResorts()
        }
    }, [hasHydrated, loadResorts])

    useEffect(() => {
        if (session?.user) {
            setUser({
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                image: session.user.image ?? null,
            })
        }
    }, [session, setUser])

    useEffect(() => {
        if (user?.id && previousUserId.current !== user.id) {
            if (previousUserId.current === null) {
                console.log('[RootLayout] User logged in, migrating anonymous sessions...')
                migrateAndSyncOnLogin(user.id)
            }
            previousUserId.current = user.id
        } else if (!user?.id) {
            previousUserId.current = null
        }
    }, [user?.id, migrateAndSyncOnLogin])

    if (!hasHydrated) {
        return null
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name='(tabs)' />
                    <Stack.Screen name='alarm/index' options={{ headerShown: true, title: 'Alarm' }} />
                </Stack>
                <PortalHost />
            </ThemeProvider>
        </QueryClientProvider>
    )
}

export { ErrorBoundary } from 'expo-router'
