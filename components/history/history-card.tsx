import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { HISTORY_CARD_ITEM_SETTINGS } from '@/lib/constant'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { convertDistance, convertSpeed, convertVertical, formatDuration, getDistanceUnit, getSpeedUnit, getVerticalUnit } from '@/lib/units'
import { cn } from '@/lib/utils'
import { ArrowUpRight, Edit, MapPin } from 'lucide-react-native'
import { FC } from 'react'
import { View } from 'react-native'
import { HistoryCardItem } from './history-card-item'

interface HistoryCardProps {
    username: string
    avatarURL: string
    locationLatitude: number
    locationLongitude: number
    type: 'snowboard' | 'ski'
    totalDistance: number
    vertical: number
    maxSpeed: number
    timeOnSlope: number
    runs: number
}

export const HistoryCard: FC<Partial<HistoryCardProps>> = ({ username, avatarURL, locationLatitude, locationLongitude, ...rest }) => {
    const { t } = useTranslation()
    const { measurementUnit } = useAppStore()

    const formatValue = (value: number | string | undefined, unitType: string | null) => {
        if (value === undefined) return '-'

        switch (unitType) {
            case 'distance':
                return `${convertDistance(value as number, measurementUnit)} ${getDistanceUnit(measurementUnit)}`
            case 'vertical':
                return `${convertVertical(value as number, measurementUnit)} ${getVerticalUnit(measurementUnit)}`
            case 'speed':
                return `${convertSpeed(value as number, measurementUnit)} ${getSpeedUnit(measurementUnit)}`
            case 'duration':
                return formatDuration(value as number)
            default:
                return String(value)
        }
    }

    return (
        <View className='border border-border rounded'>
            <View className='bg-secondary/50 flex flex-row items-center justify-between p-2 px-3'>
                <View className='flex gap-2 flex-row items-center'>
                    <Avatar alt={`${username}'s Avatar`} className='size-8'>
                        <AvatarImage source={{ uri: avatarURL }} />
                        <AvatarFallback>
                            <Text>{username?.slice(0, 2)}</Text>
                        </AvatarFallback>
                    </Avatar>
                    <View className='flex flex-col'>
                        <Text className='text-md font-bold'>{username}</Text>
                        <View className='flex gap-px flex-row items-center'>
                            <Icon as={MapPin} size={12} className='text-primary/80' />
                            <Text className='text-sm text-primary/80'>
                                {locationLatitude?.toFixed(4)}, {locationLongitude?.toFixed(4)}
                            </Text>
                        </View>
                    </View>
                </View>
                <Button variant='outline' size='icon' className='size-7'>
                    <Icon as={ArrowUpRight} size={16} className='text-primary/80' />
                </Button>
            </View>
            <Separator />
            <View className='flex flex-row flex-wrap'>
                {Object.entries(HISTORY_CARD_ITEM_SETTINGS).map(([key, item], idx) => (
                    <HistoryCardItem
                        key={key}
                        label={t(item.labelKey)}
                        value={formatValue(rest[key as keyof typeof rest], item.unitType)}
                        className={cn(idx % 3 !== 2 && 'border-r', idx >= 3 && 'border-t')}
                    />
                ))}
            </View>
        </View>
    )
}
