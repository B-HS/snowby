import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { useTranslation } from '@/lib/i18n'
import { getImageUrl } from '@/lib/utils'
import { findResortByCoordinate } from '@/lib/utils/resort-matcher'
import { MapPin, Trophy } from 'lucide-react-native'
import { FC } from 'react'
import { View } from 'react-native'

interface RankItemProps {
    username: string
    avatarURL: string | null
    locationLatitude: number
    locationLongitude: number
    value: number
    unit: string
    rank: number
}

const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: true, color: 'text-yellow-500' }
    if (rank === 2) return { icon: true, color: 'text-gray-400' }
    if (rank === 3) return { icon: true, color: 'text-amber-600' }
    return { icon: false, color: 'text-primary' }
}

export const RankItem: FC<RankItemProps> = ({ username, avatarURL, locationLatitude, locationLongitude, value, unit, rank }) => {
    const { t } = useTranslation()
    const rankDisplay = getRankDisplay(rank)

    const resort = locationLatitude && locationLongitude ? findResortByCoordinate(locationLatitude, locationLongitude) : null

    return (
        <View className='bg-secondary/50 flex flex-row items-center justify-between p-2 px-3 rounded'>
            <View className='flex flex-row gap-3 items-center'>
                <View className='w-6 items-center'>
                    {rankDisplay.icon ? (
                        <Icon as={Trophy} size={16} className={rankDisplay.color} />
                    ) : (
                        <Text className={rankDisplay.color}>{rank}</Text>
                    )}
                </View>
                <View className='flex gap-2 flex-row items-center'>
                    <Avatar alt={`${username}'s Avatar`} className='size-8'>
                        <AvatarImage source={{ uri: getImageUrl(avatarURL) }} />
                        <AvatarFallback>
                            <Text>{username?.slice(0, 2)}</Text>
                        </AvatarFallback>
                    </Avatar>
                    <View className='flex flex-col'>
                        <Text className='text-md font-extrabold'>{username}</Text>
                        <View className='flex gap-px flex-row items-center'>
                            <Icon as={MapPin} size={12} className='text-primary/80' />
                            <Text className='text-sm text-primary/80'>{resort?.id !== 'unknown' ? resort?.name : t('history.unknownResort')}</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View className='flex flex-row gap-1 items-center'>
                <Text className='font-bold'>{Math.round(value)}</Text>
                <Text className='text-primary/70'>{unit === 'runs' ? t('rank.countUnit') : unit}</Text>
            </View>
        </View>
    )
}
