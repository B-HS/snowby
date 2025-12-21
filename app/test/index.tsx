import { useState, useRef } from 'react'
import { View, ScrollView } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { MapView, MapViewRef } from '@/components/map/map-view'
import { useTranslation } from '@/lib/i18n'
import { runAllTests } from '@/lib/testing/tracking-simulator'
import { runAllSyncTests } from '@/lib/testing/sync-test'
import {
    generateSkiingScenario,
    generateLiftScenario,
    generateRestingScenario,
    generateFullDayScenario,
    TrackingSimulator,
} from '@/lib/testing/tracking-simulator'
import type { ActivityState, SessionStats } from '@/lib/tracking/tracking.types'
import { useAppStore } from '@/lib/store'
import { formatStatValue, formatDistanceFromMeters } from '@/lib/units'

type SimulatedLocation = {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    accuracy: number
    timestamp: number
}

type TestResult = {
    name: string
    passed: boolean
    details: string
    error?: string
}

const ACTIVITY_STATE_COLORS: Record<ActivityState, string> = {
    skiing: '#3b82f6',
    lifting: '#22c55e',
    resting: '#f97316',
}

const DEFAULT_CAMERA = {
    coordinates: {
        latitude: 37.3345,
        longitude: 127.28935,
    },
    zoom: 15,
}

