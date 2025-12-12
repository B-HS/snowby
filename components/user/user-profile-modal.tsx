import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { useTranslation } from '@/lib/i18n'
import { X } from 'lucide-react-native'
import { FC } from 'react'
import { Modal, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { UserSummaryCard } from './user-summary-card'

interface UserProfileData {
    userId: string
    username: string
    avatarURL: string
    bio?: string
    totalDistance?: number
    vertical?: number
    maxSpeed?: number
    timeOnSlope?: number
    runs?: number
    activityTypes?: ('ski' | 'snowboard')[]
}

interface UserProfileModalProps {
    visible: boolean
    onClose: () => void
    userData: UserProfileData | null
}

export const UserProfileModal: FC<UserProfileModalProps> = ({ visible, onClose, userData }) => {
    const { t } = useTranslation()

    if (!userData) return null

    return (
        <Modal visible={visible} animationType='slide' statusBarTranslucent>
            <SafeAreaView className='flex-1 bg-background'>
                <View className='flex flex-row items-center justify-between p-4'>
                    <Text className='text-lg font-bold'>{t('user.title')}</Text>
                    <Button variant='ghost' size='icon' onPress={onClose}>
                        <Icon as={X} size={24} className='text-foreground' />
                    </Button>
                </View>
                <Separator />
                <ScrollView className='flex-1 p-4' contentContainerClassName='gap-4 pb-8'>
                    <View className='items-center gap-2'>
                        <Avatar alt={`${userData.username}'s Avatar`} className='size-24'>
                            <AvatarImage source={{ uri: userData.avatarURL }} />
                            <AvatarFallback>
                                <Text className='text-2xl'>{userData.username?.slice(0, 2)}</Text>
                            </AvatarFallback>
                        </Avatar>
                        <Text className='text-xl font-bold'>{userData.username}</Text>
                        {userData.bio && (
                            <Text className='text-center text-sm text-primary/70'>{userData.bio}</Text>
                        )}
                    </View>

                    <UserSummaryCard
                        totalDistance={userData.totalDistance}
                        vertical={userData.vertical}
                        maxSpeed={userData.maxSpeed}
                        timeOnSlope={userData.timeOnSlope}
                        runs={userData.runs}
                        activityTypes={userData.activityTypes}
                    />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    )
}
