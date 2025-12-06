import { Text } from '@/components/ui/text'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTranslation } from '@/lib/i18n'

interface SettingToggleGroupProps<T extends string> {
    value: T
    onValueChange: (value: T) => void
    options: readonly { value: T; labelKey: string }[]
    size?: 'default' | 'sm' | 'lg'
    translate?: boolean
}

export const SettingToggleGroup = <T extends string>({
    value,
    onValueChange,
    options,
    size = 'default',
    translate = true,
}: SettingToggleGroupProps<T>) => {
    const { t } = useTranslation()

    return (
        <ToggleGroup type='single' value={value} onValueChange={(val) => val && onValueChange(val as T)}>
            {options.map((opt, idx) => (
                <ToggleGroupItem
                    key={opt.value}
                    value={opt.value}
                    isFirst={idx === 0}
                    isLast={idx === options.length - 1}
                    variant='outline'
                    size={size}>
                    <Text>{translate ? t(opt.labelKey) : opt.labelKey}</Text>
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}
