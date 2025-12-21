import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Search, X } from 'lucide-react-native'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
    FlatList,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    TextInput,
    TouchableOpacity,
    View,
    type ListRenderItemInfo,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface SearchableSelectOption {
    value: string
    label: string
    subLabel?: string
}

interface SearchableSelectProps {
    value: string | null
    options: SearchableSelectOption[]
    onValueChange: (value: string | null) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    allOptionLabel?: string
    showAllOption?: boolean
    closeText?: string
    className?: string
}

const ITEM_HEIGHT = 48

const OptionItem = memo(
    ({
        item,
        isSelected,
        onPress,
    }: {
        item: SearchableSelectOption
        isSelected: boolean
        onPress: () => void
    }) => (
        <TouchableOpacity
            onPress={onPress}
            className={cn(
                'flex-row items-center justify-between px-4 py-3',
                isSelected && 'bg-accent/50'
            )}
            style={{ height: ITEM_HEIGHT }}
            activeOpacity={0.7}>
            <View className='flex-1 pr-2'>
                <Text className='text-foreground text-sm' numberOfLines={1}>
                    {item.label}
                </Text>
                {item.subLabel && (
                    <Text className='text-muted-foreground text-xs' numberOfLines={1}>
                        {item.subLabel}
                    </Text>
                )}
            </View>
            {isSelected && <Icon as={Check} size={16} className='text-primary' />}
        </TouchableOpacity>
    )
)

OptionItem.displayName = 'OptionItem'

export const SearchableSelect = ({
    value,
    options,
    onValueChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found',
    allOptionLabel = 'All',
    showAllOption = true,
    closeText = 'Close',
    className,
}: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const inputRef = useRef<TextInput>(null)
    const insets = useSafeAreaInsets()

    const selectedOption = useMemo(
        () => options.find((opt) => opt.value === value),
        [options, value]
    )

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options
        const query = searchQuery.toLowerCase().trim()
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) ||
                opt.subLabel?.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    const allOptions = useMemo(() => {
        if (!showAllOption) return filteredOptions
        const allOption: SearchableSelectOption = {
            value: '__all__',
            label: allOptionLabel,
        }
        return [allOption, ...filteredOptions]
    }, [filteredOptions, showAllOption, allOptionLabel])

    const handleOpen = useCallback(() => {
        setIsOpen(true)
        setSearchQuery('')
    }, [])

    const handleClose = useCallback(() => {
        setIsOpen(false)
        setSearchQuery('')
        Keyboard.dismiss()
    }, [])

    const handleSelect = useCallback(
        (optionValue: string) => {
            if (optionValue === '__all__') {
                onValueChange(null)
            } else {
                onValueChange(optionValue)
            }
            handleClose()
        },
        [onValueChange, handleClose]
    )

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<SearchableSelectOption>) => {
            const isSelected =
                (item.value === '__all__' && value === null) || item.value === value
            return (
                <OptionItem
                    item={item}
                    isSelected={isSelected}
                    onPress={() => handleSelect(item.value)}
                />
            )
        },
        [value, handleSelect]
    )

    const keyExtractor = useCallback(
        (item: SearchableSelectOption, index: number) => `${item.value}-${index}`,
        []
    )

    const getItemLayout = useCallback(
        (_: SearchableSelectOption[] | null | undefined, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        }),
        []
    )

    const displayValue = selectedOption?.label ?? placeholder

    return (
        <>
            <Pressable
                onPress={handleOpen}
                className={cn(
                    'border-input dark:bg-input/30 bg-background flex h-10 flex-row items-center justify-between rounded-md border px-3 shadow-sm shadow-black/5',
                    className
                )}>
                <Text
                    className={cn(
                        'text-foreground flex-1 text-sm',
                        !selectedOption && 'text-muted-foreground'
                    )}
                    numberOfLines={1}>
                    {displayValue}
                </Text>
                <Icon as={ChevronDown} size={16} className='text-muted-foreground' />
            </Pressable>

            <Modal
                visible={isOpen}
                animationType='slide'
                presentationStyle='pageSheet'
                onRequestClose={handleClose}>
                <View
                    className='bg-background flex-1'
                    style={{ paddingTop: Platform.OS === 'ios' ? 0 : insets.top }}>
                    <View className='border-border flex-row items-center gap-2 border-b px-4 py-3'>
                        <View className='bg-secondary/50 flex-1 flex-row items-center rounded-lg px-3'>
                            <Icon as={Search} size={18} className='text-muted-foreground' />
                            <TextInput
                                ref={inputRef}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder={searchPlaceholder}
                                placeholderTextColor='#9ca3af'
                                className='text-foreground flex-1 py-2.5 pl-2 text-sm'
                                autoFocus
                                autoCorrect={false}
                                autoCapitalize='none'
                                returnKeyType='search'
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Icon as={X} size={18} className='text-muted-foreground' />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity onPress={handleClose} className='px-2'>
                            <Text className='text-primary text-sm font-medium'>{closeText}</Text>
                        </TouchableOpacity>
                    </View>

                    {allOptions.length === 0 ? (
                        <View className='items-center py-8'>
                            <Text className='text-muted-foreground text-sm'>{emptyText}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={allOptions}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            getItemLayout={getItemLayout}
                            initialNumToRender={15}
                            maxToRenderPerBatch={10}
                            windowSize={10}
                            removeClippedSubviews={Platform.OS === 'android'}
                            keyboardShouldPersistTaps='handled'
                            contentContainerStyle={{ paddingBottom: insets.bottom }}
                        />
                    )}
                </View>
            </Modal>
        </>
    )
}
