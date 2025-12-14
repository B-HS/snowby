import { FC } from 'react'
import { Modal, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import type { UnfinishedSessionInfo, RecoveryOption } from '@/lib/tracking/tracking.types'
import dayjs from 'dayjs'

interface RecoveryModalProps {
    visible: boolean
    sessionInfo: UnfinishedSessionInfo | null
    onSelect: (option: RecoveryOption) => void
    onDismiss: () => void
}

export const RecoveryModal: FC<RecoveryModalProps> = ({
    visible,
    sessionInfo,
    onSelect,
    onDismiss,
}) => {
    const { t } = useTranslation()

    if (!sessionInfo?.session) return null

    const { session, locationCount } = sessionInfo
    const startDate = dayjs(session.startTime).format('YYYY-MM-DD HH:mm')
    const distance = (session.totalDistance / 1000).toFixed(1)

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
            <View className="flex-1 items-center justify-center bg-black/50 px-6">
                <View className="w-full rounded-2xl bg-white p-6 dark:bg-gray-800">
                    <Text className="mb-4 text-center text-xl font-bold">{t('recovery.title')}</Text>

                    <View className="mb-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                        <View className="mb-2 flex-row justify-between">
                            <Text className="text-gray-600 dark:text-gray-300">{t('recovery.start')}</Text>
                            <Text className="font-medium">{startDate}</Text>
                        </View>
                        <View className="mb-2 flex-row justify-between">
                            <Text className="text-gray-600 dark:text-gray-300">{t('recovery.distance')}</Text>
                            <Text className="font-medium">{distance}km</Text>
                        </View>
                        <View className="mb-2 flex-row justify-between">
                            <Text className="text-gray-600 dark:text-gray-300">{t('recovery.runs')}</Text>
                            <Text className="font-medium">{session.totalRuns}{t('recovery.runUnit')}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-600 dark:text-gray-300">{t('recovery.locationRecords')}</Text>
                            <Text className="font-medium">{locationCount}{t('recovery.countUnit')}</Text>
                        </View>
                    </View>

                    <View className="gap-3">
                        <Button
                            className="bg-blue-500"
                            onPress={() => onSelect('resume')}>
                            <Text className="font-semibold text-white">{t('recovery.resume')}</Text>
                        </Button>

                        <Button
                            variant="outline"
                            onPress={() => onSelect('new')}>
                            <Text className="font-semibold">{t('recovery.startNew')}</Text>
                        </Button>

                        <Button
                            variant="ghost"
                            onPress={() => onSelect('delete')}>
                            <Text className="text-red-500">{t('recovery.delete')}</Text>
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
