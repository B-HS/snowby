import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { useUserProfile } from '@/entities/users/users.query'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import { getImageUrl } from '@/lib/utils'
import { Eye, User, X } from 'lucide-react-native'
import { FC } from 'react'
import { Modal, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface HiddenUserItemProps {
    userId: string
    onUnhide: (userId: string) => void
}

const HiddenUserItem: FC<HiddenUserItemProps> = ({ userId, onUnhide }) => {
    const { t } = useTranslation()
    const { data: profile } = useUserProfile(userId)

    return (
        <View className='flex flex-row items-center justify-between p-3 border border-border rounded'>
            <View className='flex flex-row items-center gap-3 flex-1 min-w-0'>
                <Avatar alt={`${profile?.name}'s Avatar`} className='size-10'>
                    <AvatarImage source={{ uri: getImageUrl(profile?.image) }} />
                    <AvatarFallback>
                        <Icon as={User} size={20} className='text-primary/60' />
                    </AvatarFallback>
                </Avatar>
                <Text className='font-medium flex-1 line-clamp-1' numberOfLines={1}>
                    {profile?.name || t('history.privateUser')}
                </Text>
            </View>
            <Button variant='outline' size='sm' onPress={() => onUnhide(userId)} className='ml-2'>
                <Icon as={Eye} size={16} className='text-foreground mr-1' />
                <Text>{t('settings.unhide')}</Text>
            </Button>
        </View>
    )
}

interface HiddenUsersModalProps {
    visible: boolean
    onClose: () => void
}

export const HiddenUsersModal: FC<HiddenUsersModalProps> = ({ visible, onClose }) => {
    const { t } = useTranslation()
    const { hiddenUserIds, unhideUser } = useAppStore()

    const handleUnhide = (userId: string) => {
        unhideUser(userId)
    }

    return (
        <Modal visible={visible} animationType='slide' statusBarTranslucent>
            <SafeAreaView className='flex-1 bg-background' edges={['top', 'bottom', 'left', 'right']} mode='padding'>
                <View className='flex flex-row items-center justify-between p-4'>
                    <Text className='text-lg font-bold'>{t('settings.hiddenUsers')}</Text>
                    <Button variant='ghost' size='icon' onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Icon as={X} size={24} className='text-foreground' />
                    </Button>
                </View>
                <Separator />
                <ScrollView className='flex-1 p-4' contentContainerClassName='gap-3'>
                    {hiddenUserIds.length === 0 ? (
                        <View className='flex-1 items-center justify-center py-8'>
                            <Text className='text-primary/60'>{t('settings.noHiddenUsers')}</Text>
                        </View>
                    ) : (
                        hiddenUserIds.map((userId) => (
                            <HiddenUserItem key={userId} userId={userId} onUnhide={handleUnhide} />
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    )
}