const TestPage = () => {
    const { t } = useTranslation()
    const { measurementUnit, user } = useAppStore()
    const mapRef = useRef<MapViewRef>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [simulatorResults, setSimulatorResults] = useState<Record<string, { passed: boolean; details: string }> | null>(null)
    const [syncResults, setSyncResults] = useState<{ results: TestResult[]; summary: { passed: number; failed: number; total: number } } | null>(null)

    const [simulationLocations, setSimulationLocations] = useState<SimulatedLocation[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isSimulating, setIsSimulating] = useState(false)
    const [simulationType, setSimulationType] = useState<'skiing' | 'lifting' | 'resting' | 'fullday' | null>(null)
    const [playbackSpeed, setPlaybackSpeed] = useState(100)
    const [liveStats, setLiveStats] = useState<SessionStats | null>(null)
    const [liveActivityState, setLiveActivityState] = useState<ActivityState>('resting')
    const simulatorRef = useRef<TrackingSimulator | null>(null)

    const runSimulatorTests = async () => {
        setIsRunning(true)
        setSimulatorResults(null)
        try {
            const results = await runAllTests('test-user-simulator')
            setSimulatorResults(results)
        } catch (error) {
            console.error('Simulator test error:', error)
        }
        setIsRunning(false)
    }

    const runSyncTests = async () => {
        setIsRunning(true)
        setSyncResults(null)
        try {
            const results = await runAllSyncTests('test-user-sync')
            setSyncResults(results)
        } catch (error) {
            console.error('Sync test error:', error)
        }
        setIsRunning(false)
    }

    const startSimulation = async (type: 'skiing' | 'lifting' | 'resting' | 'fullday') => {
        let locations: SimulatedLocation[]
        switch (type) {
            case 'skiing':
                locations = generateSkiingScenario()
                break
            case 'lifting':
                locations = generateLiftScenario()
                break
            case 'resting':
                locations = generateRestingScenario()
                break
            case 'fullday':
                locations = generateFullDayScenario()
                break
        }

        setSimulationLocations(locations)
        setCurrentIndex(0)
        setSimulationType(type)
        setIsSimulating(true)
        setLiveStats(null)
        setLiveActivityState('resting')

        if (type === 'fullday') {
            const simulator = new TrackingSimulator()
            const userId = user?.id || 'anonymous'
            await simulator.initialize(userId, 37.3345, 127.28935)
            simulatorRef.current = simulator
        }

        if (locations.length > 0 && mapRef.current) {
            mapRef.current.setCameraPosition({
                coordinates: {
                    latitude: locations[0].latitude,
                    longitude: locations[0].longitude,
                },
                zoom: 16,
            })
        }

        let index = 0
        const processLocation = async () => {
            if (index >= locations.length) {
                if (simulatorRef.current) {
                    await simulatorRef.current.completeSession()
                    const finalStats = simulatorRef.current.getStats()
                    setLiveStats(finalStats)
                }
                setIsSimulating(false)
                return
            }

            const loc = locations[index]
            setCurrentIndex(index)

            if (simulatorRef.current && type === 'fullday') {
                const result = await simulatorRef.current.processLocation(loc)
                if (result) {
                    setLiveStats(result.stats)
                    setLiveActivityState(result.activityState)
                }
            }

            if (mapRef.current) {
                mapRef.current.setCameraPosition({
                    coordinates: {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                    },
                    zoom: 16,
                })
            }

            index++
            setTimeout(processLocation, playbackSpeed)
        }

        processLocation()
    }

    const stopSimulation = () => {
        setIsSimulating(false)
        setSimulationLocations([])
        setCurrentIndex(0)
        setSimulationType(null)
        if (simulatorRef.current) {
            simulatorRef.current.reset()
            simulatorRef.current = null
        }
        setLiveStats(null)
        setLiveActivityState('resting')
    }

    const formatElapsedTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const currentLocation = simulationLocations[currentIndex]
    const pathCoordinates = simulationLocations
        .slice(0, currentIndex + 1)
        .map((loc) => ({ latitude: loc.latitude, longitude: loc.longitude }))

    const getActivityStateFromLocation = (loc: SimulatedLocation): ActivityState => {
        const speedKmh = loc.speed * 3.6
        if (speedKmh > 5) return 'skiing'
        if (speedKmh > 1) return 'lifting'
        return 'resting'
    }

    const currentActivityState = currentLocation ? getActivityStateFromLocation(currentLocation) : 'resting'

    const polylines = pathCoordinates.length >= 2
        ? [{ points: pathCoordinates, color: simulationType ? ACTIVITY_STATE_COLORS[currentActivityState] : '#3b82f6', width: 4 }]
        : []

    const circles = currentLocation
        ? [{
              center: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
              radius: currentLocation.accuracy,
              fillColor: '#3b82f633',
              strokeColor: '#3b82f6',
              strokeWidth: 1,
          }]
        : []

    const markers = currentLocation
        ? [{ coordinates: { latitude: currentLocation.latitude, longitude: currentLocation.longitude }, id: 'current' }]
        : []

    return (
        <View className="flex-1 bg-white dark:bg-gray-900">
            <View className="h-1/2">
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    cameraPosition={DEFAULT_CAMERA}
                    polylines={polylines}
                    circles={circles}
                    markers={markers}
                />

                {isSimulating && currentLocation && (
                    <View className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/70 p-3">
                        <View className="flex-row justify-between">
                            <Text className="text-white text-xs">
                                {t('test.location')} {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
                            </Text>
                            <Text className="text-white text-xs">
                                {currentIndex + 1} / {simulationLocations.length}
                            </Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-white text-xs">{t('test.altitude')} {currentLocation.altitude.toFixed(0)}m</Text>
                            <Text className="text-white text-xs">{t('test.speed')} {(currentLocation.speed * 3.6).toFixed(1)}km/h</Text>
                            <Text className={`text-xs font-bold`} style={{ color: ACTIVITY_STATE_COLORS[currentActivityState] }}>
                                {t(`tracking.${currentActivityState === 'lifting' ? 'lifting' : currentActivityState}`)}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView className="flex-1 p-4">
                <Text className="mb-4 text-xl font-bold">{t('test.gpsSimulation')}</Text>

                <View className="mb-4 gap-2">
                    <View className="flex-row gap-2">
                        <Button
                            className="flex-1 bg-blue-500"
                            onPress={() => startSimulation('skiing')}
                            disabled={isSimulating}>
                            <Text className="text-white text-sm">{t('test.skiingSimul')}</Text>
                        </Button>
                        <Button
                            className="flex-1 bg-green-500"
                            onPress={() => startSimulation('lifting')}
                            disabled={isSimulating}>
                            <Text className="text-white text-sm">{t('test.liftSimul')}</Text>
                        </Button>
                        <Button
                            className="flex-1 bg-orange-500"
                            onPress={() => startSimulation('resting')}
                            disabled={isSimulating}>
                            <Text className="text-white text-sm">{t('test.restingSimul')}</Text>
                        </Button>
                    </View>
                    <Button
                        className="bg-purple-600"
                        onPress={() => startSimulation('fullday')}
                        disabled={isSimulating}>
                        <Text className="text-white font-bold">{t('test.fullDaySimul')}</Text>
                    </Button>
                    {isSimulating && (
                        <Button variant="destructive" onPress={stopSimulation}>
                            <Text className="text-white">{t('test.stopSimulation')}</Text>
                        </Button>
                    )}
                </View>

                {(simulationType === 'fullday' && liveStats) && (
                    <View className="mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="font-bold">{t('test.liveStats')}</Text>
                            <Text className="text-xs px-2 py-1 rounded" style={{ backgroundColor: ACTIVITY_STATE_COLORS[liveActivityState], color: 'white' }}>
                                {t(`tracking.${liveActivityState}`)}
                            </Text>
                        </View>
                        <View className="flex-row flex-wrap">
                            <View className="w-1/2 mb-2">
                                <Text className="text-xs text-gray-500">{t('tracking.totalDistance')}</Text>
                                <Text className="font-semibold">{formatDistanceFromMeters(liveStats.totalDistance, measurementUnit)}</Text>
                            </View>
                            <View className="w-1/2 mb-2">
                                <Text className="text-xs text-gray-500">{t('tracking.maxVertical')}</Text>
                                <Text className="font-semibold">{formatStatValue(liveStats.maxVertical, 'vertical', measurementUnit)}</Text>
                            </View>
                            <View className="w-1/2 mb-2">
                                <Text className="text-xs text-gray-500">{t('tracking.totalRuns')}</Text>
                                <Text className="font-semibold">{liveStats.totalRuns}</Text>
                            </View>
                            <View className="w-1/2 mb-2">
                                <Text className="text-xs text-gray-500">{t('tracking.maxSpeed')}</Text>
                                <Text className="font-semibold">{formatStatValue(liveStats.maxSpeed, 'speed', measurementUnit)}</Text>
                            </View>
                            <View className="w-1/2">
                                <Text className="text-xs text-gray-500">{t('tracking.timeOnSlope')}</Text>
                                <Text className="font-semibold">{formatElapsedTime(liveStats.timeOnSlope)}</Text>
                            </View>
                        </View>
                        <Text className="text-xs text-gray-500 mt-2">{t('test.expectedRuns')}</Text>
                    </View>
                )}

                <View className="mb-4 flex-row gap-2">
                    <Text className="self-center">{t('test.playbackSpeed')}</Text>
                    {[50, 100, 200, 500].map((speed) => (
                        <Button
                            key={speed}
                            variant={playbackSpeed === speed ? 'default' : 'outline'}
                            size="sm"
                            onPress={() => setPlaybackSpeed(speed)}>
                            <Text className={playbackSpeed === speed ? 'text-white' : ''}>{speed}ms</Text>
                        </Button>
                    ))}
                </View>

                <View className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

                <Text className="mb-4 text-xl font-bold">{t('test.unitTests')}</Text>

                <View className="mb-4 gap-2">
                    <Button onPress={runSimulatorTests} disabled={isRunning || isSimulating}>
                        <Text className="font-semibold text-white">
                            {isRunning ? t('test.runningTests') : t('test.simulationTest')}
                        </Text>
                    </Button>
                    <Button variant="outline" onPress={runSyncTests} disabled={isRunning || isSimulating}>
                        <Text>{t('test.syncTest')}</Text>
                    </Button>
                </View>

                {simulatorResults && (
                    <View className="mb-4">
                        <Text className="mb-2 font-semibold">{t('test.simulationResults')}</Text>
                        <View className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                            {Object.entries(simulatorResults).map(([name, result]) => (
                                <View key={name} className="mb-2 flex-row justify-between">
                                    <Text className="text-sm">{name}</Text>
                                    <Text className={result.passed ? 'text-green-500' : 'text-red-500'}>
                                        {result.passed ? t('common.pass') : t('common.fail')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {syncResults && (
                    <View className="mb-4">
                        <Text className="mb-2 font-semibold">
                            {t('test.syncResults')} {syncResults.summary.passed}/{syncResults.summary.total}
                        </Text>
                        <View className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                            {syncResults.results.map((result, index) => (
                                <View key={index} className="mb-2 flex-row justify-between">
                                    <Text className="text-sm flex-1">{result.name}</Text>
                                    <Text className={result.passed ? 'text-green-500' : 'text-red-500'}>
                                        {result.passed ? t('common.pass') : t('common.fail')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

export default TestPage
