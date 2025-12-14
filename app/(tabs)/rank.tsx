import { RankItem } from '@/components/rank/rank-item'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Text } from '@/components/ui/text'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCountries, useRankings, useResorts } from '@/entities/rankings/rankings.query'
import { useTranslation } from '@/lib/i18n'
import type { RankingType } from '@/lib/types'
import { useState } from 'react'
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

    const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
    const [selectedResort, setSelectedResort] = useState<string | null>(null)
    const [rankingType, setRankingType] = useState<RankingType>('speed')

    const { data: countries } = useCountries()
    const { data: resorts } = useResorts(selectedCountry ?? '')
    const { data: rankings, isLoading: isRankingsLoading } = useRankings({
        countryCode: selectedCountry,
        resortId: selectedResort,
        type: rankingType,
    })

    const handleCountryChange = (value: string) => {
        setSelectedCountry(value)
        setSelectedResort(null)
    }

    const handleResortChange = (value: string) => {
        setSelectedResort(value)
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
                    value={{ value: selectedCountry ?? '', label: countries?.find((c) => c.code === selectedCountry)?.name ?? '' }}
                    onValueChange={(option) => option && handleCountryChange(option.value)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('rank.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent insets={contentInsets} className='mt-2 w-full'>
                        <SelectGroup>
                            {countries?.map((country) => (
                                <SelectItem key={country.code} label={country.name} value={country.code}>
                                    {country.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select
                    className='flex-1'
                    value={{ value: selectedResort ?? '', label: resorts?.find((r) => r.id === selectedResort)?.name ?? '' }}
                    onValueChange={(option) => option && handleResortChange(option.value)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('rank.selectResort')} />
                    </SelectTrigger>
                    <SelectContent insets={contentInsets} className='mt-2 w-full'>
                        <SelectGroup>
                            {resorts?.map((resort) => (
                                <SelectItem key={resort.id} label={resort.name} value={resort.id}>
                                    {resort.name}
                                </SelectItem>
                            ))}
                            {!selectedCountry && (
                                <View className='items-center py-2'>
                                    <Text className='text-sm text-primary/60'>{t('rank.selectCountryFirst')}</Text>
                                </View>
                            )}
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
