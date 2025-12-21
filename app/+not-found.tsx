import { Link, Stack } from 'expo-router'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useTranslation } from '@/lib/i18n'

const NotFoundScreen = () => {
    const { t } = useTranslation()

    return (
        <>
            <Stack.Screen options={{ title: t('common.oops') }} />
            <View>
                <Text>{t('common.screenNotFound')}</Text>

                <Link href='/'>
                    <Text>{t('common.goHome')}</Text>
                </Link>
            </View>
        </>
    )
}

export default NotFoundScreen
