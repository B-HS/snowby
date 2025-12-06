import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { i18n } from '@/lib/i18n'
import { signInWithApple, signInWithGoogle } from '@/lib/services/auth'
import { useAppStore } from '@/lib/store'
import { Mountain } from 'lucide-react-native'
import { FC, useState } from 'react'
import { ActivityIndicator, Platform, View } from 'react-native'

export const LoginScreen: FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const setUser = useAppStore((state) => state.setUser)

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await signInWithGoogle()
            if (result.data?.user) {
                setUser({
                    id: result.data.user.id,
                    email: result.data.user.email,
                    name: result.data.user.name,
                    image: result.data.user.image ?? null,
                })
            }
        } catch {
            setError(i18n.t('auth.loginFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleAppleLogin = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await signInWithApple()
            if (result.data?.user) {
                setUser({
                    id: result.data.user.id,
                    email: result.data.user.email,
                    name: result.data.user.name,
                    image: result.data.user.image ?? null,
                })
            }
        } catch {
            setError(i18n.t('auth.loginFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <View className='flex-1 items-center justify-center gap-8 p-6'>
            <View className='items-center gap-4'>
                <View className='size-24 items-center justify-center rounded-full bg-primary/10'>
                    <Icon as={Mountain} size={48} className='text-primary' />
                </View>
                <Text className='text-2xl font-bold'>{i18n.t('auth.loginRequired')}</Text>
                <Text className='text-center text-muted-foreground'>{i18n.t('auth.loginDescription')}</Text>
            </View>

            {error && (
                <View className='rounded-md bg-destructive/10 px-4 py-2'>
                    <Text className='text-destructive'>{error}</Text>
                </View>
            )}

            <View className='w-full max-w-sm gap-3'>
                <Button
                    variant='outline'
                    className='w-full flex-row gap-3'
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size='small' />
                    ) : (
                        <Text className='font-medium'>{i18n.t('auth.continueWithGoogle')}</Text>
                    )}
                </Button>

                {Platform.OS === 'ios' && (
                    <Button
                        variant='default'
                        className='w-full flex-row gap-3 bg-black dark:bg-white'
                        onPress={handleAppleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size='small' color='white' />
                        ) : (
                            <Text className='font-medium text-white dark:text-black'>
                                {i18n.t('auth.continueWithApple')}
                            </Text>
                        )}
                    </Button>
                )}
            </View>
        </View>
    )
}
