import { HistoryCard } from '@/components/history/history-card'
import { ComponentProps } from 'react'
import { ScrollView } from 'react-native'

const MOCK_HISTORY_ITEMS: ComponentProps<typeof HistoryCard>[] = [
    {
        username: 'John Doe',
        avatarURL: 'https://github.com/mrzachnugent.png',
        locationLatitude: 37.7749,
        locationLongitude: -122.4194,
        type: 'snowboard',
        totalDistance: 100,
        vertical: 100,
        maxSpeed: 100,
        timeOnSlope: 100,
        runs: 100,
    },
    {
        username: 'Jane Doe',
        avatarURL: 'https://github.com/jane-doe.png',
        locationLatitude: 37.7749,
        locationLongitude: -122.4194,
        vertical: 200,
        maxSpeed: 100,
        timeOnSlope: 100,
        runs: 100,
        type: 'ski',
        totalDistance: 200,
    },
    {
        username: 'Jim Doe',
        avatarURL: 'https://github.com/jim-doe.png',
        locationLatitude: 37.7749,
        locationLongitude: -122.4194,
        type: 'snowboard',
        totalDistance: 300,
        vertical: 300,
        maxSpeed: 100,
        timeOnSlope: 100,
        runs: 100,
    },
]

const History = () => {
    return (
        <ScrollView className='p-3.5' contentContainerClassName='gap-3.5'>
            {[...MOCK_HISTORY_ITEMS, ...MOCK_HISTORY_ITEMS, ...MOCK_HISTORY_ITEMS].map((item, idx) => (
                <HistoryCard key={(item.username ?? '') + idx} {...item} />
            ))}
        </ScrollView>
    )
}

export default History
