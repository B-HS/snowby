import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { HISTORY_CARD_ITEM_SETTINGS } from '@/lib/constant'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import type { TrackingSession } from '@/lib/tracking/tracking.types'
import { formatStatValue, formatDistanceFromMeters } from '@/lib/units'
import { cn } from '@/lib/utils'
import { findResortByCoordinate } from '@/lib/utils/resort-matcher'
import { Clock, MapPin, Snowflake } from 'lucide-react-native'
import { FC, useMemo } from 'react'
import { View } from 'react-native'
import { HistoryCardItem } from './history-card-item'

interface LocalHistoryCardProps {
    session: TrackingSession
}

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export const LocalHistoryCard: FC<LocalHistoryCardProps> = ({ session }) => {
    const { t } = useTranslation()
    const { measurementUnit } = useAppStore()

    const resort = useMemo(() => {
        if (session.startLatitude && session.startLongitude) {
            return findResortByCoordinate(session.startLatitude, session.startLongitude)
        }
        return null
    }, [session.startLatitude, session.startLongitude])

    const statsData = {
        totalDistance: session.totalDistance,
        vertical: session.maxVertical,
        maxSpeed: session.maxSpeed,
        timeOnSlope: session.timeOnSlope,
        runs: session.totalRuns,
    }

    return (
        <View className='border border-border rounded'>
            <View className='bg-secondary/50 flex flex-row items-center justify-between p-2 px-3'>
                <View className='flex gap-2 flex-row items-center flex-1'>
                    <View className='size-8 rounded-full bg-primary/10 items-center justify-center'>
                        <Icon as={Snowflake} size={16} className='text-primary' />
                    </View>
                    <View className='flex flex-col'>
                        <View className='flex gap-1 flex-row items-center'>
                            <Icon as={Clock} size={12} className='text-primary/80' />
                            <Text className='text-sm font-medium'>
                                {formatDate(session.startTime)}
                            </Text>
                        </View>
                        <View className='flex gap-px flex-row items-center'>
                            <Icon as={MapPin} size={12} className='text-primary/80' />
                            <Text className='text-sm text-primary/80'>
                                {resort?.id !== 'unknown' ? resort?.name : t('history.unknownResort')}
                            </Text>
                        </View>
                    </View>
                </View>
                {!session.isSynced && (
                    <View className='px-2 py-0.5 bg-yellow-500/20 rounded'>
                        <Text className='text-xs text-yellow-600'>{t('localHistory.notSynced')}</Text>
                    </View>
                )}
            </View>
            <Separator />
            <View className='flex flex-row flex-wrap'>
                {Object.entries(HISTORY_CARD_ITEM_SETTINGS).map(([key, item], idx) => {
                    let value: string
                    if (key === 'totalDistance') {
                        value = formatDistanceFromMeters(statsData.totalDistance, measurementUnit)
                    } else if (key === 'type') {
                        value = 'snowboard'
                    } else {
                        value = formatStatValue(
                            statsData[key as keyof typeof statsData],
                            item.unitType,
                            measurementUnit
                        )
                    }
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
        </View>
    )
}
