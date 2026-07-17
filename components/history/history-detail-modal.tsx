import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { useActivityDetail } from '@/entities/activities/activities.query'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import type { TrackingRun } from '@/lib/types'
import { convertSpeed, convertVertical, formatDistanceFromMeters, formatDuration, getSpeedUnit, getVerticalUnit } from '@/lib/units'
import { findResortByCoordinate, getCameraPositionForResort } from '@/lib/utils/resort-matcher'
import { MapPin, X } from 'lucide-react-native'
import { FC } from 'react'
import { ActivityIndicator, Modal, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MapView, type PolylineData } from '@/components/map/map-view'

interface HistoryDetailModalProps {
    visible: boolean
    onClose: () => void
    activityId: string | null
}

const SKIING_POLYLINE_COLOR = '#ef4444'
const SKIING_POLYLINE_WIDTH = 3

const RunCard: FC<{ run: TrackingRun; index: number; measurementUnit: 'metric' | 'imperial' }> = ({ run, index, measurementUnit }) => {
    const { t } = useTranslation()

    return (
        <View className='border border-border rounded p-3 gap-2'>
            <Text className='font-bold text-primary'>
                {t('history.run')} #{index + 1}
            </Text>
            <View className='flex flex-row flex-wrap gap-y-2'>
                <View className='w-1/2'>
                    <Text className='text-xs text-primary/60'>{t('uicard.totalDistance')}</Text>
                    <Text className='font-medium'>{formatDistanceFromMeters(run.distance, measurementUnit)}</Text>
                </View>
                <View className='w-1/2'>
                    <Text className='text-xs text-primary/60'>{t('history.verticalDrop')}</Text>
                    <Text className='font-medium'>
                        {convertVertical(run.verticalDrop, measurementUnit)} {getVerticalUnit(measurementUnit)}
                    </Text>
                </View>
                <View className='w-1/2'>
                    <Text className='text-xs text-primary/60'>{t('uicard.maxSpeed')}</Text>
                    <Text className='font-medium'>
                        {convertSpeed(run.maxSpeed, measurementUnit)} {getSpeedUnit(measurementUnit)}
                    </Text>
                </View>
                <View className='w-1/2'>
                    <Text className='text-xs text-primary/60'>{t('history.avgSpeed')}</Text>
                    <Text className='font-medium'>
                        {convertSpeed(run.avgSpeed, measurementUnit)} {getSpeedUnit(measurementUnit)}
                    </Text>
                </View>
                <View className='w-1/2'>
                    <Text className='text-xs text-primary/60'>{t('history.duration')}</Text>
                    <Text className='font-medium'>{formatDuration(run.duration)}</Text>
                </View>
            </View>
        </View>
    )
}

export const HistoryDetailModal: FC<HistoryDetailModalProps> = ({ visible, onClose, activityId }) => {
    const { t } = useTranslation()
    const { measurementUnit } = useAppStore()
    const { data, isLoading } = useActivityDetail(activityId ?? '')

    const coordinate =
        data?.activity?.locationLatitude && data?.activity?.locationLongitude
            ? { latitude: data.activity.locationLatitude, longitude: data.activity.locationLongitude }
            : null
    const resort = coordinate ? findResortByCoordinate(coordinate.latitude, coordinate.longitude) : null
    const cameraPosition = coordinate ? getCameraPositionForResort(coordinate.latitude, coordinate.longitude) : undefined

    const skiingLocations = data?.locations?.filter((loc) => loc.activityState === 'skiing') ?? []
    const polylines: PolylineData[] = []
    let currentSegment: { latitude: number; longitude: number }[] = []
    let currentSegmentIndex = skiingLocations[0]?.segmentIndex ?? 0

    for (const loc of skiingLocations) {
        if (loc.segmentIndex !== currentSegmentIndex && currentSegment.length > 0) {
            polylines.push({ points: currentSegment, color: SKIING_POLYLINE_COLOR, width: SKIING_POLYLINE_WIDTH })
            currentSegment = []
            currentSegmentIndex = loc.segmentIndex
        }
        currentSegment.push({ latitude: loc.latitude, longitude: loc.longitude })
    }

    if (currentSegment.length > 0) {
        polylines.push({ points: currentSegment, color: SKIING_POLYLINE_COLOR, width: SKIING_POLYLINE_WIDTH })
    }

    if (!activityId) return null

    return (
        <Modal visible={visible} animationType='slide' presentationStyle='fullScreen'>
            <SafeAreaView className='flex-1 bg-background' edges={['top', 'bottom', 'left', 'right']}>
                <View className='flex flex-row items-center justify-between p-4'>
                    <Text className='text-lg font-bold'>{t('history.detail')}</Text>
                    <Button variant='ghost' size='icon' onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Icon as={X} size={24} className='text-foreground' />
                    </Button>
                </View>
                <Separator />

                {isLoading ? (
                    <View className='flex-1 items-center justify-center'>
                        <ActivityIndicator size='large' />
                    </View>
                ) : (
                    <ScrollView className='flex-1' contentContainerClassName='p-4 gap-4 pb-8'>
                        {data?.locations && data.locations.length > 0 && cameraPosition ? (
                            <View className='h-64 rounded-lg overflow-hidden border border-border'>
                                <MapView style={{ flex: 1 }} cameraPosition={cameraPosition} polylines={polylines} />
                            </View>
                        ) : (
                            <View className='h-64 rounded-lg bg-secondary/30 items-center justify-center'>
                                <Text className='text-primary/60'>{t('history.noLocations')}</Text>
                            </View>
                        )}

                        <View className='flex flex-row items-center gap-1'>
                            <Icon as={MapPin} size={14} className='text-primary/80' />
                            <Text className='text-sm text-primary/80'>{resort?.id !== 'unknown' ? resort?.name : t('history.unknownResort')}</Text>
                        </View>

                        <Separator />

                        <View>
                            <Text className='text-lg font-bold mb-3'>{t('history.runsDetail')}</Text>
                            {data?.runs && data.runs.length > 0 ? (
                                <View className='gap-3'>
                                    {data.runs.map((run, index) => (
                                        <RunCard key={run.id} run={run} index={index} measurementUnit={measurementUnit} />
                                    ))}
                                </View>
                            ) : (
                                <View className='py-8 items-center'>
                                    <Text className='text-primary/60'>{t('history.noRuns')}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    )
}
