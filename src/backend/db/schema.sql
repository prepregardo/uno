-- Схема базы данных для Winline Review (SQLite)

-- Таблица сессий парсинга
CREATE TABLE IF NOT EXISTS scrape_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    sports_count INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    markets_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- Виды спорта
CREATE TABLE IF NOT EXISTS sports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT,
    events_count INTEGER DEFAULT 0,
    markets_count INTEGER DEFAULT 0,
    icon_url TEXT,
    is_active INTEGER DEFAULT 1,
    last_updated TEXT DEFAULT (datetime('now'))
);

-- Турниры
CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE NOT NULL,
    sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    country TEXT,
    events_count INTEGER DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now'))
);

-- События (матчи)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE NOT NULL,
    sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    home_team TEXT,
    away_team TEXT,
    start_time TEXT,
    is_live INTEGER DEFAULT 0,
    markets_count INTEGER DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now'))
);

-- Рынки (типы ставок)
CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT NOT NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    margin REAL,
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(external_id, event_id)
);

-- Исходы (варианты ставок с коэффициентами)
CREATE TABLE IF NOT EXISTS outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT NOT NULL,
    market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    odds REAL NOT NULL,
    probability REAL,
    UNIQUE(external_id, market_id)
);

-- История маржи (для графиков и аналитики)
CREATE TABLE IF NOT EXISTS margin_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
    sport_name TEXT NOT NULL,
    market_type TEXT NOT NULL,
    avg_margin REAL NOT NULL,
    min_margin REAL,
    max_margin REAL,
    sample_size INTEGER NOT NULL,
    collected_at TEXT DEFAULT (datetime('now'))
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_sports_active ON sports(is_active);
CREATE INDEX IF NOT EXISTS idx_events_sport ON events(sport_id);
CREATE INDEX IF NOT EXISTS idx_events_tournament ON events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_live ON events(is_live);
CREATE INDEX IF NOT EXISTS idx_markets_event ON markets(event_id);
CREATE INDEX IF NOT EXISTS idx_markets_type ON markets(type);
CREATE INDEX IF NOT EXISTS idx_outcomes_market ON outcomes(market_id);
CREATE INDEX IF NOT EXISTS idx_margin_history_sport ON margin_history(sport_id);
CREATE INDEX IF NOT EXISTS idx_margin_history_time ON margin_history(collected_at);

-- Представление для быстрого получения статистики по видам спорта
DROP VIEW IF EXISTS sport_stats;
CREATE VIEW sport_stats AS
SELECT
    s.id,
    s.name,
    s.events_count,
    s.markets_count,
    COALESCE(
        (SELECT AVG(m.margin)
         FROM markets m
         JOIN events e ON m.event_id = e.id
         WHERE e.sport_id = s.id AND m.margin IS NOT NULL),
        0
    ) as avg_margin,
    s.last_updated
FROM sports s
WHERE s.is_active = 1
ORDER BY s.events_count DESC;

-- Представление для статистики по типам рынков
DROP VIEW IF EXISTS margin_by_market_type;
CREATE VIEW margin_by_market_type AS
SELECT
    s.name as sport_name,
    m.type as market_type,
    AVG(m.margin) as avg_margin,
    MIN(m.margin) as min_margin,
    MAX(m.margin) as max_margin,
    COUNT(*) as sample_size
FROM markets m
JOIN events e ON m.event_id = e.id
JOIN sports s ON e.sport_id = s.id
WHERE m.margin IS NOT NULL
GROUP BY s.name, m.type
ORDER BY s.name, m.type;
