export const SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    start_latitude REAL NOT NULL,
    start_longitude REAL NOT NULL,
    total_distance REAL DEFAULT 0,
    max_vertical REAL DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    max_speed REAL DEFAULT 0,
    time_on_slope INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    is_synced INTEGER DEFAULT 0,
    last_synced_location_id INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
)`

export const LOCATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    altitude REAL NOT NULL,
    speed REAL NOT NULL,
    accuracy REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    activity_state TEXT NOT NULL,
    segment_index INTEGER DEFAULT 0,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
)`

export const LOCATIONS_SEGMENT_INDEX_MIGRATION = `
ALTER TABLE locations ADD COLUMN segment_index INTEGER DEFAULT 0
`

export const LOCATIONS_SESSION_INDEX = `
CREATE INDEX IF NOT EXISTS idx_locations_session ON locations(session_id)
`

export const LOCATIONS_TIMESTAMP_INDEX = `
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp)
`

export const RUNS_TABLE = `
CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    start_altitude REAL NOT NULL,
    end_altitude REAL NOT NULL,
    distance REAL NOT NULL,
    vertical_drop REAL NOT NULL,
    max_speed REAL NOT NULL,
    avg_speed REAL NOT NULL,
    duration INTEGER NOT NULL,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
)`

export const RUNS_SESSION_INDEX = `
CREATE INDEX IF NOT EXISTS idx_runs_session ON runs(session_id)
`

export const PHOTOS_TABLE = `
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    uri TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    taken_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
)`

export const ALL_TABLES = [
    SESSIONS_TABLE,
    LOCATIONS_TABLE,
    LOCATIONS_SESSION_INDEX,
    LOCATIONS_TIMESTAMP_INDEX,
    RUNS_TABLE,
    RUNS_SESSION_INDEX,
    PHOTOS_TABLE,
]

export const MIGRATIONS = [
    LOCATIONS_SEGMENT_INDEX_MIGRATION,
]
