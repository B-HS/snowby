import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { TrackingStatus } from '@/lib/tracking/tracking.types'
import { Flag, Pause, Play, Square } from 'lucide-react-native'
import { FC } from 'react'
import { View } from 'react-native'

interface TrackingControlsProps {
    trackingStatus: TrackingStatus
    onStart: () => void
    onPause: () => void
    onResume: () => void
    onStop: () => void
}

export const TrackingControls: FC<TrackingControlsProps> = ({
    trackingStatus,
    onStart,
    onPause,
    onResume,
    onStop,
}) => {
    return (
        <View className='h-20 flex flex-row justify-center my-7'>
            <View className='flex flex-row gap-2'>
                {trackingStatus === 'stop' && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={onStart}>
                        <Icon as={Flag} size={24} />
                    </Button>
                )}
                {trackingStatus === 'start' && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={onPause}>
                        <Icon as={Pause} size={24} />
                    </Button>
                )}
                {trackingStatus === 'pause' && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={onResume}>
                        <Icon as={Play} size={24} />
                    </Button>
                )}
                {(trackingStatus === 'start' || trackingStatus === 'pause') && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={onStop}>
                        <Icon as={Square} size={24} />
                    </Button>
                )}
            </View>
        </View>
    )
}
