import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { UserProfileModal } from '@/components/user/user-profile-modal'
import { HistoryDetailModal } from '@/components/history/history-detail-modal'
import { HISTORY_CARD_ITEM_SETTINGS } from '@/lib/constant'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { formatStatValue } from '@/lib/units'
import { cn, getImageUrl } from '@/lib/utils'
import { findResortByCoordinate } from '@/lib/utils/resort-matcher'
import { AlertTriangle, EyeOff, MapPin, MoreVertical, User, UserMinus, UserPlus } from 'lucide-react-native'
import { FC, useState } from 'react'
import { Pressable, View } from 'react-native'
import { HistoryCardItem } from './history-card-item'

interface HistoryCardProps {
    activityId?: string
    userId?: string
    username?: string
    avatarURL?: string
    locationLatitude?: number
    locationLongitude?: number
    type?: 'snowboard' | 'ski'
    totalDistance?: number
    vertical?: number
    maxSpeed?: number
    timeOnSlope?: number
    runs?: number
    isPublic?: boolean
    isFollowing?: boolean
    onFollow?: (userId: string) => void
    onUnfollow?: (userId: string) => void
    onHide?: (userId: string) => void
    onReport?: (userId: string) => void
}

export const HistoryCard: FC<HistoryCardProps> = ({
    activityId,
    userId,
    username,
    avatarURL,
    locationLatitude,
    locationLongitude,
    isPublic = true,
    isFollowing = false,
    onFollow,
    onUnfollow,
    onHide,
    onReport,
    ...rest
}) => {
    const { t } = useTranslation()
    const { measurementUnit } = useAppStore()
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false)
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)

    const resort = locationLatitude && locationLongitude ? findResortByCoordinate(locationLatitude, locationLongitude) : null

    const handleFollowToggle = () => {
        if (!userId) return
        if (isFollowing) {
            onUnfollow?.(userId)
        } else {
            onFollow?.(userId)
        }
    }

    const handleHide = () => {
        if (!userId) return
        onHide?.(userId)
    }

    const handleReport = () => {
        if (!userId) return
        onReport?.(userId)
    }

    const handleUserPress = () => {
        if (isPublic) {
            setIsProfileModalVisible(true)
        }
    }

    const displayUsername = isPublic ? username : t('history.privateUser')

    return (
        <>
            <View className='border border-border rounded'>
                <View className='bg-secondary/50 flex flex-row items-center justify-between p-2 px-3'>
                    <Pressable onPress={handleUserPress} disabled={!isPublic} className='flex gap-2 flex-row items-center flex-1'>
                        <Avatar alt={`${displayUsername}'s Avatar`} className='size-8'>
                            {isPublic ? (
                                <>
                                    <AvatarImage source={{ uri: getImageUrl(avatarURL) }} />
                                    <AvatarFallback>
                                        <Text>{username?.slice(0, 2)}</Text>
                                    </AvatarFallback>
                                </>
                            ) : (
                                <AvatarFallback>
                                    <Icon as={User} size={16} className='text-primary/60' />
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <View className='flex flex-col'>
                            <Text className={cn('text-md font-bold', !isPublic && 'text-primary/60')}>{displayUsername}</Text>
                            <View className='flex gap-px flex-row items-center'>
                                <Icon as={MapPin} size={12} className='text-primary/80' />
                                <Text className='text-sm text-primary/80'>
                                    {resort?.id !== 'unknown' ? resort?.name : t('history.unknownResort')}
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                    {isPublic ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='outline' size='icon' className='size-7'>
                                    <Icon as={MoreVertical} size={16} className='text-primary/80' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onPress={handleFollowToggle}>
                                    <Icon as={isFollowing ? UserMinus : UserPlus} size={16} className='text-foreground' />
                                    <Text>{isFollowing ? t('history.unfollow') : t('history.follow')}</Text>
                                </DropdownMenuItem>
                                <DropdownMenuItem onPress={handleHide}>
                                    <Icon as={EyeOff} size={16} className='text-foreground' />
                                    <Text>{t('history.hide')}</Text>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onPress={handleReport} variant='destructive'>
                                    <Icon as={AlertTriangle} size={16} className='text-destructive' />
                                    <Text>{t('history.report')}</Text>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant='outline' size='icon' className='size-7' disabled>
                            <Icon as={MoreVertical} size={16} className='text-primary/40' />
                        </Button>
                    )}
                </View>
                <Separator />
                <Pressable onPress={() => activityId && setIsDetailModalVisible(true)}>
                    <View className='flex flex-row flex-wrap'>
                        {Object.entries(HISTORY_CARD_ITEM_SETTINGS).map(([key, item], idx) => {
                            const rawValue = rest[key as keyof typeof rest]
                            const value =
                                key === 'type' && typeof rawValue === 'string'
                                    ? t(`user.${rawValue}`)
                                    : formatStatValue(rawValue, item.unitType, measurementUnit)
                            return (
                                <HistoryCardItem
                                    key={key}
                                    label={t(item.labelKey)}
                                    value={value}
                                    className={cn(idx % 3 !== 2 && 'border-r', idx >= 3 && 'border-t')}
                                />
                            )
                        })}
                    </View>
                </Pressable>
            </View>

            <UserProfileModal
                visible={isProfileModalVisible}
                onClose={() => setIsProfileModalVisible(false)}
                userId={isPublic ? (userId ?? null) : null}
            />

            <HistoryDetailModal visible={isDetailModalVisible} onClose={() => setIsDetailModalVisible(false)} activityId={activityId ?? null} />
        </>
    )
}
