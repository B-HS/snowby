import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { TRACKING_STATS_SETTINGS } from '@/lib/constant'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { formatStatValue } from '@/lib/units'
import { FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import { GpsSignal } from './gps-signal'
import { TrackingStatItem } from './tracking-stat-item'

type SignalLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'none'

interface TrackingStatsProps {
    gpsLevel: SignalLevel
}

const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const TrackingStats: FC<TrackingStatsProps> = ({ gpsLevel }) => {
    const { t } = useTranslation()
    const { trackingData, trackingStatus, measurementUnit } = useAppStore()
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null

        if (trackingStatus === 'start' && trackingData.startTime) {
            const updateElapsed = () => {
                const now = Date.now()
                const elapsed = Math.floor((now - trackingData.startTime!) / 1000)
                setElapsedSeconds(elapsed)
            }

            updateElapsed()
            interval = setInterval(updateElapsed, 1000)
        } else if (trackingStatus === 'stop') {
            setElapsedSeconds(0)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [trackingStatus, trackingData.startTime])

    const formatCoordinate = (lat: number, lon: number) => {
        if (lat === 0 && lon === 0) return '--'
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }

    return (
        <View className='flex-1 p-3'>
            <View className='flex flex-row items-center justify-center gap-7 mb-2'>
                <View className='flex flex-row items-center gap-2'>
                    <GpsSignal level={gpsLevel} />
                    <Text className='text-xs text-primary/80'>GPS</Text>
                </View>
                <Text className='text-xs text-primary/80'>{formatCoordinate(trackingData.startLatitude, trackingData.startLongitude)}</Text>
            </View>
            <Separator className='mb-2' />
            <View className='flex flex-row flex-wrap'>
                {Object.entries(TRACKING_STATS_SETTINGS).map(([key, item]) => (
                    <TrackingStatItem
                        key={key}
                        label={t(item.labelKey)}
                        value={formatStatValue(trackingData[key as keyof typeof trackingData] as number, item.unitType, measurementUnit)}
                        className='w-1/2'
                    />
                ))}
                <TrackingStatItem label={t('tracking.totalTime')} value={formatElapsedTime(elapsedSeconds)} className='w-full' />
            </View>
        </View>
    )
}
