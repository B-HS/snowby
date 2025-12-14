import { HistoryCard } from '@/components/history/history-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { LoginScreen } from '@/components/user/login-screen'
import { ProfileEditModal } from '@/components/user/profile-edit-modal'
import { UserSummaryCard } from '@/components/user/user-summary-card'
import { useSelfHistory } from '@/entities/activities/activities.query'
import { useUpdateProfile, useUserProfile, useUserSummary } from '@/entities/users/users.query'
import { useAppStore } from '@/lib/store'
import type { HistoryItem } from '@/lib/types'
import { getImageUrl } from '@/lib/utils'
import { Edit } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'

const User = () => {
    const [isModalVisible, setIsModalVisible] = useState(false)
    const { user, isAuthenticated, setUser } = useAppStore()

    const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(user?.id ?? '')
    const { data: userSummary, isLoading: isSummaryLoading } = useUserSummary(user?.id ?? '')
    const { data: myHistoryItems, isLoading: isHistoryLoading } = useSelfHistory()
    const { mutate: updateProfile } = useUpdateProfile()

    if (!isAuthenticated) {
        return <LoginScreen />
    }

    const isLoading = isProfileLoading || isSummaryLoading || isHistoryLoading

    if (isLoading) {
        return (
            <View className='flex-1 items-center justify-center'>
                <ActivityIndicator size='large' />
            </View>
        )
    }

    return (
        <>
            <ScrollView className='p-3.5' contentContainerClassName='gap-3.5'>
                <View className='items-center gap-2'>
                    <View className='relative'>
                        <Avatar alt={`${user?.name}'s Avatar`} className='size-24'>
                            <AvatarImage source={{ uri: getImageUrl(user?.image) }} />
                            <AvatarFallback>
                                <Text className='text-2xl'>{user?.name?.slice(0, 2)}</Text>
                            </AvatarFallback>
                        </Avatar>
                        <Pressable
                            onPress={() => setIsModalVisible(true)}
                            className='absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5'>
                            <Icon as={Edit} size={14} className='text-primary-foreground' />
                        </Pressable>
                    </View>
                    <Text className='text-xl font-bold'>{user?.name}</Text>
                    {userProfile?.bio && (
                        <Text className='text-center text-sm text-primary/70'>{userProfile.bio}</Text>
                    )}
                </View>

                <UserSummaryCard
                    totalDistance={userSummary?.totalDistance}
                    vertical={userSummary?.vertical}
                    maxSpeed={userSummary?.maxSpeed}
                    timeOnSlope={userSummary?.timeOnSlope}
                    runs={userSummary?.runs}
                    activityTypes={userProfile?.activityTypes ?? []}
                />

                {myHistoryItems?.map((item: HistoryItem) => (
                    <HistoryCard
                        key={item.id}
                        userId={item.userId}
                        username={item.username}
                        avatarURL={item.avatarURL}
                        locationLatitude={item.locationLatitude}
                        locationLongitude={item.locationLongitude}
                        type={item.type}
                        totalDistance={item.totalDistance}
                        vertical={item.vertical}
                        maxSpeed={item.maxSpeed}
                        timeOnSlope={item.timeOnSlope}
                        runs={item.runs}
                        isPublic={item.isPublic}
                    />
                ))}
            </ScrollView>

            <ProfileEditModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                initialData={{
                    avatarURL: getImageUrl(user?.image),
                    name: user?.name ?? '',
                    bio: userProfile?.bio ?? '',
                    isPublic: userProfile?.isPublic ?? true,
                }}
                onSave={(data) => {
                    updateProfile({ bio: data.bio, isPublic: data.isPublic })
                    if (user) setUser({ ...user, name: data.name, image: data.avatarURL })
                }}
            />
        </>
    )
}

export default User
