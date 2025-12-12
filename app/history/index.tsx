import { HistoryCard } from '@/components/history/history-card'
import { Text } from '@/components/ui/text'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFeed } from '@/entities/activities/activities.query'
import { useFollowUser, useHideUser, useReportUser, useUnfollowUser } from '@/entities/social/social.query'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'
import type { HistoryFilter } from '@/lib/types'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'

const History = () => {
    const { t } = useTranslation()
    const [filter, setFilter] = useState<HistoryFilter>('all')

    const {
        followUser: followUserStore,
        unfollowUser: unfollowUserStore,
        hideUser: hideUserStore,
        isFollowing,
        isHidden,
    } = useAppStore()

    const { data: feedData, isLoading } = useFeed(filter)
    const { mutate: followUser } = useFollowUser()
    const { mutate: unfollowUser } = useUnfollowUser()
    const { mutate: hideUser } = useHideUser()
    const { mutate: reportUser } = useReportUser()

    const filteredItems =
        feedData?.items.filter((item) => {
            if (isHidden(item.userId)) return false
            if (filter === 'friend') return isFollowing(item.userId)
            return true
        }) ?? []

    if (isLoading) {
        return (
            <View className='flex-1 items-center justify-center'>
                <ActivityIndicator size='large' />
            </View>
        )
    }

    return (
        <>
            <View className='p-3.5 pb-0'>
                <ToggleGroup
                    type='single'
                    value={filter}
                    onValueChange={(value) => value && setFilter(value as HistoryFilter)}
                    className='w-full'
                    variant='outline'>
                    <ToggleGroupItem value='all' isFirst className='flex-1'>
                        <Text>{t('history.all')}</Text>
                    </ToggleGroupItem>
                    <ToggleGroupItem value='friend' isLast className='flex-1'>
                        <Text>{t('history.friend')}</Text>
                    </ToggleGroupItem>
                </ToggleGroup>
            </View>
            <ScrollView className='p-3.5' contentContainerClassName='gap-3.5'>
                {filteredItems.map((item) => (
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
                        isFollowing={isFollowing(item.userId)}
                        onFollow={(id) => followUser(id, { onSuccess: () => followUserStore(id) })}
                        onUnfollow={(id) => unfollowUser(id, { onSuccess: () => unfollowUserStore(id) })}
                        onHide={(id) => hideUser(id, { onSuccess: () => hideUserStore(id) })}
                        onReport={(id) => reportUser({ userId: id, reason: 'inappropriate' })}
                    />
                ))}
                {filteredItems.length === 0 && (
                    <View className='items-center py-8'>
                        <Text className='text-primary/60'>{t('history.noItems')}</Text>
                    </View>
                )}
            </ScrollView>
        </>
    )
}

export default History
