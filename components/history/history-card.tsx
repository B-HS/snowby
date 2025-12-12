import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { UserProfileModal } from '@/components/user/user-profile-modal'
import { HISTORY_CARD_ITEM_SETTINGS } from '@/lib/constant'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { formatStatValue } from '@/lib/units'
import { cn, getImageUrl } from '@/lib/utils'
import { AlertTriangle, EyeOff, MapPin, MoreVertical, User, UserMinus, UserPlus } from 'lucide-react-native'
import { FC, useState } from 'react'
import { Pressable, View } from 'react-native'
import { HistoryCardItem } from './history-card-item'

interface HistoryCardProps {
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
    bio?: string
    activityTypes?: ('ski' | 'snowboard')[]
    onFollow?: (userId: string) => void
    onUnfollow?: (userId: string) => void
    onHide?: (userId: string) => void
    onReport?: (userId: string) => void
}

export const HistoryCard: FC<HistoryCardProps> = ({
    userId,
    username,
    avatarURL,
    locationLatitude,
    locationLongitude,
    isPublic = true,
    isFollowing = false,
    bio,
    activityTypes,
    onFollow,
    onUnfollow,
    onHide,
    onReport,
    ...rest
}) => {
    const { t } = useTranslation()
    const { measurementUnit } = useAppStore()
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false)

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
                    <Pressable
                        onPress={handleUserPress}
                        disabled={!isPublic}
                        className='flex gap-2 flex-row items-center flex-1'>
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
                            <Text className={cn('text-md font-bold', !isPublic && 'text-primary/60')}>
                                {displayUsername}
                            </Text>
                            <View className='flex gap-px flex-row items-center'>
                                <Icon as={MapPin} size={12} className='text-primary/80' />
                                <Text className='text-sm text-primary/80'>
                                    {locationLatitude?.toFixed(4)}, {locationLongitude?.toFixed(4)}
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
                                    <Icon
                                        as={isFollowing ? UserMinus : UserPlus}
                                        size={16}
                                        className='text-foreground'
                                    />
                                    <Text>
                                        {isFollowing ? t('history.unfollow') : t('history.follow')}
                                    </Text>
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
                <View className='flex flex-row flex-wrap'>
                    {Object.entries(HISTORY_CARD_ITEM_SETTINGS).map(([key, item], idx) => (
                        <HistoryCardItem
                            key={key}
                            label={t(item.labelKey)}
                            value={formatStatValue(rest[key as keyof typeof rest], item.unitType, measurementUnit)}
                            className={cn(idx % 3 !== 2 && 'border-r', idx >= 3 && 'border-t')}
                        />
                    ))}
                </View>
            </View>

            <UserProfileModal
                visible={isProfileModalVisible}
                onClose={() => setIsProfileModalVisible(false)}
                userData={
                    isPublic
                        ? {
                              userId: userId ?? '',
                              username: username ?? '',
                              avatarURL: getImageUrl(avatarURL),
                              bio,
                              totalDistance: rest.totalDistance,
                              vertical: rest.vertical,
                              maxSpeed: rest.maxSpeed,
                              timeOnSlope: rest.timeOnSlope,
                              runs: rest.runs,
                              activityTypes,
                          }
                        : null
                }
            />
        </>
    )
}
