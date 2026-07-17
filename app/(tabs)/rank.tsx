import { RankItem } from '@/components/rank/rank-item'
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select'
import { Text } from '@/components/ui/text'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useRankingsByBounds } from '@/entities/rankings/rankings.query'
import { useTranslation } from '@/lib/i18n'
import type { RankingType } from '@/lib/types'
import { getAllResortsWithBounds } from '@/lib/utils/resort-matcher'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'

const Rank = () => {
    const { t } = useTranslation()
    const [selectedResortId, setSelectedResortId] = useState<string | null>(null)
    const [rankingType, setRankingType] = useState<RankingType>('speed')

    const resorts = getAllResortsWithBounds()
    const resortOptions: SearchableSelectOption[] = resorts.map((resort) => ({ value: resort.id, label: resort.name, subLabel: resort.region }))
    const selectedResort = resorts.find((r) => r.id === selectedResortId) ?? null

    const { data: rankings, isLoading: isRankingsLoading } = useRankingsByBounds({
        bounds: selectedResort?.bounds ?? null,
        type: rankingType,
    })

    const handleResortChange = (value: string | null) => setSelectedResortId(value)

    const handleRankingTypeChange = (value: string | undefined) => {
        if (value === 'speed' || value === 'distance' || value === 'count') setRankingType(value)
    }

    return (
        <View className='flex-1 gap-2 p-3.5'>
            <SearchableSelect
                value={selectedResortId}
                options={resortOptions}
                onValueChange={handleResortChange}
                placeholder={t('rank.selectResort')}
                searchPlaceholder={t('rank.searchResort')}
                emptyText={t('rank.noResorts')}
                allOptionLabel={t('rank.all')}
                closeText={t('rank.close')}
                showAllOption={true}
            />
            <View className='flex flex-row items-center gap-2 overflow-hidden rounded border border-border'>
                <ToggleGroup type='single' value={rankingType} onValueChange={handleRankingTypeChange}>
                    <ToggleGroupItem value='speed' variant='default' className='flex-1 border-r border-border' size='sm'>
                        <Text>{t('rank.speed')}</Text>
                    </ToggleGroupItem>
                    <ToggleGroupItem value='distance' variant='default' className='flex-1 border-r border-border' size='sm'>
                        <Text>{t('rank.distance')}</Text>
                    </ToggleGroupItem>
                    <ToggleGroupItem value='count' variant='default' className='flex-1' size='sm'>
                        <Text>{t('rank.count')}</Text>
                    </ToggleGroupItem>
                </ToggleGroup>
            </View>
            <ScrollView className='flex-1' contentContainerClassName='gap-2'>
                {isRankingsLoading ? (
                    <View className='items-center py-8'>
                        <ActivityIndicator size='large' />
                    </View>
                ) : (
                    rankings?.map((item) => (
                        <RankItem
                            key={item.userId}
                            username={item.username}
                            avatarURL={item.avatarURL}
                            locationLatitude={item.locationLatitude}
                            locationLongitude={item.locationLongitude}
                            value={item.value}
                            unit={item.unit}
                            rank={item.rank}
                        />
                    ))
                )}
                {!isRankingsLoading && rankings?.length === 0 && (
                    <View className='items-center py-8'>
                        <Text className='text-primary/60'>{t('rank.noRankings')}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

export default Rank
