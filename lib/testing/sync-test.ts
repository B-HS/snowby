import { initializeDatabase } from '@/lib/database/db'
import * as queries from '@/lib/database/queries'
import { SyncManager } from '@/lib/tracking/sync-manager'
import type { ActivityState, SessionStats } from '@/lib/tracking/tracking.types'

type TestResult = {
    name: string
    passed: boolean
    details: string
    error?: string
}

export const testLocalStoragePersistence = async (userId: string): Promise<TestResult> => {
    try {
        await initializeDatabase()

        const startTime = Date.now()
        const session = await queries.createSession(userId, startTime, 36.0, 128.0)

        for (let i = 0; i < 10; i++) {
            await queries.saveLocation(
                session.id,
                36.0 + i * 0.0001,
                128.0 + i * 0.0001,
                2000 - i * 10,
                5 + i,
                5,
                startTime + i * 1000,
                'skiing' as ActivityState
            )
        }

        const locations = await queries.getLocations(session.id)
        const count = await queries.getLocationCount(session.id)

        const passed = locations.length === 10 && count === 10

        return {
            name: 'Local Storage Persistence',
            passed,
            details: `Saved 10 locations, retrieved ${locations.length}, count = ${count}`,
        }
    } catch (error) {
        return {
            name: 'Local Storage Persistence',
            passed: false,
            details: 'Test failed with error',
            error: error instanceof Error ? error.message : String(error),
        }
    }
}

export const testCrashRecovery = async (userId: string): Promise<TestResult> => {
    try {
        await initializeDatabase()

        const startTime = Date.now()
        const session = await queries.createSession(userId, startTime, 36.0, 128.0)

        await queries.saveLocation(
            session.id,
            36.001,
            128.001,
            1900,
            10,
            5,
            startTime + 1000,
            'skiing' as ActivityState
        )

        await queries.updateSessionStats(session.id, {
            totalDistance: 1000,
            maxVertical: 100,
            totalRuns: 2,
            maxSpeed: 50,
            timeOnSlope: 600,
        })

        const recovered = await queries.getUnfinishedSession(userId)

        if (!recovered) {
            return {
                name: 'Crash Recovery',
                passed: false,
                details: 'Failed to find unfinished session',
            }
        }

        const locationCount = await queries.getLocationCount(recovered.id)
        const lastLocation = await queries.getLastLocation(recovered.id)

        const passed =
            recovered.id === session.id &&
            locationCount === 1 &&
            lastLocation !== null &&
            recovered.totalDistance === 1000 &&
            recovered.totalRuns === 2

        await queries.completeSession(session.id, Date.now())

        return {
            name: 'Crash Recovery',
            passed,
            details: `Session recovered: ${recovered.id}, locations: ${locationCount}, stats preserved: ${recovered.totalDistance}m`,
        }
    } catch (error) {
        return {
            name: 'Crash Recovery',
            passed: false,
            details: 'Test failed with error',
            error: error instanceof Error ? error.message : String(error),
        }
    }
}

export const testOfflineDataAccumulation = async (userId: string): Promise<TestResult> => {
    try {
        await initializeDatabase()

        const startTime = Date.now()
        const session = await queries.createSession(userId, startTime, 36.0, 128.0)

        for (let i = 0; i < 100; i++) {
            await queries.saveLocation(
                session.id,
                36.0 + i * 0.0001,
                128.0 + i * 0.0001,
                2000 - i * 5,
                8 + Math.random() * 4,
                5,
                startTime + i * 1000,
                'skiing' as ActivityState
            )
        }

        const unsyncedLocations = await queries.getUnsyncedLocations(session.id, 0, 100)

        const passed = unsyncedLocations.length === 100

        await queries.markLocationsSynced(unsyncedLocations.slice(0, 50).map((l) => l.id))

        const remainingUnsynced = await queries.getUnsyncedLocations(session.id, 0, 100)

        const markingWorked = remainingUnsynced.length === 50

        await queries.deleteSessionData(session.id)

        return {
            name: 'Offline Data Accumulation',
            passed: passed && markingWorked,
            details: `Accumulated 100 locations offline, marked 50 as synced, ${remainingUnsynced.length} remaining`,
        }
    } catch (error) {
        return {
            name: 'Offline Data Accumulation',
            passed: false,
            details: 'Test failed with error',
            error: error instanceof Error ? error.message : String(error),
        }
    }
}

