type MeasurementUnit = 'metric' | 'imperial'

const CONVERSION = {
    kmToMi: 0.621371,
    mToFt: 3.28084,
}

export const convertDistance = (km: number, unit: MeasurementUnit) => {
    if (unit === 'imperial') {
        return (km * CONVERSION.kmToMi).toFixed(1)
    }
    return km.toFixed(1)
}

export const formatDistanceFromMeters = (meters: number, unit: MeasurementUnit) => {
    if (unit === 'imperial') {
        const miles = (meters / 1000) * CONVERSION.kmToMi
        if (miles < 0.1) {
            return `${Math.round(meters * CONVERSION.mToFt)}ft`
        }
        return `${miles.toFixed(2)}mi`
    }

    if (meters < 1000) {
        return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(2)}km`
}

export const convertVertical = (m: number, unit: MeasurementUnit) => {
    if (unit === 'imperial') {
        return Math.round(m * CONVERSION.mToFt)
    }
    return Math.round(m)
}

export const convertSpeed = (kmh: number, unit: MeasurementUnit) => {
    if (unit === 'imperial') {
        return (kmh * CONVERSION.kmToMi).toFixed(1)
    }
    return kmh.toFixed(1)
}

export const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hrs > 0) {
        return `${hrs}h ${mins}m ${secs}s`
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`
    }
    return `${secs}s`
}

export const getDistanceUnit = (unit: MeasurementUnit) => (unit === 'imperial' ? 'mi' : 'km')
export const getVerticalUnit = (unit: MeasurementUnit) => (unit === 'imperial' ? 'ft' : 'm')
export const getSpeedUnit = (unit: MeasurementUnit) => (unit === 'imperial' ? 'mph' : 'km/h')

export const formatStatValue = (
    value: number | string | undefined,
    unitType: string | null,
    measurementUnit: MeasurementUnit
) => {
    if (value === undefined) return '-'

    switch (unitType) {
        case 'distance':
            return formatDistanceFromMeters(value as number, measurementUnit)
        case 'vertical':
            return `${convertVertical(value as number, measurementUnit)} ${getVerticalUnit(measurementUnit)}`
        case 'speed':
            return `${convertSpeed(value as number, measurementUnit)} ${getSpeedUnit(measurementUnit)}`
        case 'duration':
            return formatDuration(value as number)
        default:
            return String(value)
    }
}
