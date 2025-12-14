import '@/global.css'

import { queryClient } from '@/lib/query-client'
import { useSession } from '@/lib/services/auth'
import { useAppStore } from '@/lib/store'
import { NAV_THEME } from '@/lib/theme'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { useEffect } from 'react'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
    const { colorScheme } = useColorScheme()
    const hasHydrated = useAppStore((state) => state._hasHydrated)
    const setUser = useAppStore((state) => state.setUser)
    const { data: session } = useSession()

    useEffect(() => {
        if (hasHydrated) {
            SplashScreen.hideAsync()
        }
    }, [hasHydrated])

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