export const testDataMergeLogic = async (userId: string): Promise<TestResult> => {
    try {
        await initializeDatabase()

        const startTime = Date.now()
        const session = await queries.createSession(userId, startTime, 36.0, 128.0)

        for (let i = 0; i < 10; i++) {
            await queries.saveLocation(
                session.id,
                36.0 + i * 0.0001,
                128.0 + i * 0.0001,
                2000 - i * 10,
                5,
                5,
                startTime + i * 1000,
                'skiing' as ActivityState
            )
        }

        await queries.saveRun(
            session.id,
            startTime,
            startTime + 60000,
            2000,
            1900,
            500,
            100,
            45,
            30,
            60
        )

        const existingRuns = await queries.getRuns(session.id)
        const existingRunIds = new Set(existingRuns.map((r) => r.id))

        const serverRuns = [
            {
                id: 'server-run-1',
                startTime: startTime + 100000,
                endTime: startTime + 160000,
                startAltitude: 1900,
                endAltitude: 1800,
                distance: 400,
                verticalDrop: 100,
                maxSpeed: 40,
                avgSpeed: 28,
                duration: 60,
            },
        ]

        for (const run of serverRuns) {
            if (!existingRunIds.has(run.id)) {
                await queries.saveRun(
                    session.id,
                    run.startTime,
                    run.endTime,
                    run.startAltitude,
                    run.endAltitude,
                    run.distance,
                    run.verticalDrop,
                    run.maxSpeed,
                    run.avgSpeed,
                    run.duration
                )
            }
        }

        const allRuns = await queries.getRuns(session.id)
        const passed = allRuns.length === 2

        await queries.deleteSessionData(session.id)

        return {
            name: 'Data Merge Logic',
            passed,
            details: `Local runs: 1, Server runs: 1, After merge: ${allRuns.length}`,
        }
    } catch (error) {
        return {
            name: 'Data Merge Logic',
            passed: false,
            details: 'Test failed with error',
            error: error instanceof Error ? error.message : String(error),
        }
    }
}

export const testSessionDeletion = async (userId: string): Promise<TestResult> => {
    try {
        await initializeDatabase()

        const startTime = Date.now()
        const session = await queries.createSession(userId, startTime, 36.0, 128.0)

        await queries.saveLocation(
            session.id,
            36.001,
            128.001,
            1900,
            10,
            5,
            startTime,
            'skiing' as ActivityState
        )
        await queries.saveRun(session.id, startTime, startTime + 60000, 2000, 1900, 500, 100, 45, 30, 60)
        await queries.savePhoto(session.id, 'file://photo.jpg', startTime + 30000, 36.0005, 128.0005)

        await queries.deleteSessionData(session.id)

        const deletedSession = await queries.getSession(session.id)
        const remainingLocations = await queries.getLocations(session.id)
        const remainingRuns = await queries.getRuns(session.id)
        const remainingPhotos = await queries.getPhotos(session.id)

        const passed =
            deletedSession === null &&
            remainingLocations.length === 0 &&
            remainingRuns.length === 0 &&
            remainingPhotos.length === 0

        return {
            name: 'Session Deletion',
            passed,
            details: `Session: ${deletedSession === null ? 'deleted' : 'exists'}, Locations: ${remainingLocations.length}, Runs: ${remainingRuns.length}, Photos: ${remainingPhotos.length}`,
        }
    } catch (error) {
        return {
            name: 'Session Deletion',
            passed: false,
            details: 'Test failed with error',
            error: error instanceof Error ? error.message : String(error),
        }
    }
}

export const runAllSyncTests = async (
    userId: string
): Promise<{
    results: TestResult[]
    summary: { passed: number; failed: number; total: number }
}> => {
    const results: TestResult[] = []

    results.push(await testLocalStoragePersistence(userId + '-test1'))
    results.push(await testCrashRecovery(userId + '-test2'))
    results.push(await testOfflineDataAccumulation(userId + '-test3'))
    results.push(await testDataMergeLogic(userId + '-test4'))
    results.push(await testSessionDeletion(userId + '-test5'))

    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length

    return {
        results,
        summary: {
            passed,
            failed,
            total: results.length,
        },
    }
}
