import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { formatStatValue, formatDistanceFromMeters } from '@/lib/units'
import type { TrackingData, TrackingStatus, ActivityState, GPSSignalLevel } from '@/lib/tracking/tracking.types'
import { findResortByCoordinate } from '@/lib/utils/resort-matcher'
import { FC, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { GpsSignal } from './gps-signal'
import { TrackingStatItem } from './tracking-stat-item'

interface TrackingStatsProps {
    gpsLevel: GPSSignalLevel
    trackingStatus: TrackingStatus
    trackingData: TrackingData
    activityState: ActivityState
}

const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const ACTIVITY_STATE_KEYS: Record<ActivityState, string> = {
    skiing: 'tracking.skiing',
    lifting: 'tracking.lifting',
    resting: 'tracking.resting',
}

export const TrackingStats: FC<TrackingStatsProps> = ({
    gpsLevel,
    trackingStatus,
    trackingData,
    activityState,
}) => {
    const { t } = useTranslation()
    const { measurementUnit } = useAppStore()
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

    const currentResort = useMemo(() => {
        const lat = trackingData.currentLatitude || trackingData.startLatitude
        const lng = trackingData.currentLongitude || trackingData.startLongitude
        if (lat && lng) {
            return findResortByCoordinate(lat, lng)
        }
        return null
    }, [trackingData.currentLatitude, trackingData.currentLongitude, trackingData.startLatitude, trackingData.startLongitude])

    return (
        <View className='flex-1'>
            <View className='flex flex-row items-center justify-center gap-7 mb-2'>
                <View className='flex flex-row items-center gap-2'>
                    <GpsSignal level={gpsLevel} />
                    <Text className='text-xs text-primary/80'>GPS</Text>
                </View>
                <Text className='text-xs text-primary/80'>
                    {currentResort?.id !== 'unknown' ? currentResort?.name : t('history.unknownResort')}
                </Text>
                {trackingStatus !== 'stop' && (
                    <Text className='text-xs font-medium'>{t(ACTIVITY_STATE_KEYS[activityState])}</Text>
                )}
            </View>
            <Separator className='mb-2' />
            <View className='flex flex-row flex-wrap'>
                <TrackingStatItem
                    label={t('tracking.totalDistance')}
                    value={formatDistanceFromMeters(trackingData.totalDistance, measurementUnit)}
                    className='w-1/2'
                />
                <TrackingStatItem
                    label={t('tracking.maxVertical')}
                    value={formatStatValue(trackingData.maxVertical, 'vertical', measurementUnit)}
                    className='w-1/2'
                />
                <TrackingStatItem
                    label={t('tracking.totalRuns')}
                    value={`${trackingData.totalRuns}`}
                    className='w-1/2'
                />
                <TrackingStatItem
                    label={t('tracking.maxSpeed')}
                    value={formatStatValue(trackingData.maxSpeed, 'speed', measurementUnit)}
                    className='w-1/2'
                />
                <TrackingStatItem
                    label={t('tracking.totalTime')}
                    value={formatElapsedTime(elapsedSeconds)}
                    className='w-1/2'
                />
                <TrackingStatItem
                    label={t('tracking.timeOnSlope')}
                    value={formatElapsedTime(trackingData.timeOnSlope)}
                    className='w-1/2'
                />
            </View>
        </View>
    )
}
