import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { FC } from 'react'
import { View } from 'react-native'

interface HistoryCardItemProps {
    label: string
    value: number | string
    className?: string
}

export const HistoryCardItem: FC<Partial<HistoryCardItemProps>> = ({ label, value, className }) => {
    return (
        <View className={cn('border-border py-1.5 flex-col items-center w-1/3 gap-0.5', className)}>
            <Text className='text-sm font-black text-primary/90'>{label}</Text>
            <Text className='text-sm text-primary/80'>{value}</Text>
        </View>
    )
}
