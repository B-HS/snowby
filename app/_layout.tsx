import '@/global.css'

import { Navigator } from '@/components/common/navigator'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { t } from '@/lib/i18n'
import { queryClient } from '@/lib/query-client'
import { useAppStore } from '@/lib/store'
import { NAV_THEME } from '@/lib/theme'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { ReactNode, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync()

const ROUTE_TITLE_KEYS: Record<string, string> = {
    index: 'home.title',
    history: 'history.title',
    rank: 'rank.title',
    user: 'user.title',
    setting: 'settings.title',
    alarm: 'alarm.title',
}

const ScreenLayout = ({ children }: { children: ReactNode }) => {
    return (
        <SafeAreaView className='flex-1 pt-10 antialiased'>
            <Separator />
            {children}
            <Navigator />
        </SafeAreaView>
    )
}

export default function RootLayout() {
    const { colorScheme } = useColorScheme()
    const hasHydrated = useAppStore((state) => state._hasHydrated)

    useEffect(() => {
        if (hasHydrated) {
            SplashScreen.hideAsync()
        }
    }, [hasHydrated])

    if (!hasHydrated) {
        return null
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack
                    screenOptions={({ route }) => {
                        const routeName = route.name.replace('/index', '').replace('index', '') || 'index'
                        const titleKey = ROUTE_TITLE_KEYS[routeName] || 'home.title'
                        return {
                            animation: 'none',
                            headerTransparent: true,
                            headerTitle: () => <Text className='text-xl font-bold'>{t(titleKey)}</Text>,
                        }
                    }}
                    screenLayout={({ children }) => <ScreenLayout>{children}</ScreenLayout>}
                />
                <PortalHost />
            </ThemeProvider>
        </QueryClientProvider>
    )
}

export { ErrorBoundary } from 'expo-router'
