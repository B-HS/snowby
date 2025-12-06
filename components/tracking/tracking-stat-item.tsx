import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { FC } from 'react'
import { View } from 'react-native'

interface TrackingStatItemProps {
    label: string
    value: string
    className?: string
}

export const TrackingStatItem: FC<TrackingStatItemProps> = ({ label, value, className }) => {
    return (
        <View className={cn('flex-col items-center justify-center py-2', className)}>
            <Text className='text-xs text-primary/80 uppercase'>{label}</Text>
            <Text className='text-xl font-bold'>{value}</Text>
        </View>
    )
}
