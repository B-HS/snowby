import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { signOut } from '@/lib/services/auth'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { useColorScheme } from 'nativewind'
import { Tabs } from 'expo-router'
import { Flag, History, LogOut, ScrollText, Settings, Trophy, User2 } from 'lucide-react-native'
import { NAV_THEME, THEME } from '@/lib/theme'
import { Pressable } from 'react-native'
import { Button } from '@/components/ui/button'

export default function TabLayout() {
    const { colorScheme } = useColorScheme()
    const { t } = useTranslation()
    const { user, logout } = useAppStore()
    const isLoggedIn = !!user

    const handleLogout = async () => {
        await signOut()
        logout()
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: NAV_THEME[colorScheme ?? 'light'].colors.background,
                    borderBottomColor: NAV_THEME[colorScheme ?? 'light'].colors.border,
                    borderBottomWidth: 1,
                },
                headerTitleStyle: {
                    fontWeight: '600',
                    color: NAV_THEME[colorScheme ?? 'light'].colors.text,
                },
                headerShadowVisible: false,
                tabBarActiveTintColor: THEME[colorScheme ?? 'light'].primary,
                tabBarInactiveTintColor: THEME[colorScheme ?? 'light'].secondary,
                tabBarStyle: {
                    backgroundColor: NAV_THEME[colorScheme ?? 'light'].colors.background,
                    borderTopColor: NAV_THEME[colorScheme ?? 'light'].colors.border,
                    borderTopWidth: 1,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                },
            }}>
            <Tabs.Screen
                name='local-histories'
                options={{
                    title: t('localHistory.title'),
                    tabBarIcon: ({ color, size }) => <Icon as={History} size={size} color={color} strokeWidth={1.5} />,
                    href: isLoggedIn ? null : '/local-histories',
                }}
            />
            <Tabs.Screen
                name='history'
                options={{
                    title: t('history.title'),
                    tabBarIcon: ({ color, size }) => <Icon as={ScrollText} size={size} color={color} strokeWidth={1.5} />,
                    href: isLoggedIn ? '/history' : null,
                }}
            />
            <Tabs.Screen
                name='rank'
                options={{
                    title: t('rank.title'),
                    tabBarIcon: ({ color, size }) => <Icon as={Trophy} size={size} color={color} strokeWidth={1.5} />,
                }}
            />
            <Tabs.Screen
                name='index'
                options={{
                    title: t('home.title'),
                    tabBarIcon: ({ color, size }) => <Icon as={Flag} size={size} color={color} strokeWidth={1.5} />,
                }}
            />
            <Tabs.Screen
                name='user'
                options={{
                    title: t('user.title'),
                    tabBarIcon: ({ color, size }) => <Icon as={User2} size={size} color={color} strokeWidth={1.5} />,
                    headerLeft: () =>
                        isLoggedIn ? (
                            <Button onPress={handleLogout} variant={'ghost'} size={'icon'}>
                                <Icon as={LogOut} size={18} className='text-destructive' />
                            </Button>
                        ) : null,
                }}
            />
            <Tabs.Screen
                name='setting'
                options={{
                    title: t('settings.title'),
                    tabBarIcon: ({ color, size }) => <Icon as={Settings} size={size} color={color} strokeWidth={1.5} />,
                }}
            />
        </Tabs>
    )
}
