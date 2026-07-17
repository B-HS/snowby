import { LocalHistoryCard } from '@/components/history/local-history-card'
import { Text } from '@/components/ui/text'
import { getCompletedSessions } from '@/lib/database/queries'
import { initializeDatabase } from '@/lib/database/db'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import type { TrackingSession } from '@/lib/tracking/tracking.types'
import { useFocusEffect } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native'

const LocalHistories = () => {
    const { t } = useTranslation()
    const { user } = useAppStore()
    const userId = user?.id ?? 'anonymous'
    const [sessions, setSessions] = useState<TrackingSession[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const loadSessions = async () => {
        try {
            await initializeDatabase()
            const data = await getCompletedSessions(userId)
            setSessions(data)
        } catch (error) {
            console.error('Failed to load local sessions:', error)
        }
    }

    const onRefresh = async () => {
        setIsRefreshing(true)
        await loadSessions()
        setIsRefreshing(false)
    }

    useFocusEffect(() => {
        const init = async () => {
            setIsLoading(true)
            await loadSessions()
            setIsLoading(false)
        }
        init()
    })

    if (isLoading) {
        return (
            <View className='flex-1 items-center justify-center'>
                <ActivityIndicator size='large' />
            </View>
        )
    }

    return (
        <ScrollView
            className='flex-1 p-3.5'
            contentContainerClassName='gap-3.5'
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
            {sessions.length === 0 ? (
                <View className='items-center py-8'>
                    <Text className='text-primary/60'>{t('localHistory.noItems')}</Text>
                    <Text className='text-primary/40 text-sm mt-1'>{t('localHistory.noItemsDescription')}</Text>
                </View>
            ) : (
                sessions.map((session) => <LocalHistoryCard key={session.id} session={session} />)
            )}
        </ScrollView>
    )
}

export default LocalHistories
