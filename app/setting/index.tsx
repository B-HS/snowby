import { SettingRow } from '@/components/setting/setting-row'
import { SettingSection } from '@/components/setting/setting-section'
import { SettingToggleGroup } from '@/components/setting/setting-toggle-group'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Toggle } from '@/components/ui/toggle'
import { LOCALE_OPTIONS, MEASUREMENT_OPTIONS, NOTIFICATION_OPTIONS, TEMPERATURE_OPTIONS, THEME_OPTIONS } from '@/lib/constant'
import { useTranslation } from '@/lib/i18n'
import { useSettingsSync } from '@/lib/settings-sync'
import { useAppStore } from '@/lib/store'
import type { Theme } from '@/lib/types'
import { Bell, Globe, Ruler, Sun } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { Appearance, ScrollView } from 'react-native'

const Setting = () => {
    const { t } = useTranslation()
    const { setColorScheme } = useColorScheme()
    const { locale, theme, temperatureUnit, measurementUnit, notifications } = useAppStore()
    const {
        setLocaleWithSync,
        setThemeWithSync,
        setTemperatureUnitWithSync,
        setMeasurementUnitWithSync,
        setNotificationWithSync,
    } = useSettingsSync()

    const handleThemeChange = (value: Theme) => {
        setThemeWithSync(value)
        if (value === 'system') {
            const systemTheme = Appearance.getColorScheme() ?? 'light'
            setColorScheme(systemTheme)
        } else {
            setColorScheme(value)
        }
    }

    return (
        <ScrollView className='p-3.5' contentContainerClassName='gap-3.5'>
            <SettingSection title={t('settings.language')} icon={<Icon as={Globe} size={16} className='text-primary' />}>
                <SettingToggleGroup value={locale} onValueChange={setLocaleWithSync} options={LOCALE_OPTIONS} translate={false} />
            </SettingSection>

            <SettingSection title={t('settings.theme')} icon={<Icon as={Sun} size={16} className='text-primary' />}>
                <SettingToggleGroup value={theme} onValueChange={handleThemeChange} options={THEME_OPTIONS} />
            </SettingSection>

            <SettingSection title={t('settings.units')} icon={<Icon as={Ruler} size={16} className='text-primary' />}>
                <SettingRow label={t('settings.temperature')}>
                    <SettingToggleGroup value={temperatureUnit} onValueChange={setTemperatureUnitWithSync} options={TEMPERATURE_OPTIONS} size='sm' />
                </SettingRow>
                <SettingRow label={t('settings.measurement')} isLast>
                    <SettingToggleGroup value={measurementUnit} onValueChange={setMeasurementUnitWithSync} options={MEASUREMENT_OPTIONS} size='sm' />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.notifications')} icon={<Icon as={Bell} size={16} className='text-primary' />}>
                {NOTIFICATION_OPTIONS.map((opt, idx) => (
                    <SettingRow key={opt.key} label={t(opt.labelKey)} isLast={idx === NOTIFICATION_OPTIONS.length - 1}>
                        <Toggle
                            pressed={notifications[opt.key]}
                            onPressedChange={(pressed) => setNotificationWithSync(opt.key, pressed)}
                            variant='outline'
                            size='sm'>
                            <Text>{notifications[opt.key] ? t('settings.on') : t('settings.off')}</Text>
                        </Toggle>
                    </SettingRow>
                ))}
            </SettingSection>
        </ScrollView>
    )
}

export default Setting
