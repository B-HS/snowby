import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { FC, ReactNode } from 'react'
import { View } from 'react-native'

interface SettingSectionProps {
    title: string
    icon: ReactNode
    children: ReactNode
}

export const SettingSection: FC<SettingSectionProps> = ({ title, icon, children }) => {
    return (
        <View className='rounded border border-border flex-col'>
            <View className='flex gap-2 p-3 bg-secondary/50 flex-row items-center'>
                {icon}
                <Text className='text-md font-bold'>{title}</Text>
            </View>
            <Separator />
            <View className='p-3'>{children}</View>
        </View>
    )
}
