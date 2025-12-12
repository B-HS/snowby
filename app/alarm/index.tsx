import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { useAlarms, useMarkAllAsRead, useMarkAsRead } from '@/entities/alarms/alarms.query'
import { useTranslation } from '@/lib/i18n'
import type { AlarmItem } from '@/lib/types'
import { getImageUrl } from '@/lib/utils'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react-native'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'

dayjs.extend(relativeTime)

const getAlarmIcon = (type: AlarmItem['type']) => {
    switch (type) {
        case 'follow':
            return UserPlus
        case 'like':
            return Heart
        case 'comment':
            return MessageCircle
        case 'system':
        default:
            return Bell
    }
}

const AlarmItemCard = ({
    alarm,
    onPress,
}: {
    alarm: AlarmItem
    onPress: (alarmId: string) => void
}) => {
    const IconComponent = getAlarmIcon(alarm.type)

    return (
        <Pressable onPress={() => onPress(alarm.id)}>
            <Card className={`flex-row items-center gap-3 p-3 ${!alarm.read ? 'bg-primary/5' : ''}`}>
                {alarm.relatedUserAvatar ? (
                    <Avatar alt='User avatar' className='size-10'>
                        <AvatarImage source={{ uri: getImageUrl(alarm.relatedUserAvatar) }} />
                        <AvatarFallback>
                            <IconComponent size={20} className='text-primary' />
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <View className='size-10 items-center justify-center rounded-full bg-primary/10'>
                        <IconComponent size={20} className='text-primary' />
                    </View>
                )}
                <View className='flex-1 gap-0.5'>
                    <Text className={`text-sm ${!alarm.read ? 'font-semibold' : ''}`}>{alarm.title}</Text>
                    <Text className='text-xs text-primary/60' numberOfLines={2}>
                        {alarm.message}
                    </Text>
                    <Text className='text-xs text-primary/40'>{dayjs(alarm.createdAt).fromNow()}</Text>
                </View>
                {!alarm.read && <View className='size-2 rounded-full bg-blue-500' />}
            </Card>
        </Pressable>
    )
}

const Alarm = () => {
    const { t } = useTranslation()
    const { data: alarms, isLoading } = useAlarms()
    const { mutate: markAsRead } = useMarkAsRead()
    const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead()

    const unreadCount = alarms?.filter((a) => !a.read).length ?? 0

    if (isLoading) {
        return (
            <View className='flex-1 items-center justify-center'>
                <ActivityIndicator size='large' />
            </View>
        )
    }

    return (
        <View className='flex-1'>
            {unreadCount > 0 && (
                <View className='flex-row items-center justify-between px-3.5 py-2'>
                    <Text className='text-sm text-primary/60'>
                        {t('alarm.unread')}: {unreadCount}
                    </Text>
                    <Button
                        variant='ghost'
                        size='sm'
                        onPress={() => markAllAsRead()}
                        disabled={isMarkingAll}>
                        <Text className='text-sm text-blue-500'>{t('alarm.markAllAsRead')}</Text>
                    </Button>
                </View>
            )}
            <ScrollView className='flex-1 p-3.5' contentContainerClassName='gap-2'>
                {alarms?.map((alarm) => (
                    <AlarmItemCard key={alarm.id} alarm={alarm} onPress={markAsRead} />
                ))}
                {alarms?.length === 0 && (
                    <View className='items-center py-8'>
                        <Bell size={48} className='mb-2 text-primary/30' />
                        <Text className='text-primary/60'>{t('alarm.noAlarms')}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

export default Alarm
