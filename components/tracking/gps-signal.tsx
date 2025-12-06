import { Text } from '@/components/ui/text'
import { GPS_SIGNAL_LEVELS } from '@/lib/constant'
import { FC } from 'react'
import { View } from 'react-native'

type SignalLevel = keyof typeof GPS_SIGNAL_LEVELS

interface GpsSignalProps {
    level: SignalLevel
}

export const GpsSignal: FC<GpsSignalProps> = ({ level }) => {
    const { bars, color } = GPS_SIGNAL_LEVELS[level]

    return (
        <View className='flex flex-row items-end gap-0.5'>
            {[1, 2, 3, 4].map((barIndex) => (
                <View
                    key={barIndex}
                    style={{
                        width: 4,
                        height: barIndex * 4 + 4,
                        backgroundColor: barIndex <= bars ? color : '#d1d5db',
                        borderRadius: 1,
                    }}
                />
            ))}
        </View>
    )
}
