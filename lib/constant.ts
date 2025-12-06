import { Flag, ScrollText, SettingsIcon, Trophy, User2Icon } from 'lucide-react-native'

export const MENU_ITEMS = {
    history: {
        icon: ScrollText,
        label: 'HISTORY',
        route: '/history',
    },
    ranking: {
        icon: Trophy,
        label: 'RANKING',
        route: '/rank',
    },
    snowing: {
        icon: Flag,
        label: 'SNOWING',
        route: '/',
    },
    user: {
        icon: User2Icon,
        label: 'USER',
        route: '/user',
    },
    setting: {
        icon: SettingsIcon,
        label: 'HOME',
        route: '/setting',
    },
}

export const LOCALE_OPTIONS = [
    { value: 'en', labelKey: 'EN' },
    { value: 'ko', labelKey: '한국어' },
    { value: 'jp', labelKey: '日本語' },
] as const

export const THEME_OPTIONS = [
    { value: 'light', labelKey: 'settings.lightMode' },
    { value: 'dark', labelKey: 'settings.darkMode' },
    { value: 'system', labelKey: 'settings.systemTheme' },
] as const

export const TEMPERATURE_OPTIONS = [
    { value: 'celsius', labelKey: 'settings.celsius' },
    { value: 'fahrenheit', labelKey: 'settings.fahrenheit' },
] as const

export const MEASUREMENT_OPTIONS = [
    { value: 'metric', labelKey: 'settings.metric' },
    { value: 'imperial', labelKey: 'settings.imperial' },
] as const

export const NOTIFICATION_OPTIONS = [
    { key: 'feed', labelKey: 'settings.feed' },
    { key: 'workout', labelKey: 'settings.workout' },
    { key: 'goal', labelKey: 'settings.goal' },
] as const

export const HISTORY_CARD_ITEM_SETTINGS = {
    type: {
        labelKey: 'uicard.type',
        unitType: null,
    },
    totalDistance: {
        labelKey: 'uicard.totalDistance',
        unitType: 'distance',
    },
    vertical: {
        labelKey: 'uicard.vertical',
        unitType: 'vertical',
    },
    maxSpeed: {
        labelKey: 'uicard.maxSpeed',
        unitType: 'speed',
    },
    timeOnSlope: {
        labelKey: 'uicard.timeOnSlope',
        unitType: 'duration',
    },
    runs: {
        labelKey: 'uicard.runs',
        unitType: null,
    },
} as const

export const USER_SUMMARY_ITEM_SETTINGS = {
    totalDistance: {
        labelKey: 'uicard.totalDistance',
        unitType: 'distance',
    },
    vertical: {
        labelKey: 'uicard.vertical',
        unitType: 'vertical',
    },
    maxSpeed: {
        labelKey: 'uicard.maxSpeed',
        unitType: 'speed',
    },
    timeOnSlope: {
        labelKey: 'uicard.timeOnSlope',
        unitType: 'duration',
    },
    runs: {
        labelKey: 'uicard.runs',
        unitType: null,
    },
} as const

export const TRACKING_STATS_SETTINGS = {
    totalDistance: {
        labelKey: 'tracking.totalDistance',
        unitType: 'distance',
    },
    maxVertical: {
        labelKey: 'tracking.maxVertical',
        unitType: 'vertical',
    },
    totalRuns: {
        labelKey: 'tracking.totalRuns',
        unitType: null,
    },
    maxSpeed: {
        labelKey: 'tracking.maxSpeed',
        unitType: 'speed',
    },
} as const

export const GPS_SIGNAL_LEVELS = {
    excellent: { bars: 4, color: '#22c55e' },
    good: { bars: 3, color: '#84cc16' },
    fair: { bars: 2, color: '#eab308' },
    poor: { bars: 1, color: '#f97316' },
    none: { bars: 0, color: '#ef4444' },
} as const
