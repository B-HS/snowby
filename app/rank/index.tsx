import { RankItem } from '@/components/rank/rank-item'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Text } from '@/components/ui/text'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTranslation } from '@/lib/i18n'
import { Platform, ScrollView, View } from 'react-native'
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

    return (
        <View className='gap-2 p-3.5 flex-1'>
            <View className='flex flex-row gap-1.5'>
                <Select className='flex-1'>
                    <SelectTrigger>
                        <SelectValue placeholder={t('rank.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent insets={contentInsets} className='w-full mt-2'>
                        <Input placeholder={t('rank.searchCountry')} />
                        <SelectGroup>
                            <SelectLabel>Fruits</SelectLabel>
                            <SelectItem label='Apple' value='apple'>
                                Apple
                            </SelectItem>
                            <SelectItem label='Banana' value='banana'>
                                Banana
                            </SelectItem>
                            <SelectItem label='Blueberry' value='blueberry'>
                                Blueberry
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select className='flex-1'>
                    <SelectTrigger>
                        <SelectValue placeholder={t('rank.selectResort')} />
                    </SelectTrigger>
                    <SelectContent insets={contentInsets} className='w-full mt-2'>
                        <Input placeholder={t('rank.searchResort')} />
                        <SelectGroup>
                            <SelectLabel>Fruits</SelectLabel>
                            <SelectItem label='Apple' value='apple'>
                                Apple
                            </SelectItem>
                            <SelectItem label='Banana' value='banana'>
                                Banana
                            </SelectItem>
                            <SelectItem label='Blueberry' value='blueberry'>
                                Blueberry
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </View>
            <View className='flex flex-row gap-2 items-center rounded overflow-hidden border border-border'>
                <ToggleGroup type='single' value='1' onValueChange={(value) => console.log(value)}>
                    <ToggleGroupItem value='1' variant='default' className='flex-1 border-r border-border' size='sm'>
                        <Text>{t('rank.speed')}</Text>
                    </ToggleGroupItem>
                    <ToggleGroupItem value='2' variant='default' className='flex-1 border-r border-border' size='sm'>
                        <Text>{t('rank.distance')}</Text>
                    </ToggleGroupItem>
                    <ToggleGroupItem value='3' variant='default' className='flex-1' size='sm'>
                        <Text>{t('rank.count')}</Text>
                    </ToggleGroupItem>
                </ToggleGroup>
            </View>
            <ScrollView className='h-[3000vh]' contentContainerClassName='gap-2'>
                <RankItem
                    username='Jane Doe'
                    avatarURL='https://github.com/jane-doe.png'
                    locationLatitude={37.7749}
                    locationLongitude={-122.4194}
                    value={100}
                    unit='km'
                    rank={1}
                />
                <RankItem
                    username='Jim Doe'
                    avatarURL='https://github.com/jim-doe.png'
                    locationLatitude={37.7749}
                    locationLongitude={-122.4194}
                    value={100}
                    unit='km'
                    rank={2}
                />
                <RankItem
                    username='John Doe'
                    avatarURL='https://github.com/john-doe.png'
                    locationLatitude={37.7749}
                    locationLongitude={-122.4194}
                    value={100}
                    unit='km'
                    rank={3}
                />
                <RankItem
                    username='Jane Doe'
                    avatarURL='https://github.com/jane-doe.png'
                    locationLatitude={37.7749}
                    locationLongitude={-122.4194}
                    value={100}
                    unit='km'
                    rank={4}
                />
            </ScrollView>
        </View>
    )
}

export default Rank
