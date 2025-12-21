import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { useUserProfile, useUserSummary } from '@/entities/users/users.query'
import { useTranslation } from '@/lib/i18n'
import { getImageUrl } from '@/lib/utils'
import { X } from 'lucide-react-native'
import { FC, useEffect, useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { UserSummaryCard } from './user-summary-card'

interface UserProfileModalProps {
    visible: boolean
    onClose: () => void
    userId: string | null
}

export const UserProfileModal: FC<UserProfileModalProps> = ({ visible, onClose, userId }) => {
    const { t } = useTranslation()
    const [shouldFetch, setShouldFetch] = useState(false)

    useEffect(() => {
        if (visible && userId) {
            setShouldFetch(true)
        } else if (!visible) {
            setShouldFetch(false)
        }
    }, [visible, userId])

    const { data: profile, isLoading: isProfileLoading } = useUserProfile(shouldFetch ? (userId ?? '') : '')
    const { data: summary, isLoading: isSummaryLoading } = useUserSummary(shouldFetch ? (userId ?? '') : '')

    const isLoading = isProfileLoading || isSummaryLoading

    if (!userId) return null

    return (
        <Modal visible={visible} animationType='slide' presentationStyle='fullScreen'>
            <SafeAreaView className='flex-1 bg-background' edges={['top', 'bottom', 'left', 'right']}>
                <View className='flex flex-row items-center justify-between p-4'>
                    <Text className='text-lg font-bold'>{t('user.title')}</Text>
                    <Button variant='ghost' size='icon' onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Icon as={X} size={24} className='text-foreground' />
                    </Button>
                </View>
                <Separator />
                {isLoading ? (
                    <View className='flex-1 items-center justify-center'>
                        <ActivityIndicator size='large' />
                    </View>
                ) : (
                    <ScrollView className='flex-1 p-4' contentContainerClassName='gap-4 pb-8'>
                        <View className='items-center gap-2'>
                            <Avatar alt={`${profile?.name}'s Avatar`} className='size-24'>
                                <AvatarImage source={{ uri: getImageUrl(profile?.image) }} />
                                <AvatarFallback>
                                    <Text className='text-2xl'>{profile?.name?.slice(0, 2)}</Text>
                                </AvatarFallback>
                            </Avatar>
                            <Text className='text-xl font-bold'>{profile?.name}</Text>
                            {profile?.bio && <Text className='text-center text-sm text-primary/70'>{profile.bio}</Text>}
                        </View>

                        <UserSummaryCard
                            totalDistance={summary?.totalDistance}
                            vertical={summary?.vertical}
                            maxSpeed={summary?.maxSpeed}
                            timeOnSlope={summary?.timeOnSlope}
                            runs={summary?.runs}
                            activityTypes={profile?.activityTypes}
                        />
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    )
}
