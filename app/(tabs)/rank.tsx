import { RankItem } from '@/components/rank/rank-item'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Text } from '@/components/ui/text'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useRankingsByBounds } from '@/entities/rankings/rankings.query'
import { useTranslation } from '@/lib/i18n'
import type { RankingType } from '@/lib/types'
import { getAllResortsWithBounds, getResortsWithBoundsByRegion, getUniqueRegions } from '@/lib/utils/resort-matcher'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const Rank = () => {
    const { t } = useTranslation()
    const insets = useSafeAreaInsets()
    const contentInsets = {
        top: insets.top,
        bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
        left: 12,
        right: 12,
    }

    const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
    const [selectedResortId, setSelectedResortId] = useState<string | null>(null)
    const [rankingType, setRankingType] = useState<RankingType>('speed')

    const regions = useMemo(() => getUniqueRegions(), [])
    const resorts = useMemo(
        () => (selectedRegion ? getResortsWithBoundsByRegion(selectedRegion) : getAllResortsWithBounds()),
        [selectedRegion]
    )

    const selectedResort = useMemo(() => {
        return resorts.find((r) => r.id === selectedResortId) ?? null
    }, [resorts, selectedResortId])

    const { data: rankings, isLoading: isRankingsLoading } = useRankingsByBounds({
        bounds: selectedResort?.bounds ?? null,
        type: rankingType,
    })

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value === 'all' ? null : value)
        setSelectedResortId(null)
    }

    const handleResortChange = (value: string) => {
        setSelectedResortId(value === 'all' ? null : value)
    }

    const handleRankingTypeChange = (value: string | undefined) => {
        if (value) {
            setRankingType(value as RankingType)
        }
    }

    return (
        <View className='flex-1 gap-2 p-3.5'>
            <View className='flex flex-row gap-1.5'>
                <Select
                    className='flex-1'
                    value={{ value: selectedRegion ?? 'all', label: selectedRegion ?? t('rank.all') }}
                    onValueChange={(option) => option && handleRegionChange(option.value)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('rank.all')} />
                    </SelectTrigger>
                    <SelectContent insets={contentInsets} className='mt-2 w-full'>
                        <SelectGroup>
                            <SelectItem key='all' label={t('rank.all')} value='all'>
                                {t('rank.all')}
                            </SelectItem>
                            {regions.map((region) => (
                                <SelectItem key={region} label={region} value={region}>
                                    {region}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select
                    className='flex-1'
                    value={{ value: selectedResortId ?? 'all', label: resorts.find((r) => r.id === selectedResortId)?.name ?? t('rank.all') }}
                    onValueChange={(option) => option && handleResortChange(option.value)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('rank.all')} />
                    </SelectTrigger>
                    <SelectContent insets={contentInsets} className='mt-2 w-full'>
                        <SelectGroup>
                            <SelectItem key='all' label={t('rank.all')} value='all'>
                                {t('rank.all')}
                            </SelectItem>
                            {resorts.map((resort) => (
                                <SelectItem key={resort.id} label={resort.name} value={resort.id}>
                                    {resort.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </View>
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
