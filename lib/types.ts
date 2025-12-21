export type ActivityType = 'ski' | 'snowboard'

export type UserProfile = {
    name: string
    image: string | null
    bio: string
    isPublic: boolean
    activityTypes: ActivityType[]
}

export type UserSummary = {
    totalDistance: number
    vertical: number
    maxSpeed: number
    timeOnSlope: number
    runs: number
}

export type HistoryItem = {
    id: string
    userId: string
    sessionId: string | null
    username: string
    avatarURL: string
    locationLatitude: number
    locationLongitude: number
    type: ActivityType
    totalDistance: number
    vertical: number
    maxSpeed: number
    timeOnSlope: number
    runs: number
    isPublic: boolean
    createdAt: number
}

export type TrackingLocation = {
    id: number
    sessionId: string
    latitude: number
    longitude: number
    altitude: number
    speed: number
    accuracy: number
    timestamp: string
    activityState: 'skiing' | 'lifting' | 'resting'
    segmentIndex: number
    clientId: number | null
}

export type TrackingRun = {
    id: string
    sessionId: string
    startTime: string
    endTime: string
    startAltitude: number
    endAltitude: number
    distance: number
    verticalDrop: number
    maxSpeed: number
    avgSpeed: number
    duration: number
    createdAt: string
}

export type ActivityDetail = {
    activity: HistoryItem
    locations: TrackingLocation[]
    runs: TrackingRun[]
}

export type Country = {
    code: string
    name: string
}

export type Resort = {
    id: string
    name: string
    nameEn: string
    region: string
    country: string
    bounds: {
        sw: [number, number]
        ne: [number, number]
    }
    center: [number, number]
    source: 'osm' | 'manual' | 'google'
    status: 'active' | 'closed' | 'seasonal'
}

export type ResortsResponse = {
    resorts: Resort[]
    version: string
    updatedAt: string
}

export type MatchedResort = {
    id: string
    name: string
    nameEn: string
    region: string
    country: string
}

export type RankingType = 'speed' | 'distance' | 'count'

export type RankingItem = {
    userId: string
    username: string
    avatarURL: string
    locationLatitude: number
    locationLongitude: number
    value: number
    unit: string
    rank: number
}

export type RankingParams = {
    countryCode: string | null
    resortId: string | null
    type: RankingType
}

export type AlarmType = 'follow' | 'like' | 'comment' | 'system'

export type AlarmItem = {
    id: string
    type: AlarmType
    title: string
    message: string
    read: boolean
    createdAt: number
    relatedUserId: string | null
    relatedUserAvatar: string | null
}

export type HistoryFilter = 'all' | 'friend'

export type FetchFeedParams = {
    filter: HistoryFilter
    page: number
    limit: number
}

export type FetchFeedResponse = {
    items: HistoryItem[]
    hasMore: boolean
    totalCount: number
}

export type Locale = 'en' | 'ko' | 'jp'
export type Theme = 'light' | 'dark' | 'system'
export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type MeasurementUnit = 'metric' | 'imperial'

export type NotificationSettings = {
    feed: boolean
    workout: boolean
    goal: boolean
}

export type UserSettings = {
    locale: Locale
    theme: Theme
    temperatureUnit: TemperatureUnit
    measurementUnit: MeasurementUnit
    notifications: NotificationSettings
}

export type UpdateSettingsInput = {
    locale?: Locale
    theme?: Theme
    temperatureUnit?: TemperatureUnit
    measurementUnit?: MeasurementUnit
    notifications?: Partial<NotificationSettings>
}
