import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

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

export const formatDuration = (minutes: number) => {
    const d = dayjs.duration(minutes, 'minutes')
    const hours = Math.floor(d.asHours())
    const mins = d.minutes()

    if (hours > 0) {
        return `${hours}h ${mins}m`
    }
    return `${mins}m`
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
            return `${convertDistance(value as number, measurementUnit)} ${getDistanceUnit(measurementUnit)}`
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
