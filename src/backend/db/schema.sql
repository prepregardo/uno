-- Схема базы данных для Winline Review

-- Таблица сессий парсинга
CREATE TABLE IF NOT EXISTS scrape_sessions (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    sports_count INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    markets_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- Виды спорта
CREATE TABLE IF NOT EXISTS sports (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    events_count INTEGER DEFAULT 0,
    markets_count INTEGER DEFAULT 0,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Турниры
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE NOT NULL,
    sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    events_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- События (матчи)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE NOT NULL,
    sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    home_team VARCHAR(255),
    away_team VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    is_live BOOLEAN DEFAULT false,
    markets_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Рынки (типы ставок)
CREATE TABLE IF NOT EXISTS markets (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) NOT NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    margin DECIMAL(5, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, event_id)
);

-- Исходы (варианты ставок с коэффициентами)
CREATE TABLE IF NOT EXISTS outcomes (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) NOT NULL,
    market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    odds DECIMAL(10, 2) NOT NULL,
    probability DECIMAL(5, 4),
    UNIQUE(external_id, market_id)
);

-- История маржи (для графиков и аналитики)
CREATE TABLE IF NOT EXISTS margin_history (
    id SERIAL PRIMARY KEY,
    sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
    sport_name VARCHAR(255) NOT NULL,
    market_type VARCHAR(50) NOT NULL,
    avg_margin DECIMAL(5, 2) NOT NULL,
    min_margin DECIMAL(5, 2),
    max_margin DECIMAL(5, 2),
    sample_size INTEGER NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE OR REPLACE VIEW sport_stats AS
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
WHERE s.is_active = true
ORDER BY s.events_count DESC;

-- Представление для статистики по типам рынков
CREATE OR REPLACE VIEW margin_by_market_type AS
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
