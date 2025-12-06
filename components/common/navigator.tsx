import { MENU_ITEMS } from '@/lib/constant'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Text } from 'react-native'
import { useTranslation } from '@/lib/i18n'

export const Navigator = () => {
    const router = useRouter()
    const pathname = usePathname()
    const menuItems = Object.values(MENU_ITEMS)
    const { t } = useTranslation()
    const handleNavigation = (label: string | undefined) => {
        if (!label) return
        const item = menuItems.find((item) => item.label === label)
        if (item) router.replace(item.route as never)
    }

    return (
        <View className='flex flex-row justify-between items-center border-t border-border'>
            {menuItems.map((item, idx) => (
                <Button
                    variant='ghost'
                    key={item.label}
                    aria-label={item.label}
                    className='flex-1 rounded-none py-1.5 pt-5 active:bg-transparent dark:active:bg-transparent flex-col gap-0'
                    onPress={() => handleNavigation(item.label)}>
                    <Icon as={item.icon} className={cn('text-primary/30', pathname === item.route && 'text-primary')} size={24} strokeWidth={1.25} />
                    {idx === 2 && <Text className='text-xs text-primary/30'>{t('navigator.start')}</Text>}
                </Button>
            ))}
        </View>
    )
}
