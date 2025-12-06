import { HistoryCard } from '@/components/history/history-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { LoginScreen } from '@/components/user/login-screen'
import { ProfileEditModal } from '@/components/user/profile-edit-modal'
import { UserSummaryCard } from '@/components/user/user-summary-card'
import { useAppStore } from '@/lib/store'
import { Stack } from 'expo-router'
import { Edit } from 'lucide-react-native'
import { ComponentProps, useState } from 'react'
import { ScrollView, View } from 'react-native'

const MOCK_SUMMARY = {
    totalDistance: 1500,
    vertical: 8500,
    maxSpeed: 85,
    timeOnSlope: 36000,
    runs: 45,
    activityTypes: ['ski', 'snowboard'] as ('ski' | 'snowboard')[],
}

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
        username: 'John Doe',
        avatarURL: 'https://github.com/mrzachnugent.png',
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
        username: 'John Doe',
        avatarURL: 'https://github.com/mrzachnugent.png',
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

const User = () => {
    const [isModalVisible, setIsModalVisible] = useState(false)
    const { user, isAuthenticated, setUser } = useAppStore()

    const [profileData, setProfileData] = useState({
        avatarURL: user?.image ?? '',
        name: user?.name ?? '',
        bio: '',
        isPublic: true,
    })

    const handleSave = (data: typeof profileData) => {
        setProfileData(data)
        if (user) {
            setUser({
                ...user,
                name: data.name,
                image: data.avatarURL,
            })
        }
    }

    if (!isAuthenticated) {
        return (
            <>
                <Stack.Screen options={{ headerLeft: () => null }} />
                <LoginScreen />
            </>
        )
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerLeft: () => (
                        <Button variant='ghost' size='icon' onPress={() => setIsModalVisible(true)}>
                            <Icon as={Edit} size={20} className='text-primary' />
                        </Button>
                    ),
                }}
            />
            <ScrollView className='p-3.5' contentContainerClassName='gap-3.5'>
                <View className='items-center gap-2'>
                    <Avatar alt={`${user?.name}'s Avatar`} className='size-24'>
                        <AvatarImage source={{ uri: user?.image ?? '' }} />
                        <AvatarFallback>
                            <Text className='text-2xl'>{user?.name?.slice(0, 2)}</Text>
                        </AvatarFallback>
                    </Avatar>
                    <Text className='text-xl font-bold'>{user?.name}</Text>
                    {profileData.bio && (
                        <Text className='text-center text-sm text-primary/70'>{profileData.bio}</Text>
                    )}
                </View>

                <UserSummaryCard {...MOCK_SUMMARY} />

                {MOCK_HISTORY_ITEMS.map((item, idx) => (
                    <HistoryCard key={(item.username ?? '') + idx} {...item} />
                ))}
            </ScrollView>

            <ProfileEditModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                initialData={{
                    ...profileData,
                    avatarURL: user?.image ?? '',
                    name: user?.name ?? '',
                }}
                onSave={handleSave}
            />
        </>
    )
}

export default User
