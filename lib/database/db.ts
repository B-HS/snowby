import * as SQLite from 'expo-sqlite'
import { ALL_TABLES, MIGRATIONS } from './schema'

let db: SQLite.SQLiteDatabase | null = null

export const getDatabase = async () => {
    if (db) return db
    db = await SQLite.openDatabaseAsync('snowby.db')
    return db
}

export const initializeDatabase = async () => {
    const database = await getDatabase()

    for (const statement of ALL_TABLES) {
        await database.execAsync(statement)
    }

    for (const migration of MIGRATIONS) {
        try {
            await database.execAsync(migration)
        } catch {
            // Migration already applied or column exists
        }
    }

    return database
}

export const closeDatabase = async () => {
    if (db) {
        await db.closeAsync()
        db = null
    }
}
