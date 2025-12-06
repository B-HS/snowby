import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { FC, ReactNode } from 'react'
import { View } from 'react-native'

interface SettingRowProps {
    label: string
    children: ReactNode
    isLast?: boolean
}

export const SettingRow: FC<SettingRowProps> = ({ label, children, isLast }) => {
    return (
        <View className={cn(!isLast && 'mb-3 border-b border-border pb-3', 'flex-row items-center justify-between')}>
            <Text className='text-sm text-primary/80'>{label}</Text>
            {children}
        </View>
    )
}
