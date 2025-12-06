import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useAppStore } from '@/lib/store'
import { Flag, Pause, Play, ScrollText, Search, Square } from 'lucide-react-native'
import { FC } from 'react'
import { View } from 'react-native'

interface TrackingControlsProps {
    onHistoryPress: () => void
    onSearchPress: () => void
}

export const TrackingControls: FC<TrackingControlsProps> = ({ onHistoryPress, onSearchPress }) => {
    const { trackingStatus, setTrackingStatus, resetTrackingData } = useAppStore()

    const handleStart = () => {
        setTrackingStatus('start')
    }

    const handlePause = () => {
        setTrackingStatus('pause')
    }

    const handleResume = () => {
        setTrackingStatus('start')
    }

    const handleStop = () => {
        setTrackingStatus('stop')
        resetTrackingData()
    }

    return (
        <View className='h-20 flex flex-row justify-center my-7'>
            <View className='flex flex-row gap-2'>
                {trackingStatus === 'stop' && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={handleStart}>
                        <Icon as={Flag} size={24} />
                    </Button>
                )}
                {trackingStatus === 'start' && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={handlePause}>
                        <Icon as={Pause} size={24} />
                    </Button>
                )}
                {trackingStatus === 'pause' && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={handleResume}>
                        <Icon as={Play} size={24} />
                    </Button>
                )}
                {(trackingStatus === 'start' || trackingStatus === 'pause') && (
                    <Button variant='outline' size='icon' className='size-16 rounded-full' onPress={handleStop}>
                        <Icon as={Square} size={24} />
                    </Button>
                )}
            </View>
        </View>
    )
}
