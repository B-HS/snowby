import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

type MeasurementUnit = 'metric' | 'imperial'
type TemperatureUnit = 'celsius' | 'fahrenheit'

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

export const convertTemperature = (celsius: number, unit: TemperatureUnit) => {
    if (unit === 'fahrenheit') {
        return Math.round(celsius * 1.8 + 32)
    }
    return Math.round(celsius)
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

export const formatTime = (date: Date | string) => {
    return dayjs(date).format('HH:mm')
}

export const formatDate = (date: Date | string) => {
    return dayjs(date).format('YYYY-MM-DD')
}

export const formatDateTime = (date: Date | string) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export const getDistanceUnit = (unit: MeasurementUnit) => (unit === 'imperial' ? 'mi' : 'km')
export const getVerticalUnit = (unit: MeasurementUnit) => (unit === 'imperial' ? 'ft' : 'm')
export const getSpeedUnit = (unit: MeasurementUnit) => (unit === 'imperial' ? 'mph' : 'km/h')
export const getTemperatureUnit = (unit: TemperatureUnit) => (unit === 'fahrenheit' ? '°F' : '°C')
