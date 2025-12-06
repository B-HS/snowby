import { getLocales } from 'expo-localization'
import { I18n } from 'i18n-js'

import { en } from './langs/en'
import { jp } from './langs/jp'
import { ko } from './langs/ko'

const translations = {
    en,
    ko,
    jp,
}

export const i18n = new I18n(translations)

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en'
i18n.locale = deviceLanguage
i18n.enableFallback = true
i18n.defaultLocale = 'en'

export type Locale = 'en' | 'ko' | 'jp'

export const useTranslation = () => {
    const { useAppStore } = require('./store')
    const locale = useAppStore((state: { locale: Locale }) => state.locale)
    const setLocale = useAppStore((state: { setLocale: (l: Locale) => void }) => state.setLocale)

    const t = (key: string, options?: Record<string, string | number>) => i18n.t(key, options)

    return { t, locale, setLocale }
}

export const t = (key: string, options?: Record<string, string | number>) => i18n.t(key, options)

export const getSupportedLocales = () => Object.keys(translations) as Locale[]
