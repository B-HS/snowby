import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { Toggle } from '@/components/ui/toggle'
import { useUploadAvatar } from '@/entities/users/users.query'
import { useTranslation } from '@/lib/i18n'
import * as ImagePicker from 'expo-image-picker'
import { X } from 'lucide-react-native'
import { FC, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, View } from 'react-native'

interface ProfileEditModalProps {
    visible: boolean
    onClose: () => void
    initialData: {
        avatarURL: string
        name: string
        bio: string
        isPublic: boolean
    }
    onSave: (data: { avatarURL: string; name: string; bio: string; isPublic: boolean }) => void
}

export const ProfileEditModal: FC<ProfileEditModalProps> = ({ visible, onClose, initialData, onSave }) => {
    const { t } = useTranslation()
    const [avatarURL, setAvatarURL] = useState(initialData.avatarURL)
    const [name, setName] = useState(initialData.name)
    const [bio, setBio] = useState(initialData.bio)
    const [isPublic, setIsPublic] = useState(initialData.isPublic)

    const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar()

    const handleAvatarPress = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permissionResult.granted) {
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
            const imageUri = result.assets[0].uri
            uploadAvatar(imageUri, {
                onSuccess: (data) => {
                    setAvatarURL(data.image)
                },
            })
        }
    }

    const handleSave = () => {
        onSave({ avatarURL, name, bio, isPublic })
        onClose()
    }

    return (
        <Modal visible={visible} animationType='slide' transparent statusBarTranslucent>
            <View className='flex-1 bg-black/50 justify-end'>
                <View className='bg-background rounded-t-xl'>
                    <View className='flex flex-row items-center justify-between p-4'>
                        <Text className='text-lg font-bold'>{t('user.editProfile')}</Text>
                        <Pressable onPress={onClose}>
                            <X size={24} className='text-primary' />
                        </Pressable>
                    </View>
                    <Separator />
                    <View className='p-4 gap-4'>
                        <View className='items-center gap-2'>
                            <Pressable onPress={handleAvatarPress} disabled={isUploading}>
                                <View className='relative'>
                                    <Avatar alt='Profile' className='size-24'>
                                        <AvatarImage source={{ uri: avatarURL }} />
                                        <AvatarFallback>
                                            <Text>{name?.slice(0, 2)}</Text>
                                        </AvatarFallback>
                                    </Avatar>
                                    {isUploading && (
                                        <View className='absolute inset-0 items-center justify-center bg-black/50 rounded-full'>
                                            <ActivityIndicator color='white' />
                                        </View>
                                    )}
                                </View>
                            </Pressable>
                            <Text className='text-sm text-primary/60'>{t('user.tapToChange')}</Text>
                        </View>

                        <View className='gap-2'>
                            <Text className='text-sm font-medium'>{t('user.name')}</Text>
                            <Input value={name} onChangeText={setName} placeholder={t('user.name')} />
                        </View>

                        <View className='gap-2'>
                            <Text className='text-sm font-medium'>{t('user.bio')}</Text>
                            <Input
                                value={bio}
                                onChangeText={setBio}
                                placeholder={t('user.bio')}
                                multiline
                                numberOfLines={3}
                                className='h-20'
                            />
                        </View>

                        <View className='flex flex-row items-center justify-between'>
                            <Text className='text-sm font-medium'>{t('user.isPublic')}</Text>
                            <Toggle pressed={isPublic} onPressedChange={setIsPublic} variant='outline' size='sm'>
                                <Text>{isPublic ? t('user.public') : t('user.private')}</Text>
                            </Toggle>
                        </View>

                        <View className='flex flex-row gap-2 mt-2'>
                            <Button variant='outline' className='flex-1' onPress={onClose}>
                                <Text>{t('user.cancel')}</Text>
                            </Button>
                            <Button className='flex-1' onPress={handleSave}>
                                <Text>{t('user.save')}</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
