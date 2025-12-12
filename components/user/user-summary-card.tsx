import { HistoryCardItem } from '@/components/history/history-card-item'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { USER_SUMMARY_ITEM_SETTINGS } from '@/lib/constant'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { formatStatValue } from '@/lib/units'
import { cn } from '@/lib/utils'
import { FC } from 'react'
import { View } from 'react-native'

interface UserSummaryCardProps {
    totalDistance: number
    vertical: number
    maxSpeed: number
    timeOnSlope: number
    runs: number
    activityTypes: ('ski' | 'snowboard')[]
}

export const UserSummaryCard: FC<Partial<UserSummaryCardProps>> = ({ activityTypes = [], ...rest }) => {
    const { t } = useTranslation()
    const { measurementUnit } = useAppStore()

    const getActivityTypeLabel = () => {
        if (activityTypes.includes('ski') && activityTypes.includes('snowboard')) {
            return t('user.both')
        }
        if (activityTypes.includes('ski')) return t('user.ski')
        if (activityTypes.includes('snowboard')) return t('user.snowboard')
        return '-'
    }

    return (
        <View className='border border-border rounded'>
            <View className='bg-secondary/50 p-2 px-3'>
                <Text className='text-md font-bold'>{t('user.totalSummary')}</Text>
            </View>
            <Separator />
            <View className='flex flex-row flex-wrap'>
                {Object.entries(USER_SUMMARY_ITEM_SETTINGS).map(([key, item], idx) => (
                    <HistoryCardItem
                        key={key}
                        label={t(item.labelKey)}
                        value={formatStatValue(rest[key as keyof typeof rest], item.unitType, measurementUnit)}
                        className={cn(idx % 3 !== 2 && 'border-r', idx >= 3 && 'border-t')}
                    />
                ))}
                <HistoryCardItem
                    label={t('user.activityType')}
                    value={getActivityTypeLabel()}
                    className='border-t'
                />
            </View>
        </View>
    )
}
